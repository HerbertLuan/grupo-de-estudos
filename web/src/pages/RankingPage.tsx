import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { RankingTabs } from '../components/ranking/RankingTabs';
import { RankingList } from '../components/ranking/RankingList';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { getLeaderboard } from '../services/rankingService';
import type { RankingPeriod, LeaderboardEntry } from '../types';

export const RankingPage: React.FC = () => {
  const [period, setPeriod] = useState<RankingPeriod>('week');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuthContext();

  const fetchRanking = useCallback(async (p: RankingPeriod) => {
    if (!profile?.groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard(profile.groupId, p);
      setEntries(res.entries ?? []);
      setTotalMembers(res.totalMembers ?? 0);
    } catch (err: any) {
      setError(err?.message || 'Erro ao buscar ranking');
    } finally {
      setLoading(false);
    }
  }, [profile?.groupId]);

  useEffect(() => {
    fetchRanking(period);
  }, [fetchRanking, period]);

  const handlePeriodChange = (p: RankingPeriod) => {
    setPeriod(p);
    fetchRanking(p);
  };

  // Find current user rank
  const currentUserEntry = entries.find(e => e.uid === user?.uid);

  return (
    <div className="p-4 pb-28 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 mt-2">
        <h1 className="text-2xl font-bold text-text-primary">Ranking 🏆</h1>
        <span className="text-sm text-text-muted">{totalMembers} membros</span>
      </div>

      {/* Period tabs */}
      <div className="mb-4">
        <RankingTabs activePeriod={period} onPeriodChange={handlePeriodChange} />
      </div>

      {/* Current user position banner */}
      {currentUserEntry && !loading && (
        <div className="mb-4 p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-xl flex items-center justify-between">
          <span className="text-sm text-text-secondary">Sua posição</span>
          <span className="font-bold text-accent-primary text-lg">#{currentUserEntry.rank}</span>
        </div>
      )}

      {/* Ranking content */}
      {loading ? (
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
