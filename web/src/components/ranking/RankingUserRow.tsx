import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardEntry, RankingPeriod } from '../../types';

interface RankingUserRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  period: RankingPeriod;
}

export const RankingUserRow: React.FC<RankingUserRowProps> = ({ entry, isCurrentUser, period }) => {
  const navigate = useNavigate();
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-accent-warning'; // Gold
    if (rank === 2) return 'text-gray-300'; // Silver
    if (rank === 3) return 'text-accent-fire'; // Bronze
    return 'text-text-secondary';
  };

  const studyHours = (entry.studySeconds / 3600).toFixed(1);

  return (
    <div
      className={`flex items-center p-3 rounded-xl mb-2 cursor-pointer transition-opacity hover:opacity-75 ${isCurrentUser ? 'bg-accent-primary/10 border-l-2 border-accent-primary' : 'bg-bg-secondary'}`}
      onClick={() => navigate(`/progress/${entry.uid}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/progress/${entry.uid}`)}
    >
      <div className={`w-8 font-bold text-center ${getRankColor(entry.rank)}`}>
        {getMedal(entry.rank)}
      </div>
      
      <div className="flex-1 ml-3 flex items-center">
        <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-xl overflow-hidden">
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div className="ml-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{entry.name}</span>
            {entry.currentStreak > 0 && (
              <span className="text-xs bg-accent-fire/20 text-accent-fire px-1.5 py-0.5 rounded flex items-center gap-1">
                🔥 {entry.currentStreak}
              </span>
            )}
          </div>
          <span className="text-sm text-text-secondary">@{entry.nickname}</span>
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-text-primary">{entry.points} pts</div>
        {period === 'all' || period === 'season' ? (
          <div className="mt-0.5 text-xs font-medium text-accent-primary-hover">{studyHours}h estudadas</div>
        ) : (
          <div className="text-xs text-text-muted">{entry.levelName}</div>
        )}
      </div>
    </div>
  );
};
