import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { DailyStudy, UserStatsResponse } from '../types';

/**
 * Obtém estatísticas consolidadas e dados de série temporal (últimos 7 e 30 dias)
 * para exibição em painéis e gráficos.
 * Caso o `uid` não seja fornecido, o backend utilizará o usuário autenticado por padrão.
 */
export async function getUserStats(uid?: string): Promise<UserStatsResponse> {
  try {
    const fn = httpsCallable<{ uid?: string }, UserStatsResponse>(
      functions,
      'get_user_stats'
    );
    const result = await fn(uid ? { uid } : {});
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar estatísticas do usuário.';
    console.error('Erro em getUserStats:', error);
    throw new Error(message);
  }
}

/**
 * Obtém o histórico de estudo diário (registros de dailyStudy) do usuário.
 * Permite limitar os dias retornados ou carregar o histórico completo sob demanda.
 */
export async function getUserHistory(
  uid?: string,
  limit?: number,
  all?: boolean
): Promise<DailyStudy[]> {
  try {
    const fn = httpsCallable<{ uid?: string; limit?: number; all?: boolean }, DailyStudy[]>(
      functions,
      'get_user_history'
    );
    const payload: { uid?: string; limit?: number; all?: boolean } = {};
    if (uid !== undefined) payload.uid = uid;
    if (limit !== undefined) payload.limit = limit;
    if (all) payload.all = true;

    const result = await fn(payload);
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar histórico de estudo.';
    console.error('Erro em getUserHistory:', error);
    throw new Error(message);
  }
}
