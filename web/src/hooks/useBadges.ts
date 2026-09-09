import { useState, useEffect, useCallback } from 'react';
import { getCatalogBadges, getUserBadges } from '../services/badgeService';
import type { BadgeConfig, UserBadge } from '../types';
import { useAuthContext } from '../contexts/AuthContext';

export function useBadges() {
  const { user } = useAuthContext();
  const [catalog, setCatalog] = useState<BadgeConfig[]>([]);
  const [earned, setEarned] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [catalogResult, earnedResult] = await Promise.all([
        getCatalogBadges(),
        getUserBadges(user.uid),
      ]);
      setCatalog(catalogResult);
      setEarned(earnedResult);
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
    isEarned: (badgeId: string) => earnedIds.has(badgeId),
    refreshBadges: fetchBadges,
  };
}
