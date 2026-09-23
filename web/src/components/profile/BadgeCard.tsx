import React from 'react';
import { BadgeConfig } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { Badge } from '../ui/DesignSystem';

interface BadgeCardProps { badge: BadgeConfig; earned: boolean; earnedDate?: string; }

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, earned, earnedDate }) => (
  <article className={`achievement-card ${earned ? 'achievement-card--earned' : ''}`}>
    <div className="achievement-card__symbol" aria-hidden="true">{badge.icon}</div>
    <h3>{badge.name}</h3><p>{badge.description}</p>
    <div className="mt-auto pt-4"><Badge tone={earned ? 'yellow' : 'neutral'}>{earned ? 'Conquistada' : 'A conquistar'}</Badge></div>
    {earned && earnedDate && <span className="mt-2 text-xs text-text-secondary">{formatDate(earnedDate)}</span>}
  </article>
);
