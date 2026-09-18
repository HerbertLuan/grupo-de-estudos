import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { ActiveSessionState, DailyStudy, Group, StudySession, UserProfile } from '../types';
import { DEFAULT_TIMEZONE, POINTS_THRESHOLD_SECONDS } from '../config/constants';
import { getCurrentMonthId, getCurrentWeekId, getZonedDateString } from '../utils/timezone';
import {
  calculateLevel,
  calculateStreakOnDayCompletion,
  emitFeedEvent,
  evaluateAndAwardBadges,
} from './gamificationService';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export interface FinishSessionResult {
  sessionId: string;
  studyDate: string;
  sessionSeconds: number;
  dailyTotalSeconds: number;
  pointEarnedNow: boolean;
  totalPoints: number;
  currentStreak: number;
  newBadgesCount: number;
}

/**
 * Inicia uma nova sessão de estudo com garantia atômica de que o usuário só pode ter uma sessão ativa
 */
export async function startStudySession(uid: string): Promise<StudySession> {
  const userRef = db.collection('users').doc(uid);

  return await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Perfil do usuário não encontrado.');
    }
    const userData = userSnap.data() as UserProfile;

    if (!userData.groupId) {
      throw new HttpsError('failed-precondition', 'Você precisa ingressar em um grupo antes de iniciar uma sessão.');
    }

    // Regra: Uma única sessão ativa/pausada permitida por usuário
    if (userData.activeSessionId) {
      const activeSessionRef = userRef.collection('studySessions').doc(userData.activeSessionId);
      const activeSnap = await tx.get(activeSessionRef);
      if (activeSnap.exists) {
        const activeData = activeSnap.data() as StudySession;
        if (activeData.status === 'active' || activeData.status === 'paused') {
          throw new HttpsError(
            'failed-precondition',
            'Você já possui uma sessão de estudo em andamento ou pausada. Finalize-a antes de iniciar uma nova.'
          );
        }
      }
    }

    // Busca o fuso horário do grupo
    const groupRef = db.collection('groups').doc(userData.groupId);
    const groupSnap = await tx.get(groupRef);
    const timezone = groupSnap.exists ? (groupSnap.data() as Group).timezone : DEFAULT_TIMEZONE;

    const now = admin.firestore.Timestamp.now();
    const todayStr = getZonedDateString(now.toDate(), timezone);

    const sessionRef = userRef.collection('studySessions').doc();
    const newSession: StudySession = {
      id: sessionRef.id,
      userId: uid,
      groupId: userData.groupId,
      studyDate: todayStr,
      status: 'active',
      startedAt: now,
      lastResumedAt: now,
      pausedAt: null,
      endedAt: null,
      accumulatedSeconds: 0,
      totalSeconds: 0,
      createdAt: now,
      updatedAt: now,
    };

    tx.set(sessionRef, newSession);
    tx.set(groupRef.collection('members').doc(uid), { activeSessionId: sessionRef.id, sessionStatus: 'active' }, { merge: true });
    tx.update(userRef, {
      activeSessionId: sessionRef.id,
      updatedAt: now,
    });

    return newSession;
  });
}

/**
 * Pausa a sessão ativa do usuário
 */
export async function pauseStudySession(uid: string): Promise<StudySession> {
  const userRef = db.collection('users').doc(uid);

  return await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado.');
    }
    const userData = userSnap.data() as UserProfile;

    if (!userData.activeSessionId) {
      throw new HttpsError('failed-precondition', 'Não há sessão ativa para pausar.');
    }

    const sessionRef = userRef.collection('studySessions').doc(userData.activeSessionId);
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Sessão de estudo não encontrada.');
    }
    const session = sessionSnap.data() as StudySession;

    if (session.status !== 'active') {
      throw new HttpsError('failed-precondition', `Não é possível pausar uma sessão com status "${session.status}".`);
    }

    const now = admin.firestore.Timestamp.now();
    const lastResumedMillis = session.lastResumedAt?.toMillis() || session.startedAt.toMillis();
    const elapsedSinceResume = Math.max(0, Math.floor((now.toMillis() - lastResumedMillis) / 1000));
    const newAccumulated = session.accumulatedSeconds + elapsedSinceResume;

    const updatedSession: Partial<StudySession> = {
      status: 'paused',
      pausedAt: now,
      lastResumedAt: null,
      accumulatedSeconds: newAccumulated,
      updatedAt: now,
    };

    tx.update(sessionRef, updatedSession);
    tx.set(db.doc(`groups/${session.groupId}/members/${uid}`), { activeSessionId: session.id, sessionStatus: updatedSession.status }, { merge: true });

    return {
      ...session,
      ...updatedSession,
    } as StudySession;
  });
}

/**
 * Retoma uma sessão pausada
 */
export async function resumeStudySession(uid: string): Promise<StudySession> {
  const userRef = db.collection('users').doc(uid);

  return await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado.');
    }
    const userData = userSnap.data() as UserProfile;

    if (!userData.activeSessionId) {
      throw new HttpsError('failed-precondition', 'Não há sessão para retomar.');
    }

    const sessionRef = userRef.collection('studySessions').doc(userData.activeSessionId);
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Sessão de estudo não encontrada.');
    }
    const session = sessionSnap.data() as StudySession;

    if (session.status !== 'paused') {
      throw new HttpsError('failed-precondition', `Não é possível retomar uma sessão com status "${session.status}".`);
    }

    const now = admin.firestore.Timestamp.now();
    const updatedSession: Partial<StudySession> = {
      status: 'active',
      lastResumedAt: now,
      pausedAt: null,
      updatedAt: now,
    };

    tx.update(sessionRef, updatedSession);
    tx.set(db.doc(`groups/${session.groupId}/members/${uid}`), { activeSessionId: session.id, sessionStatus: updatedSession.status }, { merge: true });

    return {
      ...session,
      ...updatedSession,
    } as StudySession;
  });
}

/**
 * Finaliza a sessão de estudo e processa:
 * - Tempo líquido estudado
 * - Virada da meia-noite (credita na data de início da sessão)
 * - Consolidação no dailyStudy/{YYYY-MM-DD}
 * - Conquista idempotente de ponto (60 min = 1 ponto, máx. 1 ponto/dia)
 * - Atualização de streaks e recordes
 * - Atualização do nível do usuário
 * - Agregados do grupo para ranking (semana, mês, temporada, geral)
 * - Concessão de badges e publicação de eventos no feed
 */
export async function finishStudySession(uid: string): Promise<FinishSessionResult> {
  const userRef = db.collection('users').doc(uid);

  // Executa transação atômica
  const transactionResult = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado.');
    }
    const userData = userSnap.data() as UserProfile;

    if (!userData.activeSessionId) {
      throw new HttpsError('failed-precondition', 'Nenhuma sessão em andamento para finalizar.');
    }

    const sessionRef = userRef.collection('studySessions').doc(userData.activeSessionId);
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Documento da sessão não encontrado.');
    }
    const session = sessionSnap.data() as StudySession;

    if (session.status !== 'active' && session.status !== 'paused') {
      throw new HttpsError('failed-precondition', 'A sessão já foi finalizada anteriormente.');
    }

    const now = admin.firestore.Timestamp.now();
    let finalSessionSeconds = session.accumulatedSeconds;

    if (session.status === 'active' && session.lastResumedAt) {
      const elapsedSinceResume = Math.max(0, Math.floor((now.toMillis() - session.lastResumedAt.toMillis()) / 1000));
      finalSessionSeconds += elapsedSinceResume;
    }

    // A data de estudo atribuída é a data em que a sessão iniciou (regra da meia-noite)
    const targetStudyDate = session.studyDate;

    // Referências para leituras e escritas
    const dailyRef = userRef.collection('dailyStudy').doc(targetStudyDate);
    const memberRef = db.collection('groups').doc(session.groupId).collection('members').doc(uid);
    const groupRef = db.collection('groups').doc(session.groupId);
    const userBadgesRef = userRef.collection('badges');

    // Executa TODAS as leituras restantes da transação antes de qualquer escrita
    const [dailySnap, memberSnap, groupSnap, existingBadgesSnap] = await Promise.all([
      tx.get(dailyRef),
      tx.get(memberRef),
      tx.get(groupRef),
      tx.get(userBadgesRef),
    ]);
    const activeSeasonId = groupSnap.data()?.activeSeasonId;
    const seasonSnap = activeSeasonId ? await tx.get(db.collection('seasons').doc(activeSeasonId)) : null;
    const season = seasonSnap?.data();
    const seasonToday = getZonedDateString(now.toDate(), groupSnap.data()?.timezone || DEFAULT_TIMEZONE);
    // Only sessions started and completed within the active competition qualify.
    const countsForSeason = !!(season?.active && seasonToday >= season.startDate && seasonToday <= season.endDate &&
      session.startedAt.toMillis() >= (season.startedAt?.toMillis() ?? season.createdAt?.toMillis() ?? Infinity));
    const seasonDailySeconds = (dailySnap.data()?.seasonId === activeSeasonId ? dailySnap.data()?.seasonSeconds || 0 : 0) + finalSessionSeconds;
    const seasonPointAlreadyEarned = dailySnap.data()?.seasonId === activeSeasonId && dailySnap.data()?.seasonPointEarned === true;
    const seasonPointEarnedNow = countsForSeason && !seasonPointAlreadyEarned && seasonDailySeconds >= POINTS_THRESHOLD_SECONDS;

    // ========================================================================
    // CÁLCULOS EM MEMÓRIA
    // ========================================================================
    const prevDailySeconds = dailySnap.exists ? (dailySnap.data() as DailyStudy).totalSeconds || 0 : 0;
    const prevPointEarned = dailySnap.exists ? (dailySnap.data() as DailyStudy).pointEarned || false : false;
    const prevSessionsCount = dailySnap.exists ? (dailySnap.data() as DailyStudy).totalSessions || 0 : 0;

    const newDailySeconds = prevDailySeconds + finalSessionSeconds;
    let pointEarnedNow = false;

    // Conquista do ponto: 60 minutos (3600 segundos) e ainda não havia conquistado hoje
    if (newDailySeconds >= POINTS_THRESHOLD_SECONDS && !prevPointEarned) {
      pointEarnedNow = true;
    }

    const updatedDaily: DailyStudy = {
      id: targetStudyDate,
      userId: uid,
      groupId: session.groupId,
      date: targetStudyDate,
      totalSeconds: newDailySeconds,
      totalSessions: prevSessionsCount + 1,
      pointEarned: prevPointEarned || pointEarnedNow,
      pointEarnedAt: pointEarnedNow ? now : dailySnap.exists ? (dailySnap.data() as DailyStudy).pointEarnedAt : null,
      updatedAt: now,
    };

    // Atualiza agregados do usuário
    const prevTotalPoints = userData.totalPoints || 0;
    const newTotalPoints = pointEarnedNow ? prevTotalPoints + 1 : prevTotalPoints;
    const newTotalStudySeconds = (userData.totalStudySeconds || 0) + finalSessionSeconds;

    // Atualiza nível baseado nas horas
    const levelInfo = calculateLevel(newTotalStudySeconds);

    // Atualiza streak se ganhou ponto
    let newCurrentStreak = userData.currentStreak || 0;
    let newLongestStreak = userData.longestStreak || 0;
    let newLastCompletedDate = userData.lastCompletedDate || null;

    if (pointEarnedNow) {
      const streakCalc = calculateStreakOnDayCompletion(
        userData.currentStreak || 0,
        userData.longestStreak || 0,
        userData.lastCompletedDate,
        targetStudyDate
      );
      newCurrentStreak = streakCalc.currentStreak;
      newLongestStreak = streakCalc.longestStreak;
      newLastCompletedDate = streakCalc.lastCompletedDate;
    }

    // Membro do grupo (para consultas eficientes de ranking)
    let updatedMemberData: any = null;
    if (memberSnap.exists) {
      const memberData = memberSnap.data()!;
      const timezone = groupSnap.exists ? groupSnap.data()?.timezone || DEFAULT_TIMEZONE : DEFAULT_TIMEZONE;

      const currentWeek = getCurrentWeekId(now.toDate(), timezone);
      const currentMonth = getCurrentMonthId(now.toDate(), timezone);

      // Reseta acumuladores temporais se a semana ou mês virou
      const isNewWeek = memberData.weekId !== currentWeek;
      const isNewMonth = memberData.monthId !== currentMonth;

      const baseWeekPoints = isNewWeek ? 0 : memberData.weekPoints || 0;
      const baseWeekSeconds = isNewWeek ? 0 : memberData.weekStudySeconds || 0;
      const baseMonthPoints = isNewMonth ? 0 : memberData.monthPoints || 0;
      const baseMonthSeconds = isNewMonth ? 0 : memberData.monthStudySeconds || 0;

      updatedMemberData = {
        totalPoints: newTotalPoints,
        totalStudySeconds: newTotalStudySeconds,
        weekPoints: baseWeekPoints + (pointEarnedNow ? 1 : 0),
        weekStudySeconds: baseWeekSeconds + finalSessionSeconds,
        weekId: currentWeek,
        monthPoints: baseMonthPoints + (pointEarnedNow ? 1 : 0),
        monthStudySeconds: baseMonthSeconds + finalSessionSeconds,
        monthId: currentMonth,
        ...(countsForSeason ? {
          seasonId: activeSeasonId,
          seasonPoints: (memberData.seasonId === activeSeasonId ? memberData.seasonPoints || 0 : 0) + (seasonPointEarnedNow ? 1 : 0),
          seasonStudySeconds: (memberData.seasonId === activeSeasonId ? memberData.seasonStudySeconds || 0 : 0) + finalSessionSeconds,
        } : {}),
        avatarUrl: userData.avatarUrl || null,
        name: userData.name || memberData.name,
        nickname: userData.nickname || memberData.nickname,
        updatedAt: now,
      };
    }

    // ========================================================================
    // ESCRITAS NO FIRESTORE (Após todas as leituras terem finalizado)
    // ========================================================================

    // 1. Atualiza a sessão para concluída
    tx.update(sessionRef, {
      status: 'completed',
      endedAt: now,
      totalSeconds: finalSessionSeconds,
      subjectId: null,
      didQuestions: null,
      questionCount: null,
      correctCount: null,
      detailsRecorded: false,
      updatedAt: now,
    });

    // 2. Atualiza perfil do usuário e libera activeSessionId atomicamente
    tx.update(userRef, {
      activeSessionId: null,
      totalPoints: newTotalPoints,
      totalStudySeconds: newTotalStudySeconds,
      levelId: levelInfo.currentLevel.id,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastCompletedDate: newLastCompletedDate,
      updatedAt: now,
    });

    // 3. Salva documento diário
    tx.set(dailyRef, updatedDaily, { merge: true });
    if (countsForSeason) tx.set(dailyRef, { seasonId: activeSeasonId, seasonSeconds: seasonDailySeconds,
      seasonPointEarned: seasonPointAlreadyEarned || seasonPointEarnedNow }, { merge: true });

    // 4. Salva membro do grupo
    if (updatedMemberData) {
      tx.update(memberRef, { ...updatedMemberData, activeSessionId: null, sessionStatus: null });
    }

    // 5. Avalia e concede badges idempotentes
    const existingBadgeIds = new Set(existingBadgesSnap.docs.map((d) => d.id));
    const newlyAwardedBadges = await evaluateAndAwardBadges(
      tx,
      uid,
      session.groupId,
      userData.nickname,
      userData.avatarUrl,
      {
        totalPoints: newTotalPoints,
        totalStudySeconds: newTotalStudySeconds,
        currentStreak: newCurrentStreak,
        pointEarnedNow,
      },
      existingBadgeIds
    );

    return {
      sessionId: session.id,
      groupId: session.groupId,
      userNickname: userData.nickname,
      userAvatarUrl: userData.avatarUrl,
      studyDate: targetStudyDate,
      sessionSeconds: finalSessionSeconds,
      dailyTotalSeconds: newDailySeconds,
      pointEarnedNow,
      totalPoints: newTotalPoints,
      currentStreak: newCurrentStreak,
      newlyAwardedBadges,
    };
  });

  // Emite eventos de feed fora da transação
  if (transactionResult.pointEarnedNow) {
    await emitFeedEvent(
      transactionResult.groupId,
      uid,
      transactionResult.userNickname,
      transactionResult.userAvatarUrl,
      'point_earned',
      'Ponto Conquistado! 🎯',
      `${transactionResult.userNickname} acumulou 60 minutos de estudo e conquistou 1 ponto!`,
      { date: transactionResult.studyDate, totalPoints: transactionResult.totalPoints }
    );
  }

  for (const badge of transactionResult.newlyAwardedBadges) {
    await emitFeedEvent(
      transactionResult.groupId,
      uid,
      transactionResult.userNickname,
      transactionResult.userAvatarUrl,
      'badge_unlocked',
      `Nova Conquista: ${badge.name} ${badge.icon}`,
      `${transactionResult.userNickname} desbloqueou a badge "${badge.name}"!`,
      { badgeId: badge.id }
    );
  }

  return {
    sessionId: transactionResult.sessionId,
    studyDate: transactionResult.studyDate,
    sessionSeconds: transactionResult.sessionSeconds,
    dailyTotalSeconds: transactionResult.dailyTotalSeconds,
    pointEarnedNow: transactionResult.pointEarnedNow,
    totalPoints: transactionResult.totalPoints,
    currentStreak: transactionResult.currentStreak,
    newBadgesCount: transactionResult.newlyAwardedBadges.length,
  };
}

/**
 * Descarta a sessão atual sem salvar os minutos (ex: aberta por engano)
 */
export async function discardStudySession(uid: string): Promise<void> {
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new HttpsError('not-found', 'Usuário não encontrado.');
    const userData = userSnap.data() as UserProfile;

    if (!userData.activeSessionId) {
      throw new HttpsError('failed-precondition', 'Não há sessão ativa para descartar.');
    }

    const sessionRef = userRef.collection('studySessions').doc(userData.activeSessionId);
    const now = admin.firestore.Timestamp.now();

    tx.update(sessionRef, {
      status: 'discarded',
      endedAt: now,
      updatedAt: now,
    });

    if (userData.groupId) tx.set(db.doc(`groups/${userData.groupId}/members/${uid}`), { activeSessionId: null, sessionStatus: null }, { merge: true });
    tx.update(userRef, {
      activeSessionId: null,
      updatedAt: now,
    });
  });
}

/**
 * Recupera o estado atual do cronômetro para reconstrução precisa no frontend
 */
export async function getCurrentSession(uid: string): Promise<ActiveSessionState> {
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado.');
  }
  const userData = userSnap.data() as UserProfile;

  if (!userData.activeSessionId) {
    return {
      hasActiveSession: false,
      session: null,
      currentElapsedSeconds: 0,
    };
  }

  const sessionSnap = await db
    .collection('users')
    .doc(uid)
    .collection('studySessions')
    .doc(userData.activeSessionId)
    .get();

  if (!sessionSnap.exists) {
    return {
      hasActiveSession: false,
      session: null,
      currentElapsedSeconds: 0,
    };
  }

  const session = sessionSnap.data() as StudySession;
  if (session.status !== 'active' && session.status !== 'paused') {
    return {
      hasActiveSession: false,
      session: null,
      currentElapsedSeconds: 0,
    };
  }

  let currentElapsedSeconds = session.accumulatedSeconds;
  if (session.status === 'active' && session.lastResumedAt) {
    const nowMillis = Date.now();
    const elapsed = Math.max(0, Math.floor((nowMillis - session.lastResumedAt.toMillis()) / 1000));
    currentElapsedSeconds += elapsed;
  }

  return {
    hasActiveSession: true,
    session,
    currentElapsedSeconds,
  };
}
