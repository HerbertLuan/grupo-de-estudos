import React from 'react';
import { motion } from 'framer-motion';

export interface DailyProgressProps {
  totalSecondsToday: number;
  pointEarned: boolean;
  elapsedSeconds: number;
  isActive: boolean;
}

export function DailyProgress({
  totalSecondsToday,
  pointEarned,
  elapsedSeconds,
  isActive
}: DailyProgressProps) {
  const targetSeconds = 60 * 60; // 60 minutes
  const currentTotal = totalSecondsToday + (isActive ? elapsedSeconds : 0);
  
  const progressPercentage = Math.min(100, Math.max(0, (currentTotal / targetSeconds) * 100));
  const minutesTotal = Math.floor(currentTotal / 60);
  
  const isPointEarnedNow = pointEarned || currentTotal >= targetSeconds;

  return (
    <div className="w-full max-w-sm mx-auto px-6 py-4">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-text-secondary">Meta Diária</span>
        <span className={`text-sm font-bold ${isPointEarnedNow ? 'text-accent-success' : 'text-text-primary'}`}>
          {isPointEarnedNow ? '1 ponto conquistado! 🎯' : `${minutesTotal} / 60 min`}
        </span>
      </div>
      
      <div className="h-2.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isPointEarnedNow ? 'bg-accent-success' : 'bg-accent-primary'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      
      {!isPointEarnedNow && (
        <p className="text-xs text-text-muted mt-2 text-center">
          Faltam {60 - minutesTotal} minutos para ganhar seu ponto hoje!
        </p>
      )}
    </div>
  );
}
