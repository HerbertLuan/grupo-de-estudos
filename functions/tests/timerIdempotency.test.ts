import * as admin from 'firebase-admin';
import { beforeEach, describe, expect, it } from 'vitest';
import { finishStudySession } from '../src/services/timerService';
import { getZonedDateString } from '../src/utils/timezone';

// Requires the Firestore emulator. Never execute these transactions against production.
describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Finalização idempotente do temporizador', () => {
  const db = admin.firestore();
  let uid: string;
  let groupId: string;
  let sessionId: string;
  let studyDate: string;

  beforeEach(async () => {
    uid = `timer_${db.collection('users').doc().id}`;
    groupId = db.collection('groups').doc().id;
    sessionId = db.collection('studySessions').doc().id;
    studyDate = getZonedDateString(new Date(), 'America/Sao_Paulo');
    const now = admin.firestore.Timestamp.now();
    await db.doc(`groups/${groupId}`).set({ timezone: 'America/Sao_Paulo', activeSeasonId: null });
    await db.doc(`groups/${groupId}/members/${uid}`).set({ uid, groupId, name: 'Teste', nickname: 'teste', totalPoints: 0, totalStudySeconds: 0 });
    await db.doc(`users/${uid}`).set({ uid, groupId, name: 'Teste', nickname: 'teste', activeSessionId: sessionId,
      totalPoints: 0, totalStudySeconds: 0, currentStreak: 0, longestStreak: 0, lastCompletedDate: null });
    await db.doc(`users/${uid}/studySessions/${sessionId}`).set({ id: sessionId, userId: uid, groupId, studyDate,
      status: 'paused', startedAt: now, lastResumedAt: null, accumulatedSeconds: 120 });
  });

  it('devolve o mesmo resultado para chamadas simultâneas e soma o tempo uma vez', async () => {
    const [first, second] = await Promise.all([
      finishStudySession(uid, sessionId),
      finishStudySession(uid, sessionId),
    ]);
    expect(second).toEqual(first);
    expect(first.sessionSeconds).toBe(120);
    expect((await db.doc(`users/${uid}/dailyStudy/${studyDate}`).get()).data()).toMatchObject({ totalSeconds: 120, totalSessions: 1 });
    expect((await db.doc(`users/${uid}`).get()).data()).toMatchObject({ activeSessionId: null, totalStudySeconds: 120 });
  });

  it('não finaliza uma nova sessão por causa de uma chamada atrasada', async () => {
    const first = await finishStudySession(uid, sessionId);
    await db.doc(`users/${uid}`).update({ activeSessionId: 'new-session' });
    expect(await finishStudySession(uid, sessionId)).toEqual(first);
    expect((await db.doc(`users/${uid}`).get()).data()?.activeSessionId).toBe('new-session');
  });
});
