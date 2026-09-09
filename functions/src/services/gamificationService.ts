import * as admin from 'firebase-admin';
import { FeedEventType, FeedPost, LevelConfig, UserBadge } from '../types';
import { DEFAULT_BADGES, DEFAULT_LEVELS } from '../config/constants';
import { diffCalendarDays, isConsecutiveDay } from '../utils/timezone';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Calcula o nível atual do usuário com base nos segundos líquidos estudados
 */
export function calculateLevel(totalStudySeconds: number): {
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
  currentSeconds: number;
  requiredSecondsForNext: number;
  progressPercentage: number;
} {
  const sortedLevels = [...DEFAULT_LEVELS].sort((a, b) => a.requiredSeconds - b.requiredSeconds);
  let currentLevel = sortedLevels[0];
  let nextLevel: LevelConfig | null = null;

  for (let i = 0; i < sortedLevels.length; i++) {
    if (totalStudySeconds >= sortedLevels[i].requiredSeconds) {
      currentLevel = sortedLevels[i];
      nextLevel = sortedLevels[i + 1] || null;
    } else {
      break;
    }
  }

  let progressPercentage = 100;
  let requiredSecondsForNext = 0;

  if (nextLevel) {
    const range = nextLevel.requiredSeconds - currentLevel.requiredSeconds;
    const progress = totalStudySeconds - currentLevel.requiredSeconds;
    progressPercentage = Math.min(100, Math.max(0, Math.floor((progress / range) * 100)));
    requiredSecondsForNext = nextLevel.requiredSeconds - totalStudySeconds;
  }

  return {
    currentLevel,
    nextLevel,
    currentSeconds: totalStudySeconds,
    requiredSecondsForNext,
    progressPercentage,
  };
}

/**
 * Calcula o streak quando um dia de estudo é concluído (atinge 60 minutos / 3.600s)
 */
export function calculateStreakOnDayCompletion(
  currentStreak: number,
  longestStreak: number,
  lastCompletedDate: string | null,
  completedDateStr: string
): { currentStreak: number; longestStreak: number; lastCompletedDate: string } {
  if (lastCompletedDate === completedDateStr) {
    // Já completou hoje anteriormente nesta mesma data
    return {
      currentStreak,
      longestStreak,
      lastCompletedDate,
    };
  }

  let newStreak = 1;
  if (lastCompletedDate && isConsecutiveDay(lastCompletedDate, completedDateStr)) {
    // Dia seguinte ao último dia completado
    newStreak = currentStreak + 1;
  } else {
    // Primeiro dia ou quebra de streak (mais de 1 dia de intervalo)
    newStreak = 1;
  }

  const newLongest = Math.max(longestStreak, newStreak);

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastCompletedDate: completedDateStr,
  };
}

/**
 * Retorna o streak visível em tempo real considerando a data de hoje.
 * Se o último dia completado for antes de ontem, o streak ativo expirou e retorna 0.
 */
export function getEffectiveStreak(
  currentStreak: number,
  lastCompletedDate: string | null,
  todayDateStr: string
): number {
  if (!lastCompletedDate || currentStreak <= 0) return 0;

  const diff = diffCalendarDays(lastCompletedDate, todayDateStr);
  if (diff === 0 || diff === 1) {
    // Concluiu hoje ou ontem (hoje ainda está em andamento)
    return currentStreak;
  }

  // Mais de 1 dia sem completar: quebrou o streak
  return 0;
}

/**
 * Emite um evento oficial no feed do grupo
 */
export async function emitFeedEvent(
  groupId: string,
  userId: string,
  userNickname: string,
  userAvatarUrl: string | null,
  type: FeedEventType,
  title: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  const feedRef = db.collection('feed').doc();
  const now = admin.firestore.Timestamp.now();

  const post: FeedPost = {
    id: feedRef.id,
    groupId,
    userId,
    userNickname,
    userAvatarUrl: userAvatarUrl || null,
    type,
    title,
    message,
    metadata,
    likeCount: 0,
    commentCount: 0,
    createdAt: now,
  };

  await feedRef.set(post);
  return feedRef.id;
}

/**
 * Avalia de forma idempotente todas as badges aplicáveis e concede ao usuário
 */
export async function evaluateAndAwardBadges(
  tx: admin.firestore.Transaction,
  uid: string,
  groupId: string,
  userNickname: string,
  userAvatarUrl: string | null,
  stats: {
    totalPoints: number;
    totalStudySeconds: number;
    currentStreak: number;
    pointEarnedNow: boolean;
  },
  existingBadgeIds?: Set<string>
): Promise<UserBadge[]> {
  const userBadgesRef = db.collection('users').doc(uid).collection('badges');
  let badgeIds = existingBadgeIds;
  if (!badgeIds) {
    const existingBadgesSnap = await tx.get(userBadgesRef);
    badgeIds = new Set(existingBadgesSnap.docs.map((d) => d.id));
  }

  const newlyAwarded: UserBadge[] = [];
  const now = admin.firestore.Timestamp.now();

  for (const badge of DEFAULT_BADGES) {
    if (badgeIds.has(badge.id) || !badge.active) continue;

    let qualified = false;
    switch (badge.ruleType) {
      case 'first_point':
        qualified = stats.totalPoints >= 1;
        break;
      case 'streak':
        qualified = stats.currentStreak >= badge.requirement;
        break;
      case 'total_hours':
        qualified = stats.totalStudySeconds >= badge.requirement;
        break;
      case 'total_points':
        qualified = stats.totalPoints >= badge.requirement;
        break;
      default:
        break;
    }

    if (qualified) {
      const userBadgeDoc = userBadgesRef.doc(badge.id);
      const userBadge: UserBadge = {
        id: badge.id,
        badgeId: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlockedAt: now,
      };

      tx.set(userBadgeDoc, userBadge);
      newlyAwarded.push(userBadge);
    }
  }

  return newlyAwarded;
}
