import React from 'react';
import { RankingPeriod } from '../../types';

interface RankingTabsProps {
  activePeriod: RankingPeriod;
  onPeriodChange: (p: RankingPeriod) => void;
}

const TABS: { id: RankingPeriod; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all', label: 'Geral' },
  { id: 'season', label: 'Temporada' },
  { id: 'hours', label: 'Horas' },
];

export const RankingTabs: React.FC<RankingTabsProps> = ({ activePeriod, onPeriodChange }) => {
  return (
    <div className="flex overflow-x-auto gap-2 no-scrollbar py-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onPeriodChange(tab.id)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activePeriod === tab.id
              ? 'bg-accent-primary text-white'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          }`}
          aria-label={`Ver ranking por ${tab.label}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
