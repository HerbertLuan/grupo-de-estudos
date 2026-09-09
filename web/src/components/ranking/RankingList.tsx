import React from 'react';
import { LeaderboardEntry, RankingPeriod } from '../../types';
import { RankingUserRow } from './RankingUserRow';

interface RankingListProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  period: RankingPeriod;
}

export const RankingList: React.FC<RankingListProps> = ({ entries, currentUserId, period }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-text-secondary">
        Nenhum dado disponível para este período.
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="flex flex-col w-full">
      <div className="mb-4">
        {top3.map(entry => (
          <RankingUserRow
            key={entry.uid}
            entry={entry}
            isCurrentUser={entry.uid === currentUserId}
            period={period}
          />
        ))}
      </div>
      
      {rest.length > 0 && (
        <>
          <div className="h-px bg-border my-4 mx-2" />
          <div className="mt-4">
            {rest.map(entry => (
              <RankingUserRow
                key={entry.uid}
                entry={entry}
                isCurrentUser={entry.uid === currentUserId}
                period={period}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
