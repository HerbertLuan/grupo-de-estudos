import React from 'react';
import { Icon, StatCard } from '../ui/DesignSystem';
import '../../styles/social-redesign.css';

interface StatsCardProps { label: string; value: string | number; icon: string; highlight?: boolean; }

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, highlight = false }) => {
  const name = icon === '🎯' || icon === '⭐' ? 'bolt' : icon === '🏆' ? 'ranking' : icon === '📈' ? 'progress' : 'study';
  return <StatCard label={label} value={value} icon={<Icon name={name} size={20} />} tone={highlight ? 'yellow' : 'blue'} />;
};
