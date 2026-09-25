import React from 'react';
import { Icon, StatCard } from '../ui/DesignSystem';
import type { IconName } from '../ui/DesignSystem';
import '../../styles/social-redesign.css';

interface StatsCardProps { label: string; value: string | number; icon: string; highlight?: boolean; }

const statIcons: Record<string, IconName> = {
  study: 'study',
  seasons: 'seasons',
  progress: 'progress',
  bolt: 'bolt',
  ranking: 'ranking',
};

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, highlight = false }) => {
  const name = statIcons[icon] ?? 'study';
  return <StatCard label={label} value={value} icon={<Icon name={name} size={20} />} tone={highlight ? 'yellow' : 'blue'} />;
};
