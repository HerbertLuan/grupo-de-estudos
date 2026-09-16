import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStats } from '../hooks/useStats';
import { LevelProgress } from '../components/profile/LevelProgress';
import { StatsCard } from '../components/profile/StatsCard';
import { StudyChart } from '../components/progress/StudyChart';
import { HistoryList } from '../components/progress/HistoryList';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { getUserHistory } from '../services/statsService';
import type { DailyStudy, UserProfile } from '../types';
import { formatDuration } from '../utils/formatTime';

export const UserProgressPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();

  const { stats, loading, error, fetchStats } = useStats();
  const [history, setHistory] = React.useState<DailyStudy[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [targetUser, setTargetUser] = React.useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = React.useState(true);

  const loadData = useCallback(async () => {
    if (!uid) return;

    // Fetch target user profile
    setUserLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      setTargetUser(userDoc.exists() ? ({ ...userDoc.data(), uid: userDoc.id } as UserProfile) : null);
    } catch {
      setTargetUser(null);
    } finally {
      setUserLoading(false);
    }

    // Fetch stats and history
    await fetchStats(uid);
    setHistoryLoading(true);
    try {
      const h = await getUserHistory(uid, 30);
      setHistory(h);
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [uid, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || userLoading) return <LoadingState fullPage message="Carregando progresso..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!stats) return null;

  const { summary, timeSeries } = stats;

  return (
    <div className="p-4 pb-28 max-w-2xl mx-auto w-full">

      {/* Back button */}
      <button
        onClick={() => navigate('/ranking')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mt-2 mb-4"
      >
        <span className="text-lg">←</span>
        <span>Voltar ao Ranking</span>
      </button>

      <div className="space-y-6">
      {/* User header */}
      <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-2xl border border-border">
        <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
          {targetUser?.avatarUrl ? (
            <img src={targetUser.avatarUrl} alt={targetUser.name} className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-text-primary truncate">
            {targetUser?.name ?? 'Usuário'}
          </h1>
          <span className="text-sm text-text-secondary">@{targetUser?.nickname ?? uid}</span>
        </div>
      </div>

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
    </div>
  );
};
