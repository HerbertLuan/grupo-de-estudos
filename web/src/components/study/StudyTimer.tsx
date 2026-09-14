import React from 'react';
import { motion } from 'framer-motion';
import { formatSeconds } from '../../utils/formatTime';
import type { TimerMode, TimerPhase } from '../../types';
import type { TimerStatus } from '../../hooks/useStudyTimer';

export interface StudyTimerProps {
  elapsedSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  timerMode: TimerMode;
  timerPhase: TimerPhase;
  /** Duração total da fase atual em segundos (para a barra de progresso) */
  focusDurationSeconds: number;
  breakDurationSeconds: number;
}

function getDisplaySeconds(props: StudyTimerProps): number {
  const { timerMode, elapsedSeconds, remainingSeconds } = props;
  if (timerMode === 'timer') return remainingSeconds;
  return elapsedSeconds;
}

function getProgressPercent(props: StudyTimerProps): number | null {
  const { timerMode, timerPhase, remainingSeconds, focusDurationSeconds, breakDurationSeconds } = props;
  if (timerMode !== 'timer') return null;
  const total = timerPhase === 'focus' ? focusDurationSeconds : breakDurationSeconds;
  if (total <= 0) return null;
  const elapsed = total - remainingSeconds;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function getColors(status: TimerStatus, timerPhase: TimerPhase) {
  if (status === 'active_break' || (status === 'phase_end_break' && timerPhase === 'focus')) {
    // Intervalo ativo
    return {
      text: 'text-accent-success drop-shadow-[0_0_12px_rgba(34,197,94,0.3)]',
      dot: 'bg-accent-success',
      ring: 'border-accent-success/20',
      progress: 'bg-accent-success',
    };
  }
  if (status === 'paused') {
    return {
      text: 'text-accent-warning opacity-80',
      dot: 'bg-accent-warning',
      ring: 'border-accent-warning/20',
      progress: 'bg-accent-warning',
    };
  }
  if (status === 'active') {
    return {
      text: 'text-accent-primary drop-shadow-[0_0_12px_rgba(99,102,241,0.3)]',
      dot: 'bg-accent-primary',
      ring: 'border-accent-primary/20',
      progress: 'bg-accent-primary',
    };
  }
  if (status === 'loading') {
    return {
      text: 'text-text-muted opacity-50',
      dot: 'bg-text-muted',
      ring: 'border-border',
      progress: 'bg-text-muted',
    };
  }
  // idle / phase_end_*
  return {
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    ring: 'border-border',
    progress: 'bg-text-muted',
  };
}

function getStatusLabel(status: TimerStatus, timerPhase: TimerPhase, timerMode: TimerMode): string {
  switch (status) {
    case 'active':
      return timerMode === 'timer' ? '🎯 Foco' : 'Focado';
    case 'active_break':
      return '☕ Intervalo';
    case 'paused':
      return 'Pausado';
    case 'phase_end_focus':
      return '✅ Foco encerrado';
    case 'phase_end_break':
      return '🔔 Intervalo encerrado';
    case 'loading':
      return 'Carregando...';
    case 'idle':
    default:
      return 'Pronto para começar';
  }
}

export function StudyTimer({
  elapsedSeconds,
  remainingSeconds,
  status,
  timerMode,
  timerPhase,
  focusDurationSeconds,
  breakDurationSeconds,
}: StudyTimerProps) {
  const displaySeconds = getDisplaySeconds({ elapsedSeconds, remainingSeconds, status, timerMode, timerPhase, focusDurationSeconds, breakDurationSeconds });
  const progressPercent = getProgressPercent({ elapsedSeconds, remainingSeconds, status, timerMode, timerPhase, focusDurationSeconds, breakDurationSeconds });
  const colors = getColors(status, timerPhase);
  const label = getStatusLabel(status, timerPhase, timerMode);

  const isBreak = status === 'active_break';
  const isActive = status === 'active' || isBreak;

  return (
    <div className="relative flex flex-col items-center justify-center py-10">
      {/* Halo animado */}
      {isActive && (
        <motion.div
          className={`absolute inset-0 rounded-full border-2 ${colors.ring} pointer-events-none`}
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Label de status */}
      <div className="flex items-center gap-2 mb-3">
        {isActive && (
          <motion.div
            className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          {label}
        </span>
      </div>

      {/* Display principal do tempo */}
      <motion.div
        className={`text-6xl lg:text-7xl font-bold tabular-nums tracking-tight transition-colors duration-500 ${colors.text}`}
        animate={status === 'paused' ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={status === 'paused' ? { duration: 2, repeat: Infinity } : {}}
      >
        {formatSeconds(displaySeconds)}
      </motion.div>

      {/* Barra de progresso — apenas no modo timer */}
      {progressPercent !== null && (
        <div className="w-48 mt-5">
          <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${colors.progress}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-text-muted text-center mt-1.5">
            {timerPhase === 'focus'
              ? `${Math.floor(focusDurationSeconds / 60)} min de foco`
              : `${Math.floor(breakDurationSeconds / 60)} min de intervalo`}
          </p>
        </div>
      )}
    </div>
  );
}
