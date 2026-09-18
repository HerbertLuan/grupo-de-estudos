import * as admin from 'firebase-admin';
import { beforeEach, describe, expect, it } from 'vitest';
import { confirmStudySession, finishStudySession, getCurrentSession, resolveStudySession, startStudySession } from '../src/services/timerService';

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Proteção contra sessões esquecidas', () => {
  if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-timer-review' });
  const db = admin.firestore();
  let uid: string;
  let groupId: string;

  beforeEach(async () => {
    uid = `timer_${db.collection('users').doc().id}`;
    groupId = db.collection('groups').doc().id;
    await db.doc(`groups/${groupId}`).set({ timezone: 'America/Sao_Paulo', activeSeasonId: null });
    await db.doc(`groups/${groupId}/members/${uid}`).set({ uid, groupId, name: 'Teste', nickname: 'teste', totalPoints: 0, totalStudySeconds: 0 });
    await db.doc(`users/${uid}`).set({ uid, groupId, name: 'Teste', nickname: 'teste', activeSessionId: null,
      totalPoints: 0, totalStudySeconds: 0, currentStreak: 0, longestStreak: 0, lastCompletedDate: null });
  });

  async function ageSession(id: string, seconds: number) {
    const old = admin.firestore.Timestamp.fromMillis(Date.now() - seconds * 1000);
    await db.doc(`users/${uid}/studySessions/${id}`).update({ startedAt: old, lastResumedAt: old });
  }

  it('avisa em 3 horas e uma confirmação abre novo período', async () => {
    const session = await startStudySession(uid, { mode: 'stopwatch' });
    await ageSession(session.id, 3 * 3600 + 60);
    const due = await getCurrentSession(uid);
    expect(due.reviewDueSeconds).toBe(3 * 3600);
    expect(due.requiresReview).toBe(false);
    await confirmStudySession(uid, session.id);
    const after = await getCurrentSession(uid);
    expect(after.reviewDueSeconds).toBeGreaterThan(6 * 3600);
    expect(after.requiresReview).toBe(false);
  });

  it('limita sessão abandonada e registra apenas o tempo revisado', async () => {
    const session = await startStudySession(uid, { mode: 'stopwatch' });
    await ageSession(session.id, 12 * 3600);
    const pending = await getCurrentSession(uid);
    expect(pending.requiresReview).toBe(true);
    expect(pending.currentElapsedSeconds).toBe(3 * 3600 + 30 * 60);
    await expect(finishStudySession(uid, session.id)).rejects.toMatchObject({ code: 'failed-precondition' });
    const resolved = await resolveStudySession(uid, session.id, 'finish', 20 * 60);
    expect(resolved.action).toBe('finish');
    expect(resolved.result?.sessionSeconds).toBe(20 * 60);
    expect((await db.doc(`users/${uid}/dailyStudy/${session.studyDate}`).get()).data()?.totalSeconds).toBe(20 * 60);
  });

  it('continua sem contar o intervalo abandonado', async () => {
    const session = await startStudySession(uid, { mode: 'stopwatch' });
    await ageSession(session.id, 8 * 3600);
    await resolveStudySession(uid, session.id, 'continue', 30 * 60);
    const current = await getCurrentSession(uid);
    expect(current.requiresReview).toBe(false);
    expect(current.currentElapsedSeconds).toBeLessThan(31 * 60);
    const result = await finishStudySession(uid, session.id);
    expect(result.sessionSeconds).toBeLessThan(31 * 60);
  });

  it('não aceita tempo acima do limite e permite revisar sessão pausada', async () => {
    const session = await startStudySession(uid, { mode: 'stopwatch' });
    const ref = db.doc(`users/${uid}/studySessions/${session.id}`);
    await ref.update({ status: 'paused', lastResumedAt: null, accumulatedSeconds: 4 * 3600 });
    await expect(resolveStudySession(uid, session.id, 'finish', 4 * 3600)).rejects.toMatchObject({ code: 'invalid-argument' });
    const resolved = await resolveStudySession(uid, session.id, 'continue', 2 * 3600);
    expect(resolved.action).toBe('continue');
    expect((await ref.get()).data()).toMatchObject({ status: 'active', accumulatedSeconds: 2 * 3600 });
  });

  it('finaliza temporizador expirado sem contar horas extras', async () => {
    const session = await startStudySession(uid, { mode: 'timer', focusDurationSeconds: 25 * 60 });
    await ageSession(session.id, 5 * 3600);
    const current = await getCurrentSession(uid);
    expect(current.hasActiveSession).toBe(false);
    expect(current.autoFinishedResult?.sessionSeconds).toBe(25 * 60);
    expect(current.autoFinishedResult?.totalPoints).toBe(0);
    expect((await db.doc(`users/${uid}`).get()).data()?.activeSessionId).toBeNull();
  });
});
