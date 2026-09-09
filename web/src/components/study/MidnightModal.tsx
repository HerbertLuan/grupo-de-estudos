import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MidnightModalProps {
  show: boolean;
  onFinish: () => void;
}

export function MidnightModal({ show, onFinish }: MidnightModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-bg-secondary border border-border rounded-2xl p-6 max-w-sm w-full text-center shadow-xl"
          >
            <div className="text-5xl mb-4">⏰</div>
            <h3 className="text-xl font-bold text-text-primary mb-3">
              Meia-noite!
            </h3>
            <p className="text-text-secondary mb-8">
              Passamos da meia-noite! Sua sessão será registrada no dia anterior. Deseja finalizar agora?
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onFinish}
              className="w-full py-3.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl font-bold transition-colors"
            >
              FINALIZAR ESTUDO
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
