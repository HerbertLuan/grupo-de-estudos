import React from 'react';
import { motion } from 'framer-motion';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-secondary rounded-xl border border-accent-danger/20">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-accent-danger mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </motion.div>
      <h3 className="text-lg font-bold text-text-primary mb-2">Ops! Algo deu errado.</h3>
      <p className="text-text-secondary mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white font-medium rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      )}
    </div>
  );
}
