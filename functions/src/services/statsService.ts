import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { DailyStudy, TimeSeriesPoint, UserProfile, UserStatsSummary } from '../types';
import { calculateLevel, getEffectiveStreak } from './gamificationService';
import { getZonedDateString, getDateRange } from '../utils/timezone';
import { format, parseISO, subDays } from 'date-fns';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export interface UserStatsResult {
  summary: UserStatsSummary;
  timeSeries: {
    last7Days: TimeSeriesPoint[];
    last30Days: TimeSeriesPoint[];
  };
}

/**
 * Retorna estatísticas completas, agregadas e séries temporais prontas para os gráficos do frontend
 */
export async function getUserStats(uid: string): Promise<UserStatsResult> {
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado.');
  }
  const user = userSnap.data() as UserProfile;

  const todayStr = getZonedDateString();
  const effectiveStreak = getEffectiveStreak(user.currentStreak, user.lastCompletedDate, todayStr);

  // Busca todos os registros de estudo diário do usuário
  const dailySnap = await userRef.collection('dailyStudy').orderBy('date', 'desc').get();
  const dailyRecords = dailySnap.docs.map((d) => d.data() as DailyStudy);

  let totalStudySeconds = 0;
  let totalDaysStudied = 0;
  let maxDaySeconds = 0;
  const recordsMap = new Map<string, DailyStudy>();

  for (const record of dailyRecords) {
    totalStudySeconds += record.totalSeconds || 0;
    if ((record.totalSeconds || 0) > 0) {
      totalDaysStudied++;
    }
    if ((record.totalSeconds || 0) > maxDaySeconds) {
      maxDaySeconds = record.totalSeconds;
    }
    recordsMap.set(record.date, record);
  }

  const dailyAverageSeconds = totalDaysStudied > 0 ? Math.floor(totalStudySeconds / totalDaysStudied) : 0;
  const levelInfo = calculateLevel(totalStudySeconds);

  // Gera dados dos últimos 7 dias (incluindo dias com 0 horas)
  // Deriva toda a janela da data já convertida para o fuso da aplicação.
  // Usar `new Date()` diretamente aqui deslocava a janela quando o runtime UTC
  // da Cloud Function já estava no dia seguinte em relação a São Paulo.
  const today = parseISO(todayStr);
  const date7DaysAgo = format(subDays(today, 6), 'yyyy-MM-dd');
  const dates7 = getDateRange(date7DaysAgo, todayStr);

  const last7Days: TimeSeriesPoint[] = dates7.map((dateStr) => {
    const record = recordsMap.get(dateStr);
    const secs = record?.totalSeconds || 0;
    return {
      date: dateStr,
      studySeconds: secs,
      studyHours: Number((secs / 3600).toFixed(2)),
      pointEarned: record?.pointEarned || false,
    };
  });

  // Gera dados dos últimos 30 dias
  const date30DaysAgo = format(subDays(today, 29), 'yyyy-MM-dd');
  const dates30 = getDateRange(date30DaysAgo, todayStr);

  const last30Days: TimeSeriesPoint[] = dates30.map((dateStr) => {
    const record = recordsMap.get(dateStr);
    const secs = record?.totalSeconds || 0;
    return {
      date: dateStr,
      studySeconds: secs,
      studyHours: Number((secs / 3600).toFixed(2)),
      pointEarned: record?.pointEarned || false,
    };
  });

  const summary: UserStatsSummary = {
    totalHours: Number((totalStudySeconds / 3600).toFixed(2)),
    totalMinutes: Math.floor(totalStudySeconds / 60),
    totalStudySeconds,
    totalDaysStudied,
    dailyAverageSeconds,
    dailyAverageMinutes: Math.floor(dailyAverageSeconds / 60),
    maxDaySeconds,
    maxDayMinutes: Math.floor(maxDaySeconds / 60),
    currentStreak: effectiveStreak,
    longestStreak: user.longestStreak || 0,
    totalPoints: user.totalPoints || 0,
    seasonPoints: 0,
    level: levelInfo,
  };

  return {
    summary,
    timeSeries: {
      last7Days,
      last30Days,
    },
  };
}

/**
 * Retorna o histórico de estudo diário paginado
 */
export async function getUserHistory(
  uid: string,
  limit: number | null = 30
): Promise<DailyStudy[]> {
  const query = db
    .collection('users')
    .doc(uid)
    .collection('dailyStudy')
    .orderBy('date', 'desc');
  const dailySnap = await (limit === null ? query : query.limit(limit)).get();

  return dailySnap.docs.map((d) => d.data() as DailyStudy);
}
