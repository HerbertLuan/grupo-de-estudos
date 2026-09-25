import React, { useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import { LevelProgress } from '../components/profile/LevelProgress';
import { StatsCard } from '../components/profile/StatsCard';
import { SubjectProgress } from '../components/progress/SubjectProgress';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { formatDuration } from '../utils/formatTime';
import { PageHeader } from '../components/ui/DesignSystem';

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
    <div className="ej-page space-y-7">
      <PageHeader eyebrow="Evolução" title="Seu esforço, em perspectiva." description="Acompanhe sua consistência e descubra onde cada hora de estudo faz a diferença." />
      <div className="social-stat-grid social-stat-grid--four">
        <StatsCard label="Total de horas" value={`${summary.totalHours.toFixed(1)}h`} icon="study" />
        <StatsCard label="Dias estudados" value={summary.totalDaysStudied} icon="seasons" />
        <StatsCard label="Média diária" value={formatDuration(summary.dailyAverageSeconds)} icon="progress" />
        <StatsCard label="Recorde diário" value={formatDuration(summary.maxDaySeconds)} icon="study" highlight />
      </div>
      <div className="progress-overview">
        <LevelProgress currentLevel={summary.level.currentLevel} nextLevel={summary.level.nextLevel} currentSeconds={summary.level.currentSeconds} requiredSecondsForNext={summary.level.requiredSecondsForNext} progressPercentage={summary.level.progressPercentage} />
        <div className="social-stat-grid">
          <StatsCard label="Maior sequência" value={`${summary.longestStreak} dias`} icon="bolt" />
          <StatsCard label="Pontos na temporada" value={summary.seasonPoints} icon="ranking" highlight />
        </div>
      </div>
      {user && <SubjectProgress uid={user.uid} />}
    </div>
  );
};
