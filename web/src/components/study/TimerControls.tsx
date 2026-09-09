import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimerControlsProps {
  status: 'idle' | 'active' | 'paused' | 'loading';
  isLoading: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}

export function TimerControls({
  status,
  isLoading,
  onStart,
  onPause,
  onResume,
  onFinish,
  onDiscard
}: TimerControlsProps) {
  
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4 px-4">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.button
            key="start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileTap={{ scale: 0.96 }}
            disabled={isLoading}
            onClick={onStart}
            className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-accent-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            COMEÇAR A ESTUDAR
          </motion.button>
        )}
        
        {status === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3 w-full"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onPause}
              className="w-full bg-accent-warning hover:bg-yellow-400 text-bg-primary rounded-xl py-4 font-bold text-lg shadow-lg disabled:opacity-50 transition-colors"
            >
              PAUSAR
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onFinish}
              className="w-full bg-accent-success hover:bg-green-400 text-bg-primary rounded-xl py-3.5 font-bold shadow-lg disabled:opacity-50 transition-colors"
            >
              FINALIZAR SESSÃO
            </motion.button>
          </motion.div>
        )}
        
        {status === 'paused' && (
          <motion.div
            key="paused"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3 w-full items-center"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onResume}
              className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-accent-primary/25 disabled:opacity-50 transition-colors"
            >
              CONTINUAR
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={isLoading}
              onClick={onFinish}
              className="w-full bg-accent-success hover:bg-green-400 text-bg-primary rounded-xl py-3.5 font-bold shadow-lg disabled:opacity-50 transition-colors"
            >
              FINALIZAR SESSÃO
            </motion.button>
            <button
              onClick={() => {
                if(window.confirm('Tem certeza que deseja descartar esta sessão? O tempo não será salvo.')) {
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
      </AnimatePresence>
    </div>
  );
}
