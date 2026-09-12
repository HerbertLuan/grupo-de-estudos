import React, { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthContext } from '../contexts/AuthContext';
import { RankingTabs } from '../components/ranking/RankingTabs';
import { RankingList } from '../components/ranking/RankingList';
import { SeasonHero } from '../components/ranking/SeasonHero';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { getLeaderboard } from '../services/rankingService';
import { db } from '../firebase/config';
import type { RankingPeriod, LeaderboardEntry, Group, Season } from '../types';

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
    <div className="w-full max-w-3xl mx-auto p-4 pb-28 sm:p-6 sm:pb-28">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 mt-2">
        <h1 className="text-2xl font-bold text-text-primary">Ranking 🏆</h1>
        <span className="text-sm text-text-muted">{totalMembers} membros</span>
      </div>

      {/* Period tabs */}
      <div className="mb-4">
        <RankingTabs activePeriod={period} onPeriodChange={handlePeriodChange} />
      </div>

      {period === 'season' && <div className="mb-4">
        <SeasonHero season={activeSeason} upcomingSeason={upcomingSeason} loading={seasonLoading || (!activeSeason && upcomingSeasonLoading)} timezone={group?.timezone} />
      </div>}

      {/* Current user position banner */}
      {currentUserEntry && !loading && !seasonUnavailable && (
        <div className="mb-4 p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-xl flex items-center justify-between">
          <span className="text-sm text-text-secondary">Sua posição</span>
          <span className="font-bold text-accent-primary text-lg">#{currentUserEntry.rank}</span>
        </div>
      )}

      {/* Ranking content */}
      {seasonUnavailable ? null : loading ? (
        <div className="flex justify-center py-12">
          <LoadingState message="Carregando ranking..." />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchRanking(period)} />
      ) : entries.length === 0 ? (
        <EmptyState icon="🏆" title="Nenhum dado ainda" description="O ranking será exibido assim que houver atividade no grupo." />
      ) : (
        <div className="bg-bg-secondary rounded-2xl border border-border overflow-hidden">
          <RankingList
            entries={entries}
            currentUserId={user?.uid || ''}
            period={period}
          />
        </div>
      )}
    </div>
  );
};
