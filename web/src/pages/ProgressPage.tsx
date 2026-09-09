import React, { useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import { LevelProgress } from '../components/profile/LevelProgress';
import { StatsCard } from '../components/profile/StatsCard';
import { StudyChart } from '../components/progress/StudyChart';
import { HistoryList } from '../components/progress/HistoryList';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { getUserHistory } from '../services/statsService';
import type { DailyStudy } from '../types';
import { formatDuration } from '../utils/formatTime';

export const ProgressPage: React.FC = () => {
  const { user } = useAuthContext();
  const { stats, loading, error, fetchStats } = useStats();
  const [history, setHistory] = React.useState<DailyStudy[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    await fetchStats(user.uid);
    setHistoryLoading(true);
    try {
      const h = await getUserHistory(user.uid, 30);
      setHistory(h);
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [user, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState fullPage message="Carregando progresso..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!stats) return null;

  const { summary, timeSeries } = stats;

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

      {/* Streak & Points */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          label="Streak Atual"
          value={`${summary.currentStreak} dias`}
          icon="🔥"
        />
        <StatsCard
          label="Maior Streak"
          value={`${summary.longestStreak} dias`}
          icon="🏆"
        />
        <StatsCard
          label="Pontos Totais"
          value={summary.totalPoints}
          icon="🎯"
          highlight
        />
        <StatsCard
          label="Pontos Temporada"
          value={summary.seasonPoints}
          icon="⭐"
        />
      </div>

      {/* Charts */}
      {timeSeries.last7Days.length > 0 && (
        <StudyChart data={timeSeries.last7Days} title="Últimos 7 dias" />
      )}
      {timeSeries.last30Days.length > 0 && (
        <StudyChart data={timeSeries.last30Days} title="Últimos 30 dias" />
      )}

      {/* History list */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-3">Histórico Detalhado</h2>
        {historyLoading ? (
          <LoadingState message="Carregando histórico..." />
        ) : (
          <HistoryList history={history} />
        )}
      </div>
    </div>
  );
};
