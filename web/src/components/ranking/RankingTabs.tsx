import React from 'react';
import { RankingPeriod } from '../../types';

interface RankingTabsProps {
  activePeriod: RankingPeriod;
  onPeriodChange: (p: RankingPeriod) => void;
}

const TABS: { id: RankingPeriod; label: string; featured?: boolean }[] = [
  { id: 'season', label: 'Temporadas', featured: true },
  { id: 'all', label: 'Geral' },
];

export const RankingTabs: React.FC<RankingTabsProps> = ({ activePeriod, onPeriodChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-bg-secondary p-1.5" role="tablist" aria-label="Tipo de ranking">
      {TABS.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => onPeriodChange(tab.id)}
          role="tab"
          aria-selected={activePeriod === tab.id}
          className={`relative whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
            activePeriod === tab.id
              ? tab.featured
                ? 'bg-gradient-to-r from-accent-warning to-orange-500 text-bg-primary shadow-md shadow-accent-warning/15'
                : 'bg-accent-primary text-white shadow-md shadow-accent-primary/15'
              : tab.featured
                ? 'border border-accent-warning/30 bg-accent-warning/10 text-accent-warning hover:bg-accent-warning/15'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
          aria-label={`Ver ranking por ${tab.label}`}
        >
          {tab.featured && <span aria-hidden="true" className="mr-1">🏆</span>}{tab.label}
        </button>
      ))}
    </div>
  );
};
