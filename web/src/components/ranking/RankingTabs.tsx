import React from 'react';
import type { RankingPeriod } from '../../types';
import { Icon } from '../ui/DesignSystem';

interface RankingTabsProps {
  activePeriod: RankingPeriod;
  onPeriodChange: (p: RankingPeriod) => void;
}

const TABS: { id: RankingPeriod; label: string; detail: string }[] = [
  { id: 'season', label: 'Temporada', detail: 'O ciclo atual' },
  { id: 'all', label: 'Geral', detail: 'Toda a sua trajetória' },
];

export const RankingTabs: React.FC<RankingTabsProps> = ({ activePeriod, onPeriodChange }) => (
  <div className="ranking-tabs" role="tablist" aria-label="Tipo de ranking">
    {TABS.map((tab, index) => (
      <button
        type="button"
        key={tab.id}
        id={`ranking-tab-${tab.id}`}
        onClick={() => onPeriodChange(tab.id)}
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + 1) % TABS.length;
          onPeriodChange(TABS[next].id);
          document.getElementById(`ranking-tab-${TABS[next].id}`)?.focus();
        }}
        role="tab"
        aria-controls="ranking-panel"
        aria-selected={activePeriod === tab.id}
        tabIndex={activePeriod === tab.id ? 0 : -1}
        className={`ranking-tabs__tab ${activePeriod === tab.id ? 'is-active' : ''}`}
      >
        <Icon name={tab.id === 'season' ? 'seasons' : 'ranking'} size={19} />
        <span>{tab.label}<small>{tab.detail}</small></span>
      </button>
    ))}
  </div>
);
