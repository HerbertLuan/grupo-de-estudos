import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { LeaderboardResponse, RankingPeriod } from '../types';

/**
 * Obtém a tabela de classificação (ranking) de um grupo para o período especificado.
 * Períodos disponíveis: 'week' | 'month' | 'season' | 'all' | 'hours'
 */
export async function getLeaderboard(
  groupId: string,
  period: RankingPeriod = 'week'
): Promise<LeaderboardResponse> {
  try {
    const fn = httpsCallable<
      { groupId: string; period?: RankingPeriod },
      LeaderboardResponse
    >(functions, 'get_leaderboard');

    const result = await fn({ groupId, period });
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar o ranking.';
    console.error('Erro em getLeaderboard:', error);
    throw new Error(message);
  }
}
