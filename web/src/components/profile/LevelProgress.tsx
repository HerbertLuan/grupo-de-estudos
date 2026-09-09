import React from 'react';
import { LevelConfig } from '../../types';

interface LevelProgressProps {
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
  currentSeconds: number;
  requiredSecondsForNext: number;
  progressPercentage: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ 
  currentLevel, 
  nextLevel, 
  currentSeconds, 
  requiredSecondsForNext, 
  progressPercentage 
}) => {
  return (
    <div className="bg-bg-secondary p-5 rounded-2xl border border-border">
      <div className="flex justify-between items-end mb-3">
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary mb-1">Nível Atual</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentLevel.icon}</span>
            <span className="font-bold text-text-primary">{currentLevel.name}</span>
          </div>
        </div>
        
        {nextLevel ? (
          <div className="flex flex-col items-end">
            <span className="text-xs text-text-secondary mb-1">Próximo Nível</span>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="font-semibold">{nextLevel.name}</span>
              <span className="text-xl opacity-50">{nextLevel.icon}</span>
            </div>
          </div>
        ) : (
          <div className="text-accent-warning font-bold">Nível Máximo! 🏆</div>
        )}
      </div>

      <div className="w-full bg-bg-tertiary rounded-full h-3 overflow-hidden">
        <div 
          className="bg-accent-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
        />
      </div>
      
      {nextLevel && (
        <div className="mt-2 text-xs text-right text-text-secondary">
          Faltam {Math.ceil((requiredSecondsForNext - currentSeconds) / 3600)}h para o próximo nível
        </div>
      )}
    </div>
  );
};
