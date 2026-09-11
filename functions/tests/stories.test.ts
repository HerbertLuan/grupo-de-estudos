import * as admin from 'firebase-admin';
import { beforeEach, describe, expect, it } from 'vitest';
import { cleanupExpiredStories, initializeStoryPresence, nextStoryMidnight, prepareStory, publishStory, reactToStory, removeStory } from '../src/services/storyService';
import { discardStudySession, pauseStudySession, resumeStudySession, startStudySession } from '../src/services/timerService';

describe('Stories — meia-noite do grupo', () => {
  it('expira na próxima meia-noite de São Paulo, inclusive na virada do ano', () => {
    expect(nextStoryMidnight(new Date('2026-12-31T23:50:00-03:00'), 'America/Sao_Paulo').toISOString()).toBe('2027-01-01T03:00:00.000Z');
    expect(nextStoryMidnight(new Date('2026-09-11T03:00:00Z'), 'America/Sao_Paulo').toISOString()).toBe('2026-09-12T03:00:00.000Z');
  });
  it('respeita dias de 23 e 25 horas e fusos fracionários', () => {
    expect(nextStoryMidnight(new Date('2026-03-08T05:00:00Z'), 'America/New_York').toISOString()).toBe('2026-03-09T04:00:00.000Z');
    expect(nextStoryMidnight(new Date('2026-11-01T04:00:00Z'), 'America/New_York').toISOString()).toBe('2026-11-02T05:00:00.000Z');
    expect(nextStoryMidnight(new Date('2026-09-11T00:00:00Z'), 'Asia/Kolkata').toISOString()).toBe('2026-09-11T18:30:00.000Z');
  });
});

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST)('Stories — integração real', () => {
  const db = admin.firestore();
  let uid: string; let groupId: string; let peer: string;
  beforeEach(async () => {
    groupId = db.collection('groups').doc().id; uid = `u_${groupId}`; peer = `p_${groupId}`;
    await db.doc(`groups/${groupId}`).set({ timezone: 'America/Sao_Paulo' });
    for (const user of [uid, peer]) {
      await db.doc(`users/${user}`).set({ uid: user, name: user, nickname: user, groupId, activeSessionId: null });
      await db.doc(`groups/${groupId}/members/${user}`).set({ uid: user, name: user });
    }
  });
  async function upload() {
    const data = await prepareStory(uid);
    await admin.storage().bucket().file(data.storagePath).save(Buffer.from('test-image'), { metadata: { contentType: 'image/jpeg', metadata: { storyId: data.storyId } } });
    return data;
  }
  it('publica presença atomicamente ao iniciar, pausar, retomar e descartar', async () => {
    const ref = db.doc(`groups/${groupId}/members/${uid}`);
    const session = await startStudySession(uid);
    expect((await ref.get()).data()).toMatchObject({ activeSessionId: session.id, sessionStatus: 'active' });
    await pauseStudySession(uid); expect((await ref.get()).data()?.sessionStatus).toBe('paused');
    await resumeStudySession(uid); expect((await ref.get()).data()?.sessionStatus).toBe('active');
    await discardStudySession(uid); expect((await ref.get()).data()).toMatchObject({ activeSessionId: null, sessionStatus: null });
  });
  it('rejeita postagem sem sessão e valida novamente após o upload', async () => {
    await expect(prepareStory(uid)).rejects.toMatchObject({ code: 'failed-precondition' });
    await startStudySession(uid); const data = await upload(); await discardStudySession(uid);
    await expect(publishStory(uid, data.storyId)).rejects.toMatchObject({ code: 'failed-precondition' });
    expect((await db.doc(`studyStories/${data.storyId}`).get()).data()?.published).toBe(false);
  });
  it('permite foto pausada, troca sem migrar reações e remove arquivo antigo', async () => {
    await startStudySession(uid); await pauseStudySession(uid);
    const a = await upload(); await publishStory(uid, a.storyId);
    await reactToStory(peer, { storyId: a.storyId, emoji: '🔥' });
    const b = await upload(); await publishStory(uid, b.storyId);
    expect((await admin.storage().bucket().file(a.storagePath).exists())[0]).toBe(false);
    expect((await db.doc(`studyStories/${a.storyId}`).get()).exists).toBe(false);
    expect((await db.collection(`studyStories/${b.storyId}/reactions`).get()).empty).toBe(true);
    await discardStudySession(uid);
    expect((await db.doc(`studyStories/${b.storyId}`).get()).data()?.published).toBe(true);
    await removeStory(uid, b.storyId);
    expect((await admin.storage().bucket().file(b.storagePath).exists())[0]).toBe(false);
  });
  it('substitui a foto e apaga reações mesmo após perder a referência no perfil', async () => {
    await startStudySession(uid);
    const a = await upload(); await publishStory(uid, a.storyId);
    await reactToStory(peer, { storyId: a.storyId, emoji: '🔥' });
    await db.doc(`users/${uid}`).update({ activeStoryId: admin.firestore.FieldValue.delete() });
    const b = await upload(); await publishStory(uid, b.storyId);
    expect((await db.doc(`studyStories/${a.storyId}`).get()).exists).toBe(false);
    expect((await db.collection(`studyStories/${a.storyId}/reactions`).get()).empty).toBe(true);
    expect((await admin.storage().bucket().file(a.storagePath).exists())[0]).toBe(false);
    expect((await db.doc(`studyStories/${b.storyId}`).get()).data()?.published).toBe(true);
    // A stale pointer must not make the next publication fail with a missing document.
    await db.doc(`users/${uid}`).update({ activeStoryId: 'missing-story' });
    const c = await upload(); await publishStory(uid, c.storyId);
    expect((await db.doc(`studyStories/${b.storyId}`).get()).exists).toBe(false);
    expect((await db.doc(`users/${uid}`).get()).data()?.activeStoryId).toBe(c.storyId);
  });
  it('mantém uma foto em publicações concorrentes', async () => {
    await startStudySession(uid); const a = await upload(); const b = await upload();
    await Promise.all([publishStory(uid, a.storyId), publishStory(uid, b.storyId)]);
    const all = await db.collection('studyStories').where('userId', '==', uid).get();
    expect(all.docs.filter(d => d.data().published)).toHaveLength(1);
    const active = all.docs.find(d => d.data().published)!;
    expect((await admin.storage().bucket().file(active.data().storagePath).exists())[0]).toBe(true);
  });
  it('restringe reações, substitui e remove uma reação por UID', async () => {
    await startStudySession(uid); const a = await upload(); await publishStory(uid, a.storyId);
    await expect(reactToStory(uid, { storyId: a.storyId, emoji: '🔥' })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(reactToStory('intruder', { storyId: a.storyId, emoji: '🔥' })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(reactToStory(peer, { storyId: a.storyId, emoji: '❤️' })).rejects.toThrow();
    await expect(removeStory(peer, a.storyId)).rejects.toMatchObject({ code: 'permission-denied' });
    await reactToStory(peer, { storyId: a.storyId, emoji: '🔥' });
    await reactToStory(peer, { storyId: a.storyId, emoji: '📚' });
    const reactions = db.collection(`studyStories/${a.storyId}/reactions`);
    expect((await reactions.get()).docs.map(d => d.data().emoji)).toEqual(['📚']);
    await reactToStory(peer, { storyId: a.storyId, emoji: null });
    expect((await reactions.get()).empty).toBe(true);
  });
  it('expiração exclui foto e reações, preserva sessão e é idempotente', async () => {
    const session = await startStudySession(uid); const a = await upload(); await publishStory(uid, a.storyId);
    await reactToStory(peer, { storyId: a.storyId, emoji: '💪' });
    await db.doc(`studyStories/${a.storyId}`).update({ expiresAt: admin.firestore.Timestamp.fromMillis(1) });
    await expect(reactToStory(peer, { storyId: a.storyId, emoji: '🔥' })).rejects.toMatchObject({ code: 'failed-precondition' });
    await cleanupExpiredStories(); await cleanupExpiredStories();
    expect((await db.collection(`studyStories/${a.storyId}/reactions`).get()).empty).toBe(true);
    expect((await admin.storage().bucket().file(a.storagePath).exists())[0]).toBe(false);
    expect((await db.doc(`users/${uid}`).get()).data()).toMatchObject({ activeSessionId: session.id, activeStoryId: null });
  });
  it('migra sessões existentes sem sobrescrever a presença já atualizada', async () => {
    await db.doc(`users/${uid}`).update({ activeSessionId: 'legacy' });
    await db.doc(`users/${uid}/studySessions/legacy`).set({ groupId, status: 'paused' });
    await initializeStoryPresence(peer);
    expect((await db.doc(`groups/${groupId}/members/${uid}`).get()).data()).toMatchObject({ activeSessionId: 'legacy', sessionStatus: 'paused' });
    await discardStudySession(uid); await initializeStoryPresence(peer);
    expect((await db.doc(`groups/${groupId}/members/${uid}`).get()).data()?.activeSessionId).toBeNull();
  });
});
