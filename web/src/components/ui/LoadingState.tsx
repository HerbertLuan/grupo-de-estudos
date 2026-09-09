import React from 'react';
import { motion } from 'framer-motion';

export interface LoadingStateProps {
  fullPage?: boolean;
  message?: string;
}

export function LoadingState({ fullPage, message }: LoadingStateProps) {
  const containerClasses = fullPage
    ? "fixed inset-0 flex flex-col items-center justify-center bg-bg-primary z-50"
    : "flex flex-col items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <motion.div
        className="w-12 h-12 border-4 border-bg-tertiary border-t-accent-primary rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {message && <p className="mt-4 text-text-secondary text-sm">{message}</p>}
    </div>
  );
}
