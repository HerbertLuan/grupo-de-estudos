import { useState, useCallback } from 'react';
import { getLeaderboard } from '../services/rankingService';
import type { LeaderboardEntry, RankingPeriod } from '../types';

export function useRanking(groupId: string | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<RankingPeriod>('all');
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async (p?: RankingPeriod) => {
    if (!groupId) return;
    const selectedPeriod = p || period;
    setLoading(true);
    setError(null);
    try {
      const result = await getLeaderboard(groupId, selectedPeriod);
      setEntries(result.entries);
      setTotalMembers(result.totalMembers);
      if (p) setPeriod(p);
    } catch (err: any) {
      setError(err?.message || 'Error fetching ranking');
    } finally {
      setLoading(false);
    }
  }, [groupId, period]);

  return {
    entries,
    period,
    totalMembers,
    loading,
    error,
    fetchRanking,
    setPeriod: (p: RankingPeriod) => fetchRanking(p),
  };
}
