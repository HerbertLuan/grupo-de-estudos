import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimerMode } from '../../types';
import type { TimerStatus } from '../../hooks/useStudyTimer';

export interface TimerControlsProps {
  status: TimerStatus;
  timerMode: TimerMode;
  isLoading: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  onSkipBreak: () => void;
}

export function TimerControls({
  status,
  timerMode,
  isLoading,
  onStart,
  onPause,
  onResume,
  onFinish,
  onDiscard,
  onSkipBreak,
}: TimerControlsProps) {

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4 px-4">
      <AnimatePresence mode="wait">

        {/* ── Idle ────────────────────────────────────────────────────── */}
        {status === 'idle' && (
          <motion.button
            key="start"
            id="btn-start-study"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileTap={{ scale: 0.96 }}
            disabled={isLoading}
            onClick={onStart}
            className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {timerMode === 'timer' ? '🎯 INICIAR FOCO' : 'COMEÇAR A ESTUDAR'}
          </motion.button>
        )}

        {/* ── Foco ativo ──────────────────────────────────────────────── */}
        {status === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3 w-full"
          >
            <motion.button
              id="btn-pause"
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onPause}
              className="w-full bg-accent-warning hover:bg-yellow-400 text-bg-primary rounded-xl py-4 font-bold text-lg shadow-lg disabled:opacity-50 transition-colors"
            >
              PAUSAR
            </motion.button>
            <motion.button
              id="btn-finish-from-active"
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onFinish}
              className="w-full bg-accent-success hover:bg-green-400 text-bg-primary rounded-xl py-3.5 font-bold shadow-lg disabled:opacity-50 transition-colors"
            >
              FINALIZAR SESSÃO
            </motion.button>
          </motion.div>
        )}

        {/* ── Foco pausado ────────────────────────────────────────────── */}
        {status === 'paused' && (
          <motion.div
            key="paused"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3 w-full items-center"
          >
            <motion.button
              id="btn-resume"
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onResume}
              className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-accent-primary/25 disabled:opacity-50 transition-colors"
            >
              CONTINUAR
            </motion.button>
            <motion.button
              id="btn-finish-from-paused"
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onFinish}
              className="w-full bg-accent-success hover:bg-green-400 text-bg-primary rounded-xl py-3.5 font-bold shadow-lg disabled:opacity-50 transition-colors"
            >
              FINALIZAR SESSÃO
            </motion.button>
            <button
              id="btn-discard"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja descartar esta sessão? O tempo não será salvo.')) {
                  onDiscard();
                }
              }}
              disabled={isLoading}
              className="mt-2 text-sm text-accent-danger hover:text-red-400 underline underline-offset-2 disabled:opacity-50"
            >
              Descartar sessão
            </button>
          </motion.div>
        )}

        {/* ── Intervalo ativo ─────────────────────────────────────────── */}
        {status === 'active_break' && (
          <motion.div
            key="active-break"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3 w-full"
          >
            <motion.button
              id="btn-skip-break"
              whileTap={{ scale: 0.96 }}
              onClick={onSkipBreak}
              className="w-full bg-bg-tertiary hover:bg-bg-quaternary border border-border text-text-secondary rounded-xl py-4 font-bold text-lg transition-colors"
            >
              ⏭ Pular Intervalo
            </motion.button>
          </motion.div>
        )}

        {/* ── Transição: foco encerrou ─────────────────────────────────
            (o PhaseTransitionModal cuida disso — botões ficam ocultos) */}
        {(status === 'phase_end_focus' || status === 'phase_end_break') && (
          <motion.div
            key="phase-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-14"
          />
        )}

      </AnimatePresence>
    </div>
  );
}
