import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthContext } from '../contexts/AuthContext';
import { RankingTabs } from '../components/ranking/RankingTabs';
import { RankingList } from '../components/ranking/RankingList';
import { SeasonHero } from '../components/ranking/SeasonHero';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Avatar } from '../components/ui/Avatar';
import { Badge, Card, Icon, PageHeader } from '../components/ui/DesignSystem';
import { getLeaderboard } from '../services/rankingService';
import { db } from '../firebase/config';
import type { RankingPeriod, LeaderboardEntry, Group, Season } from '../types';
import './ranking-redesign.css';

export const RankingPage: React.FC = () => {
  const [period, setPeriod] = useState<RankingPeriod>('season');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [upcomingSeason, setUpcomingSeason] = useState<Season | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [upcomingSeasonLoading, setUpcomingSeasonLoading] = useState(true);
  const { user, profile } = useAuthContext();
  const groupId = profile?.groupId;

  const fetchRanking = useCallback(async (p: RankingPeriod) => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard(groupId, p);
      setEntries(res.entries ?? []);
      setTotalMembers(res.totalMembers ?? 0);
    } catch (err: any) {
      setError(err?.message || 'Erro ao buscar ranking');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRanking(period);
  }, [fetchRanking, period]);

  useEffect(() => {
    if (!groupId) return;
    setUpcomingSeasonLoading(true);
    let unsubscribeSeason: (() => void) | null = null;
    const unsubscribeGroup = onSnapshot(doc(db, 'groups', groupId), groupSnapshot => {
      unsubscribeSeason?.();
      unsubscribeSeason = null;
      const groupData = groupSnapshot.exists() ? ({ ...groupSnapshot.data(), id: groupSnapshot.id } as Group) : null;
      setGroup(groupData);
      if (!groupData?.activeSeasonId) {
        setActiveSeason(null);
        setSeasonLoading(false);
        return;
      }
      setSeasonLoading(true);
      unsubscribeSeason = onSnapshot(doc(db, 'seasons', groupData.activeSeasonId), seasonSnapshot => {
        const season = seasonSnapshot.exists() ? ({ ...seasonSnapshot.data(), id: seasonSnapshot.id } as Season) : null;
        setActiveSeason(season?.active ? season : null);
        setSeasonLoading(false);
      }, () => {
        setActiveSeason(null);
        setSeasonLoading(false);
      });
    }, () => {
      setGroup(null);
      setActiveSeason(null);
      setSeasonLoading(false);
    });
    return () => {
      unsubscribeGroup();
      unsubscribeSeason?.();
    };
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const timezone = group?.timezone || 'America/Sao_Paulo';
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const seasonsQuery = query(collection(db, 'seasons'), where('groupId', '==', groupId));
    return onSnapshot(seasonsQuery, snapshot => {
      const next = snapshot.docs
        .map(seasonDoc => ({ ...seasonDoc.data(), id: seasonDoc.id } as Season))
        .filter(season => !season.active && season.status !== 'closed' && season.startDate >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] || null;
      setUpcomingSeason(next);
      setUpcomingSeasonLoading(false);
    }, () => {
      setUpcomingSeason(null);
      setUpcomingSeasonLoading(false);
    });
  }, [groupId, group?.timezone]);

  const handlePeriodChange = (p: RankingPeriod) => {
    setPeriod(p);
  };

  // Find current user rank
  const currentUserEntry = entries.find(e => e.uid === user?.uid);
  const seasonUnavailable = period === 'season' && !seasonLoading && !activeSeason;

  return (
    <div className="ej-page ranking-page">
      <PageHeader
        eyebrow="Juntos, vamos mais longe"
        title="Ranking"
        description="Cada sessão conta. Acompanhe sua posição e evolua com o grupo."
        actions={<Link to="/seasons" className="ranking-history-link"><Icon name="seasons" size={18} />Temporadas<Icon name="arrow" size={16} /></Link>}
      />

      <div className="ranking-toolbar">
        <RankingTabs activePeriod={period} onPeriodChange={handlePeriodChange} />
        <span className="ranking-group-label"><Icon name="profile" size={17} />{group?.name || 'Seu grupo'}{!loading && <Badge tone="neutral">{totalMembers} membros</Badge>}</span>
      </div>

      <div id="ranking-panel" role="tabpanel" aria-labelledby={`ranking-tab-${period}`} className="ranking-panel">


        {currentUserEntry && !loading && !seasonUnavailable && (
          <Card className="ranking-personal">
            <div className="ranking-personal__identity"><Avatar src={currentUserEntry.avatarUrl} name={currentUserEntry.name} size="md" /><div><span className="ranking-eyebrow">Sua jornada {period === 'season' ? 'nesta temporada' : 'até aqui'}</span><h2>O próximo avanço é seu.</h2></div></div>
            <dl className="ranking-personal__numbers">
              <div><dt>Posição</dt><dd>#{currentUserEntry.rank}</dd></div>
              <div><dt>Pontos</dt><dd>{currentUserEntry.points.toLocaleString('pt-BR')}</dd></div>
              <div><dt>Estudadas</dt><dd>{(currentUserEntry.studySeconds / 3600).toFixed(1)}<small>h</small></dd></div>
            </dl>
            <Link to="/" className="ranking-personal__cta">Hora de estudar<Icon name="arrow" size={16} /></Link>
          </Card>
        )}

        {period === 'season' && <SeasonHero season={activeSeason} upcomingSeason={upcomingSeason} loading={seasonLoading || (!activeSeason && upcomingSeasonLoading)} timezone={group?.timezone} />}

        {seasonUnavailable ? null : loading ? (
          <Card className="ranking-loading"><LoadingState message="Buscando a dedicação do grupo..." /></Card>
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchRanking(period)} />
        ) : entries.length === 0 ? (
          <Card><EmptyState icon="🏆" title="O primeiro passo ainda está por vir" description="Assim que o grupo registrar estudos, as conquistas começam a aparecer aqui." /></Card>
        ) : (
          <RankingList
            entries={entries}
            currentUserId={user?.uid || ''}
            period={period}
          />
        )}
      </div>
    </div>
  );
};
