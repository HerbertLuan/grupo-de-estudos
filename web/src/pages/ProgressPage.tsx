import React, { useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import { LevelProgress } from '../components/profile/LevelProgress';
import { StatsCard } from '../components/profile/StatsCard';
import { SubjectProgress } from '../components/progress/SubjectProgress';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { formatDuration } from '../utils/formatTime';

export const ProgressPage: React.FC = () => {
  const { user } = useAuthContext();
  const { stats, loading, error, fetchStats } = useStats();

  const loadData = useCallback(async () => {
    if (!user) return;
    await fetchStats(user.uid);
  }, [user, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState fullPage message="Carregando progresso..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!stats) return null;

  const { summary } = stats;

  return (
    <div className="p-4 pb-28 max-w-2xl mx-auto w-full space-y-6">
      <h1 className="text-2xl font-bold text-text-primary mt-2">Progresso 📊</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          label="Total de Horas"
          value={`${summary.totalHours.toFixed(1)}h`}
          icon="⏱️"
        />
        <StatsCard
          label="Dias Estudados"
          value={summary.totalDaysStudied}
          icon="📅"
        />
        <StatsCard
          label="Média Diária"
          value={formatDuration(summary.dailyAverageSeconds)}
          icon="📈"
        />
        <StatsCard
          label="Recorde Diário"
          value={formatDuration(summary.maxDaySeconds)}
          icon="🔥"
          highlight
        />
      </div>

      {/* Level progress */}
      <LevelProgress
        currentLevel={summary.level.currentLevel}
        nextLevel={summary.level.nextLevel}
        currentSeconds={summary.level.currentSeconds}
        requiredSecondsForNext={summary.level.requiredSecondsForNext}
        progressPercentage={summary.level.progressPercentage}
      />

      {/* Historical and season indicators */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          label="Maior Streak"
          value={`${summary.longestStreak} dias`}
          icon="🏆"
        />
        <StatsCard
          label="Pontos Temporada"
          value={summary.seasonPoints}
          icon="⭐"
        />
      </div>

      {/* Subject indicators, charts and study history */}
      {user && <SubjectProgress uid={user.uid} />}
    </div>
  );
};
