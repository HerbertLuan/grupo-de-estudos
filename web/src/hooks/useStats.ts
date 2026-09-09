import { useState, useCallback } from 'react';
import { getUserStats } from '../services/statsService';
import type { UserStatsResponse } from '../types';

export function useStats() {
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (uid?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserStats(uid);
      setStats(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching stats');
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStats };
}
