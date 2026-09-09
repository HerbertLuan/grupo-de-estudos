import React from 'react';
import { motion } from 'framer-motion';

// Mock formatSeconds to avoid dependency failure if not created yet
const formatSeconds = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export interface StudyTimerProps {
  elapsedSeconds: number;
  status: 'idle' | 'active' | 'paused' | 'loading';
}

export function StudyTimer({ elapsedSeconds, status }: StudyTimerProps) {
  const formattedTime = formatSeconds(elapsedSeconds);
  
  const getTimerClasses = () => {
    switch (status) {
      case 'active': return 'text-accent-primary drop-shadow-[0_0_12px_rgba(99,102,241,0.3)]';
      case 'paused': return 'text-accent-warning opacity-80';
      case 'loading': return 'text-text-muted opacity-50';
      case 'idle':
      default: return 'text-text-muted';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-12">
      {status === 'active' && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-accent-primary/20 pointer-events-none"
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      <div className="flex items-center gap-4 mb-2">
        {status === 'active' && (
          <motion.div
            className="w-3 h-3 rounded-full bg-accent-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className="text-sm font-medium uppercase tracking-widest text-text-secondary">
          {status === 'active' ? 'Focado' : status === 'paused' ? 'Pausado' : 'Pronto para começar'}
        </span>
      </div>
      
      <motion.div
        className={`text-6xl lg:text-7xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${getTimerClasses()}`}
        animate={status === 'paused' ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={status === 'paused' ? { duration: 2, repeat: Infinity } : {}}
      >
        {formattedTime}
      </motion.div>
    </div>
  );
}
