import React, { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useStats } from '../hooks/useStats';
import { useBadges } from '../hooks/useBadges';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { LevelProgress } from '../components/profile/LevelProgress';
import { StatsCard } from '../components/profile/StatsCard';
import { BadgeCard } from '../components/profile/BadgeCard';
import { LoadingState } from '../components/ui/LoadingState';
import { DEFAULT_LEVELS } from '../constants/levels';
import { formatDuration } from '../utils/formatTime';

export const ProfilePage: React.FC = () => {
  const { user, profile } = useAuthContext();
  const { stats, loading: statsLoading, fetchStats } = useStats();
  const { catalog, earned, loading: badgesLoading } = useBadges();

  const loadData = useCallback(async () => {
    if (user) await fetchStats(user.uid);
  }, [user, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!profile) return <LoadingState fullPage message="Carregando perfil..." />;

  // Find level info
  const currentLevel = DEFAULT_LEVELS.find(l => l.id === profile.levelId) || DEFAULT_LEVELS[0];
  const currentLevelIndex = DEFAULT_LEVELS.findIndex(l => l.id === profile.levelId);
  const nextLevel = currentLevelIndex < DEFAULT_LEVELS.length - 1 ? DEFAULT_LEVELS[currentLevelIndex + 1] : null;

  const progressPercentage = nextLevel
    ? Math.min(100, Math.floor(
        ((profile.totalStudySeconds - currentLevel.requiredSeconds) /
        (nextLevel.requiredSeconds - currentLevel.requiredSeconds)) * 100
      ))
    : 100;

  const requiredSecondsForNext = nextLevel
    ? Math.max(0, nextLevel.requiredSeconds - profile.totalStudySeconds)
    : 0;

  // Determine which badges are earned
  const earnedBadgeIds = new Set(earned.map(b => b.badgeId));

  const earnedDateMap: Record<string, string> = {};
  earned.forEach(b => {
    if (b.unlockedAt) {
      const date = typeof b.unlockedAt === 'string'
        ? b.unlockedAt
        : b.unlockedAt?.toDate?.()?.toLocaleDateString('pt-BR') ?? '';
      earnedDateMap[b.badgeId] = date;
    }
  });

  return (
    <div className="pb-28 max-w-2xl mx-auto w-full">
      {/* Header section */}
      <div className="p-4 pt-6">
        <ProfileHeader
          profile={profile}
          levelName={currentLevel.name}
          levelIcon={currentLevel.icon}
          isCurrentUser={true}
        />
      </div>

      <div className="px-4 space-y-6">
        {/* Level Progress */}
        <LevelProgress
          currentLevel={currentLevel}
          nextLevel={nextLevel}
          currentSeconds={profile.totalStudySeconds}
          requiredSecondsForNext={requiredSecondsForNext}
          progressPercentage={progressPercentage}
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard label="Pontos Totais" value={profile.totalPoints} icon="🎯" highlight />
          <StatsCard label="Streak Atual" value={`${profile.currentStreak} dias`} icon="🔥" />
          <StatsCard label="Maior Streak" value={`${profile.longestStreak} dias`} icon="🏆" />
          <StatsCard
            label="Horas Estudadas"
            value={`${Math.floor(profile.totalStudySeconds / 3600)}h`}
            icon="⏱️"
          />
          {stats && (
            <>
              <StatsCard
                label="Média Diária"
                value={formatDuration(stats.summary.dailyAverageSeconds)}
                icon="📈"
              />
              <StatsCard
                label="Recorde Diário"
                value={formatDuration(stats.summary.maxDaySeconds)}
                icon="⚡"
              />
            </>
          )}
        </div>

        {/* Edit Profile link */}
        <Link
          to="/profile/edit"
          className="block w-full py-3 text-center bg-bg-secondary border border-border rounded-xl text-text-primary font-medium hover:border-accent-primary transition-colors"
        >
          ✏️ Editar Perfil
        </Link>

        {/* Badges section */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-4">
            Conquistas 🏅
            {!badgesLoading && (
              <span className="ml-2 text-sm text-text-muted font-normal">
                {earned.length} conquistadas
              </span>
            )}
          </h2>

          {badgesLoading || statsLoading ? (
            <LoadingState message="Carregando conquistas..." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earned.filter(b => b.id.startsWith('season_')).map(b => <div key={b.id} className="p-4 rounded-2xl border border-accent-success/30 bg-bg-secondary text-center"><div className="text-4xl mb-3">{b.icon}</div><h3 className="font-bold text-sm">{b.name}</h3><p className="text-xs text-text-secondary mt-2">{b.description}</p></div>)}
              {catalog.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedBadgeIds.has(badge.id)}
                  earnedDate={earnedDateMap[badge.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
