import React from 'react';
import { BadgeConfig } from '../../types';
import { formatDate } from '../../utils/formatDate';

interface BadgeCardProps {
  badge: BadgeConfig;
  earned: boolean;
  earnedDate?: string;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, earned, earnedDate }) => {
  return (
    <div className={`relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
      earned ? 'bg-bg-secondary border-accent-success/30 opacity-100' : 'bg-bg-tertiary border-border opacity-50'
    }`}>
      <div className="text-4xl mb-3">{badge.icon}</div>
      <h3 className="font-bold text-sm text-text-primary mb-1">{badge.name}</h3>
      <p className="text-xs text-text-secondary mb-2">{badge.description}</p>
      
      {earned && earnedDate && (
        <div className="mt-auto text-[10px] text-accent-success flex items-center gap-1">
          <span>✓</span> {formatDate(earnedDate)}
        </div>
      )}
      
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/40 rounded-2xl backdrop-blur-[1px]">
          <span className="bg-bg-tertiary px-2 py-1 rounded text-xs text-text-muted font-medium border border-border">
            🔒 Bloqueada
          </span>
        </div>
      )}
    </div>
  );
};
