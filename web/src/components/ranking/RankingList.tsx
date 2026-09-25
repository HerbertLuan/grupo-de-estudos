import React from 'react';
import { Link } from 'react-router-dom';
import type { LeaderboardEntry, RankingPeriod } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge, Card, Icon } from '../ui/DesignSystem';
import { RankingUserRow } from './RankingUserRow';

interface RankingListProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  period: RankingPeriod;
  seasonSummary?: React.ReactNode;
}

export const RankingList: React.FC<RankingListProps> = ({ entries, currentUserId, period, seasonSummary }) => {
  if (entries.length === 0) {
    return <div className="text-center py-10 text-text-secondary">Nenhum dado disponível para este período.</div>;
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className={`ranking-leaderboard ${seasonSummary ? 'ranking-leaderboard--season' : ''}`}>
      <section className="ranking-podium-section" aria-labelledby="podium-heading">
        <div className="ranking-section-heading">
          <h2 id="podium-heading">No topo do ranking</h2>
          <Badge tone="yellow">Top {top3.length}</Badge>
        </div>
        <ol className="ranking-podium" data-count={top3.length}>
          {top3.map(entry => (
            <li key={entry.uid} className="ranking-podium__item" data-rank={entry.rank}>
              <Link to={`/progress/${entry.uid}`} className={`ranking-podium__card ${entry.uid === currentUserId ? 'is-current' : ''}`}>
                <span className="ranking-podium__place"><Icon name="ranking" size={16} /> {entry.rank}º lugar</span>
                <div className="ranking-podium__avatar"><Avatar src={entry.avatarUrl} name={entry.name} size="md" />{entry.uid === currentUserId && <span className="ranking-you">Você</span>}</div>
                <span className="ranking-podium__name">{entry.name}</span>
                <span className="ranking-podium__nickname">@{entry.nickname}</span>
                <span className="ranking-podium__score">{entry.points.toLocaleString('pt-BR')}<small>pontos</small></span>
                <span className="ranking-podium__details">
                  <span>{period === 'all' || period === 'season' ? `${(entry.studySeconds / 3600).toFixed(1)}h estudadas` : entry.levelName}</span>
                  {entry.currentStreak > 0 && <span><Icon name="bolt" size={13} />{entry.currentStreak} dias</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {seasonSummary && <aside className="ranking-season-summary" aria-label="Detalhes da temporada">{seasonSummary}</aside>}

      {rest.length > 0 && (
        <Card className="ranking-table">
          <div className="ranking-table__heading"><h2>Classificação</h2><span>{entries.length} participantes no ranking</span></div>
          <div className="ranking-table__columns" aria-hidden="true"><span>Posição</span><span>Estudante</span><span>Pontuação</span></div>
          <ol start={4}>
            {rest.map(entry => <li key={entry.uid}><RankingUserRow entry={entry} isCurrentUser={entry.uid === currentUserId} period={period} /></li>)}
          </ol>
        </Card>
      )}
      <p className="ranking-footnote">Consistência constrói resultados. Toque em um estudante para acompanhar sua evolução.</p>
    </div>
  );
};
