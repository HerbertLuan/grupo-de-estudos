import { useState, useEffect, useCallback } from 'react';
import { getCatalogBadges, getUserBadges } from '../services/badgeService';
import type { BadgeConfig, UserBadge } from '../types';
import { useAuthContext } from '../contexts/AuthContext';

export function useBadges() {
  const { user } = useAuthContext();
  const [catalog, setCatalog] = useState<BadgeConfig[]>([]);
  const [earned, setEarned] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [catalogResult, earnedResult] = await Promise.allSettled([
        getCatalogBadges(),
        getUserBadges(user.uid),
      ]);
      setCatalog(catalogResult.status === 'fulfilled' ? catalogResult.value : []);
      if (earnedResult.status === 'fulfilled') {
        setEarned(earnedResult.value);
      } else {
        setEarned([]);
        setError('Não foi possível carregar suas conquistas.');
      }
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const earnedIds = new Set(earned.map((b) => b.badgeId));

  return {
    catalog,
    earned,
    loading,
    error,
    isEarned: (badgeId: string) => earnedIds.has(badgeId),
    refreshBadges: fetchBadges,
  };
}
