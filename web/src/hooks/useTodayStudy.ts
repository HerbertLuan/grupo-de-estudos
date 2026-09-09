import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { subscribeToDailyStudy } from '../services/dailyStudyService';
import type { DailyStudy } from '../types';
import { getTodayDateString } from '../utils/formatDate';

export function useTodayStudy() {
  const { user } = useAuthContext();
  const [todayStudy, setTodayStudy] = useState<DailyStudy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const today = getTodayDateString();
    const unsub = subscribeToDailyStudy(user.uid, today, (daily) => {
      setTodayStudy(daily);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return {
    todayStudy,
    loading,
    totalSecondsToday: todayStudy?.totalSeconds || 0,
    pointEarnedToday: todayStudy?.pointEarned || false,
    progressPercent: Math.min(100, ((todayStudy?.totalSeconds || 0) / 3600) * 100),
  };
}
