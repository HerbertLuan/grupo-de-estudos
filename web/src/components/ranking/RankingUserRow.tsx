import React from 'react';
import { Link } from 'react-router-dom';
import type { LeaderboardEntry, RankingPeriod } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/DesignSystem';

interface RankingUserRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  period: RankingPeriod;
}

export const RankingUserRow: React.FC<RankingUserRowProps> = ({ entry, isCurrentUser, period }) => (
  <Link
    to={`/progress/${entry.uid}`}
    className={`ranking-row ${isCurrentUser ? 'is-current' : ''}`}
    aria-label={`${entry.rank}º lugar, ${entry.name}${isCurrentUser ? ', você' : ''}, ${entry.points} pontos. Ver perfil`}
  >
    <span className="ranking-row__position">{String(entry.rank).padStart(2, '0')}</span>
    <Avatar src={entry.avatarUrl} name={entry.name} size="md" />
    <span className="ranking-row__identity">
      <span className="ranking-row__name">{entry.name}{isCurrentUser && <span className="ranking-you">Você</span>}</span>
      <span className="ranking-row__nickname">@{entry.nickname}</span>
    </span>
    {entry.currentStreak > 0 && (
      <span className="ranking-row__streak" title={`${entry.currentStreak} dias de sequência`}>
        <Icon name="bolt" size={14} /><span>{entry.currentStreak}<span className="ranking-row__streak-label"> dias</span></span>
      </span>
    )}
    <span className="ranking-row__score">
      <strong>{entry.points.toLocaleString('pt-BR')} <small>pts</small></strong>
      <span>{period === 'all' || period === 'season' ? `${(entry.studySeconds / 3600).toFixed(1)}h estudadas` : entry.levelName}</span>
    </span>
    <Icon name="arrow" size={15} className="ranking-row__arrow" />
  </Link>
);
