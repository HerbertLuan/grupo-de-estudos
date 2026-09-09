import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, highlight = false }) => {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-accent-primary/10 border-accent-primary/30' : 'bg-bg-secondary border-border'} flex flex-col items-center justify-center text-center`}>
      <span className="text-2xl mb-2">{icon}</span>
      <span className={`text-xl font-bold ${highlight ? 'text-accent-primary' : 'text-text-primary'}`}>{value}</span>
      <span className="text-xs text-text-secondary mt-1">{label}</span>
    </div>
  );
};
