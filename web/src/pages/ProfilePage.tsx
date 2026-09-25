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
import { Badge, Card, Icon } from '../components/ui/DesignSystem';

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
    <div className="ej-page space-y-7">
      <ProfileHeader profile={profile} levelName={currentLevel.name} levelIcon={currentLevel.icon} isCurrentUser={true} />
      <div className="social-stat-grid social-stat-grid--four">
        <StatsCard label="Pontos totais" value={profile.totalPoints} icon="ranking" highlight />
        <StatsCard label="Sequência atual" value={`${profile.currentStreak} dias`} icon="bolt" />
        <StatsCard label="Maior sequência" value={`${profile.longestStreak} dias`} icon="bolt" />
        <StatsCard label="Horas estudadas" value={`${Math.floor(profile.totalStudySeconds / 3600)}h`} icon="study" />
      </div>
      <div className="profile-body">
        <div className="profile-main">
          <section>
            <div className="social-section-title"><div><h2>Seu mural de conquistas</h2><p>Cada marco conta uma parte da sua jornada.</p></div>{!badgesLoading && <Badge tone="yellow">{earned.length} conquistadas</Badge>}</div>
            {badgesLoading || statsLoading ? <LoadingState message="Carregando conquistas..." /> : (
              <div className="achievement-grid">
                {earned.filter(b => b.id.startsWith('season_')).map(b => <article key={b.id} className="achievement-card achievement-card--earned"><div className="achievement-card__symbol" aria-hidden="true">{b.icon}</div><h3>{b.name}</h3><p>{b.description}</p><div className="mt-auto pt-4"><Badge tone="yellow">Temporada</Badge></div></article>)}
                {catalog.map(badge => <BadgeCard key={badge.id} badge={badge} earned={earnedBadgeIds.has(badge.id)} earnedDate={earnedDateMap[badge.id]} />)}
              </div>
            )}
          </section>
        </div>
        <aside className="profile-aside" aria-label="Evolução do estudante">
          <LevelProgress currentLevel={currentLevel} nextLevel={nextLevel} currentSeconds={profile.totalStudySeconds} requiredSecondsForNext={requiredSecondsForNext} progressPercentage={progressPercentage} />
          {stats && <div className="social-stat-grid"><StatsCard label="Média diária" value={formatDuration(stats.summary.dailyAverageSeconds)} icon="progress" /><StatsCard label="Recorde diário" value={formatDuration(stats.summary.maxDaySeconds)} icon="study" /></div>}
          <Card className="p-5"><p className="social-eyebrow">Continue evoluindo</p><p className="text-sm leading-relaxed text-text-secondary">Veja como seu tempo e suas matérias se transformam em progresso.</p><Link className="social-link mt-3" to="/progress">Explorar meu progresso <Icon name="arrow" size={16} /></Link></Card>
          <div className="profile-note"><p>Disciplina hoje.<br /><strong className="text-text-primary">Conquistas amanhã.</strong></p></div>
        </aside>
      </div>
    </div>
  );
};
