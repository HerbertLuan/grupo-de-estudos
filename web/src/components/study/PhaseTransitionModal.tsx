import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimerStatus } from '../../hooks/useStudyTimer';

export interface PhaseTransitionModalProps {
  status: TimerStatus;
  onStartBreak: () => void;
  onSkipBreak: () => void;
  onStartFocus: () => void;
  onFinish: () => void;
  requiresFinish: boolean;
  error: string | null;
}

export function PhaseTransitionModal({
  status,
  onStartBreak,
  onSkipBreak,
  onStartFocus,
  onFinish,
  requiresFinish,
  error,
}: PhaseTransitionModalProps) {
  const isFocusEnd = status === 'phase_end_focus';
  const isBreakEnd = status === 'phase_end_break';
  const show = isFocusEnd || isBreakEnd;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/85 backdrop-blur-md"
        >
          {/* Partículas de fundo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full opacity-60"
                style={{
                  backgroundColor: isFocusEnd
                    ? ['#22C55E', '#6366F1', '#F59E0B'][i % 3]
                    : ['#6366F1', '#22C55E', '#F97316'][i % 3],
                  left: `${10 + (i * 7) % 80}%`,
                  top: '-5%',
                }}
                animate={{
                  y: ['0vh', '110vh'],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2.5 + (i % 3) * 0.5,
                  ease: 'easeOut',
                  delay: i * 0.08,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative bg-bg-secondary border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5"
          >
            {/* Emoji animado */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -8, 8, -8, 8, 0] }}
              transition={{ type: 'spring', damping: 10, delay: 0.15 }}
              className="text-6xl"
            >
              {isFocusEnd ? '🎯' : '☕'}
            </motion.div>

            {/* Título */}
            <div>
              <h2 className="text-2xl font-black text-text-primary mb-1">
                {isFocusEnd ? 'Foco encerrado!' : 'Intervalo encerrado!'}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                {isFocusEnd
                  ? requiresFinish ? 'Não foi possível salvar o foco. Tente finalizar a sessão novamente.' : 'Ótimo trabalho! Você merece descansar um pouco.'
                  : 'Pronto para voltar ao foco?'}
              </p>
              {isFocusEnd && requiresFinish && error && <p role="alert" className="text-accent-danger text-sm mt-2">{error}</p>}
            </div>

            {/* Botões — Fim do Foco */}
            {isFocusEnd && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full flex flex-col gap-3"
              >
                {!requiresFinish && <motion.button
                  id="btn-start-break"
                  whileTap={{ scale: 0.96 }}
                  onClick={onStartBreak}
                  className="w-full py-4 bg-accent-success hover:bg-green-400 text-bg-primary rounded-xl font-bold text-lg shadow-lg transition-colors"
                >
                  ☕ Iniciar Intervalo
                </motion.button>}
                <motion.button
                  id="btn-finish-after-focus"
                  whileTap={{ scale: 0.96 }}
                  onClick={onFinish}
                  className="w-full py-3.5 bg-bg-tertiary hover:bg-bg-quaternary border border-border text-text-secondary rounded-xl font-bold transition-colors"
                >
                  {requiresFinish ? 'Tentar finalizar novamente' : 'Finalizar Sessão'}
                </motion.button>
                {!requiresFinish && <button
                  id="btn-skip-break-after-focus"
                  onClick={onSkipBreak}
                  className="text-sm text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
                >
                  Pular intervalo e continuar estudando
                </button>}
              </motion.div>
            )}

            {/* Botões — Fim do Intervalo */}
            {isBreakEnd && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full flex flex-col gap-3"
              >
                <motion.button
                  id="btn-start-focus-again"
                  whileTap={{ scale: 0.96 }}
                  onClick={onStartFocus}
                  className="w-full py-4 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl font-bold text-lg shadow-lg shadow-accent-primary/25 transition-colors"
                >
                  🎯 Iniciar Novo Foco
                </motion.button>
                <motion.button
                  id="btn-finish-after-break"
                  whileTap={{ scale: 0.96 }}
                  onClick={onFinish}
                  className="w-full py-3.5 bg-bg-tertiary hover:bg-bg-quaternary border border-border text-text-secondary rounded-xl font-bold transition-colors"
                >
                  Finalizar Sessão
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
