import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PointCelebrationProps {
  show: boolean;
  onClose: () => void;
  streak: number;
  totalPoints: number;
  newBadgesCount: number;
}

export function PointCelebration({
  show,
  onClose,
  streak,
  totalPoints,
  newBadgesCount
}: PointCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/90 backdrop-blur-md"
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
            {/* Simple confetti dots */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#6366F1', '#22C55E', '#F59E0B', '#F97316'][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: '-10%'
                }}
                animate={{
                  y: ['0vh', '100vh'],
                  x: [`${Math.random() * 20 - 10}vw`, `${Math.random() * 40 - 20}vw`],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  ease: 'easeOut',
                  delay: Math.random() * 0.5
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-bg-secondary border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ type: 'spring', damping: 10, delay: 0.2 }}
              className="text-7xl mb-6"
            >
              🎯
            </motion.div>
            
            <h2 className="text-2xl font-black text-text-primary mb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-success">
              PONTO CONQUISTADO!
            </h2>
            
            <p className="text-text-secondary mb-6">
              Você completou seus 60 minutos de estudo hoje. Excelente trabalho!
            </p>
            
            <div className="w-full space-y-3 mb-8">
              <div className="bg-bg-tertiary rounded-xl p-4 flex justify-between items-center">
                <span className="text-text-secondary font-medium">Total de Pontos</span>
                <span className="text-xl font-bold text-accent-primary">{totalPoints}</span>
              </div>
              
              {streak > 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-accent-fire/10 border border-accent-fire/20 rounded-xl p-4 flex justify-between items-center"
                >
                  <span className="text-accent-fire font-medium">Ofensiva</span>
                  <span className="font-bold text-accent-fire flex items-center gap-1">
                    🔥 {streak} dias seguidos!
                  </span>
                </motion.div>
              )}

              {newBadgesCount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-accent-warning/10 border border-accent-warning/20 rounded-xl p-4 flex justify-between items-center"
                >
                  <span className="text-accent-warning font-medium">Conquistas</span>
                  <span className="font-bold text-accent-warning flex items-center gap-1">
                    🏆 {newBadgesCount} nova(s)!
                  </span>
                </motion.div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full py-4 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl font-bold shadow-lg transition-colors"
            >
              CONTINUAR
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
