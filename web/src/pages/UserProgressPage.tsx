import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStats } from '../hooks/useStats';
import { LevelProgress } from '../components/profile/LevelProgress';
import { StatsCard } from '../components/profile/StatsCard';
import { ProgressCharts } from '../components/progress/ProgressCharts';
import { HistorySection } from '../components/progress/HistorySection';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import type { UserProfile } from '../types';
import { formatDuration } from '../utils/formatTime';
import { PageHeader, Button, Badge } from '../components/ui/DesignSystem';
import { Avatar } from '../components/ui/Avatar';

export const UserProgressPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();

  const { stats, loading, error, fetchStats } = useStats();
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

    // Fetch stats
    await fetchStats(uid);
  }, [uid, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || userLoading) return <LoadingState fullPage message="Carregando progresso..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!stats) return null;

  const { summary } = stats;

  return (
    <div className="ej-page space-y-7">
      <PageHeader eyebrow="Comunidade / Progresso" title="Uma jornada de evolução." description="Acompanhe o esforço e as conquistas de quem estuda com você." actions={<Button variant="ghost" onClick={() => navigate('/ranking')}>← Voltar ao ranking</Button>} />
      <section className="student-identity"><div className="student-identity__banner" aria-hidden="true"><span>DISCIPLINA / EVOLUÇÃO / CONQUISTAS</span></div><div className="student-identity__content"><div className="student-identity__avatar"><Avatar src={targetUser?.avatarUrl} name={targetUser?.name ?? 'Usuário'} size="xl" /></div><div className="student-identity__name"><h2 className="text-2xl font-bold">{targetUser?.name ?? 'Usuário'}</h2><p className="mt-1 text-text-secondary">@{targetUser?.nickname ?? uid}</p><div className="mt-3"><Badge tone="purple">{summary.level.currentLevel.name}</Badge></div></div></div></section>
      <div className="social-stat-grid social-stat-grid--four">
        <StatsCard label="Total de horas" value={`${summary.totalHours.toFixed(1)}h`} icon="study" />
        <StatsCard label="Dias estudados" value={summary.totalDaysStudied} icon="seasons" />
        <StatsCard label="Média diária" value={formatDuration(summary.dailyAverageSeconds)} icon="progress" />
        <StatsCard label="Recorde diário" value={formatDuration(summary.maxDaySeconds)} icon="study" highlight />
      </div>
      <LevelProgress currentLevel={summary.level.currentLevel} nextLevel={summary.level.nextLevel} requiredSecondsForNext={summary.level.requiredSecondsForNext} progressPercentage={summary.level.progressPercentage} />
      <div className="social-stat-grid social-stat-grid--four">
        <StatsCard label="Sequência atual" value={`${summary.currentStreak} dias`} icon="bolt" />
        <StatsCard label="Maior sequência" value={`${summary.longestStreak} dias`} icon="bolt" />
        <StatsCard label="Pontos totais" value={summary.totalPoints} icon="ranking" highlight />
        <StatsCard label="Pontos na temporada" value={summary.seasonPoints} icon="ranking" />
      </div>
      <section className="space-y-5 subject-progress"><div className="social-section-title"><div><h2>Progresso por matéria</h2><p>Tempo dedicado e prática de questões ao longo dos dias.</p></div></div><ProgressCharts uid={uid} /></section>
      {uid && <HistorySection key={uid} uid={uid} />}
    </div>
  );
};
