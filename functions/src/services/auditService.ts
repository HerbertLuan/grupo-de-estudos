import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { DailyStudy, UserProfile } from '../types';
import { calculateLevel } from './gamificationService';
import { isConsecutiveDay } from '../utils/timezone';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export interface AuditResult {
  uid: string;
  recalculated: {
    totalPoints: number;
    totalStudySeconds: number;
    currentStreak: number;
    longestStreak: number;
    levelId: string;
    lastCompletedDate: string | null;
  };
  previous: {
    totalPoints: number;
    totalStudySeconds: number;
    currentStreak: number;
    longestStreak: number;
    levelId: string;
  };
  diffFound: boolean;
}

/**
 * Função de auditoria e auto-cura:
 * Reconstrói 100% dos dados agregados do usuário a partir dos registros fundamentais em dailyStudy/{YYYY-MM-DD}.
 */
export async function recalculateUserStats(uid: string): Promise<AuditResult> {
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado.');
  }
  const user = userSnap.data() as UserProfile;

  // Busca todos os registros diários ordenados por data cronológica (ASC)
  const dailySnap = await userRef.collection('dailyStudy').orderBy('date', 'asc').get();
  const dailyRecords = dailySnap.docs.map((d) => d.data() as DailyStudy);

  let totalPoints = 0;
  let totalStudySeconds = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let lastCompletedDate: string | null = null;

  for (const record of dailyRecords) {
    const secs = record.totalSeconds || 0;
    totalStudySeconds += secs;

    if (record.pointEarned) {
      totalPoints += 1;

      if (lastCompletedDate && isConsecutiveDay(lastCompletedDate, record.date)) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      lastCompletedDate = record.date;
    }
  }

  const levelInfo = calculateLevel(totalStudySeconds);

  const diffFound =
    totalPoints !== (user.totalPoints || 0) ||
    totalStudySeconds !== (user.totalStudySeconds || 0) ||
    currentStreak !== (user.currentStreak || 0) ||
    longestStreak !== (user.longestStreak || 0) ||
    levelInfo.currentLevel.id !== user.levelId;

  const now = admin.firestore.Timestamp.now();

  // Atualiza o documento de perfil com os valores reconstruídos
  await userRef.update({
    totalPoints,
    totalStudySeconds,
    currentStreak,
    longestStreak,
    levelId: levelInfo.currentLevel.id,
    lastCompletedDate,
    updatedAt: now,
  });

  // Atualiza também o membro do grupo se aplicável
  if (user.groupId) {
    const memberRef = db.collection('groups').doc(user.groupId).collection('members').doc(uid);
    const memberSnap = await memberRef.get();
    if (memberSnap.exists) {
      await memberRef.update({
        totalPoints,
        totalStudySeconds,
        updatedAt: now,
      });
    }
  }

  return {
    uid,
    recalculated: {
      totalPoints,
      totalStudySeconds,
      currentStreak,
      longestStreak,
      levelId: levelInfo.currentLevel.id,
      lastCompletedDate,
    },
    previous: {
      totalPoints: user.totalPoints || 0,
      totalStudySeconds: user.totalStudySeconds || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      levelId: user.levelId || 'iniciante',
    },
    diffFound,
  };
}
