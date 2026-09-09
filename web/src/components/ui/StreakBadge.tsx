import React from 'react';
import { motion } from 'framer-motion';

export interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const isActive = streak > 0;
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';
    
  const colorClasses = isActive 
    ? 'bg-accent-fire/10 text-accent-fire border-accent-fire/30' 
    : 'bg-bg-tertiary text-text-muted border-border';

  return (
    <motion.div 
      whileHover={isActive ? { scale: 1.05 } : {}}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClasses} ${colorClasses}`}
    >
      <span className={!isActive ? 'opacity-50 grayscale' : ''}>🔥</span>
      <span>{streak}</span>
    </motion.div>
  );
}
