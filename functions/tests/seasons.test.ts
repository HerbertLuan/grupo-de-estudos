import * as admin from 'firebase-admin';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSeason, officialPodium, seasonInput, transitionSeason } from '../src/services/seasonService';
import { finishStudySession } from '../src/services/timerService';
import { getZonedDateString } from '../src/utils/timezone';
import type { GroupMember } from '../src/types';

describe('Validação de temporadas', () => {
  const base = { groupId: 'g', name: 'Maratona', startDate: '2026-09-01', endDate: '2026-09-30' };
  it('rejeita datas inexistentes, intervalo invertido e nome vazio', () => {
    expect(seasonInput.safeParse({ ...base, startDate: '2026-02-30' }).success).toBe(false);
    expect(seasonInput.safeParse({ ...base, endDate: '2026-08-31' }).success).toBe(false);
    expect(seasonInput.safeParse({ ...base, name: ' ' }).success).toBe(false);
    expect(seasonInput.safeParse(base).success).toBe(true);
  });
  it('pódio usa pontos, tempo, entrada e uid; ignora outra temporada e inativos', () => {
    const member = (uid: string, points: number, seconds: number, joined: number, seasonId = 's') => ({ uid, name: uid, nickname: uid, seasonId, seasonPoints: points, seasonStudySeconds: seconds, joinedAt: admin.firestore.Timestamp.fromMillis(joined) } as GroupMember);
    expect(officialPodium([member('b', 2, 7200, 1), member('a', 2, 7200, 1), member('c', 2, 7300, 2), member('d', 0, 0, 0), member('old', 100, 90000, 0, 'old')], 's').map(w => w.uid)).toEqual(['c', 'a', 'b']);
  });
});

// Real Firestore transactions; never execute against a cloud project.
describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Temporadas — integração Firestore', () => {
  const db = admin.firestore();
  let groupId: string;
  let uid: string;
  let today: string;
  beforeEach(async () => {
    groupId = db.collection('groups').doc().id;
    uid = `admin_${groupId}`;
    today = getZonedDateString(new Date(), 'America/Sao_Paulo');
    await db.doc(`groups/${groupId}`).set({ ownerId: uid, timezone: 'America/Sao_Paulo', activeSeasonId: null });
    await db.doc(`groups/${groupId}/members/${uid}`).set({ uid, name: 'Admin', nickname: 'admin', role: 'admin', totalPoints: 42, totalStudySeconds: 100000, seasonPoints: 20, seasonStudySeconds: 10000, seasonId: 'old', joinedAt: admin.firestore.Timestamp.now() });
  });
  const create = () => createSeason(uid, { groupId, name: 'Teste', startDate: today, endDate: today });
  it('restringe administração e rejeita início futuro', async () => {
    await expect(createSeason('intruso', { groupId, name: 'Teste', startDate: today, endDate: today })).rejects.toMatchObject({ code: 'permission-denied' });
    const s = await create();
    await expect(transitionSeason('intruso', s.id, 'start')).rejects.toMatchObject({ code: 'permission-denied' });
    await db.doc(`seasons/${s.id}`).update({ startDate: '2099-01-01', endDate: '2099-12-31' });
    await expect(transitionSeason(uid, s.id, 'start')).rejects.toMatchObject({ code: 'failed-precondition' });
  });
  it('inícios concorrentes deixam só uma temporada ativa e preservam totais', async () => {
    const a = await create(); const b = await create();
    const results = await Promise.allSettled([transitionSeason(uid, a.id, 'start'), transitionSeason(uid, b.id, 'start')]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((await db.doc(`groups/${groupId}/members/${uid}`).get()).data()).toMatchObject({ seasonPoints: 0, seasonStudySeconds: 0, totalPoints: 42, totalStudySeconds: 100000 });
  });
  it('encerramento concorrente gera pódio, troféu e feed únicos; nova temporada não altera arquivo', async () => {
    const s = await create(); await transitionSeason(uid, s.id, 'start');
    await db.doc(`groups/${groupId}/members/${uid}`).update({ seasonPoints: 2, seasonStudySeconds: 8000 });
    await Promise.all([transitionSeason(uid, s.id, 'close'), transitionSeason(uid, s.id, 'close')]);
    expect((await db.doc(`seasons/${s.id}`).get()).data()).toMatchObject({ active: false, status: 'closed', podium: [{ uid, points: 2, rank: 1 }] });
    expect((await db.collection(`users/${uid}/badges`).get()).size).toBe(1);
    expect((await db.collection('feed').where('groupId', '==', groupId).get()).size).toBe(1);
    const next = await create(); await transitionSeason(uid, next.id, 'start');
    expect((await db.doc(`seasons/${s.id}`).get()).data()?.podium[0].points).toBe(2);
    await expect(transitionSeason(uid, s.id, 'start')).rejects.toMatchObject({ code: 'failed-precondition' });
  });
  it('fecha automaticamente somente depois do último dia, mesmo sem participantes', async () => {
    const s = await create(); await transitionSeason(uid, s.id, 'start');
    expect(await transitionSeason(null, s.id, 'close')).toEqual({ success: false });
    await db.doc(`seasons/${s.id}`).update({ endDate: '2000-01-01' });
    await transitionSeason(null, s.id, 'close');
    expect((await db.doc(`seasons/${s.id}`).get()).data()).toMatchObject({ status: 'closed', podium: [] });
  });
  it('reinicia todos os membros de um grupo com mais de 500 participantes atomicamente', async () => {
    const writer = db.bulkWriter();
    for (let i = 0; i < 505; i++) writer.set(db.doc(`groups/${groupId}/members/m${i}`), { seasonId: 'old', seasonPoints: 9, seasonStudySeconds: 99, totalPoints: 50 });
    await writer.close();
    const s = await create(); await transitionSeason(uid, s.id, 'start');
    const members = await db.collection(`groups/${groupId}/members`).get();
    expect(members.size).toBe(506);
    expect(members.docs.every(m => m.data().seasonId === s.id && m.data().seasonPoints === 0 && m.data().seasonStudySeconds === 0)).toBe(true);
    expect(members.docs.filter(m => m.id !== uid).every(m => m.data().totalPoints === 50)).toBe(true);
  });
  it('cronômetro respeita corte, soma pontos da temporada e preserva histórico após encerramento', async () => {
    const s = await create(); await transitionSeason(uid, s.id, 'start');
    // Legacy seeded seasons have createdAt but no startedAt.
    await db.doc(`seasons/${s.id}`).update({ startedAt: admin.firestore.FieldValue.delete(), createdAt: admin.firestore.Timestamp.fromMillis(Date.now() - 10000) });
    await db.doc(`users/${uid}`).set({ uid, groupId, nickname: 'admin', name: 'Admin', avatarUrl: null, totalPoints: 42, totalStudySeconds: 100000, currentStreak: 0, longestStreak: 0, lastCompletedDate: null });
    async function finish(sessionId: string, seconds: number) {
      const now = admin.firestore.Timestamp.now();
      await db.doc(`users/${uid}`).update({ activeSessionId: sessionId });
      await db.doc(`users/${uid}/studySessions/${sessionId}`).set({ id: sessionId, userId: uid, groupId, studyDate: today, status: 'paused', startedAt: now, lastResumedAt: null, accumulatedSeconds: seconds });
      return finishStudySession(uid);
    }
    await finish('first', 3600);
    expect((await db.doc(`groups/${groupId}/members/${uid}`).get()).data()).toMatchObject({ seasonPoints: 1, seasonStudySeconds: 3600, totalPoints: 43 });
    await transitionSeason(uid, s.id, 'close');
    await finish('after', 3600);
    expect((await db.doc(`groups/${groupId}/members/${uid}`).get()).data()).toMatchObject({ seasonPoints: 1, seasonStudySeconds: 3600, totalStudySeconds: 107200 });
    expect((await db.doc(`seasons/${s.id}`).get()).data()?.podium[0].studySeconds).toBe(3600);
  });
});
