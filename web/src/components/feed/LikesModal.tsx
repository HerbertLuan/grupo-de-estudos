import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedLikeUser } from '../../types';

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  likes: FeedLikeUser[];
  isLoading: boolean;
}

export const LikesModal: React.FC<LikesModalProps> = ({ isOpen, onClose, likes, isLoading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[60vh] bg-bg-primary rounded-t-3xl z-50 flex flex-col border-t border-border shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h3 className="font-bold text-lg text-text-primary">
                Curtidas{!isLoading && likes.length > 0 && (
                  <span className="text-sm font-normal text-text-secondary ml-1">({likes.length})</span>
                )}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-bg-secondary rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                &#x2715;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : likes.length === 0 ? (
                <div className="text-center text-text-secondary py-8">
                  <div className="text-3xl mb-2">&#x1F90D;</div>
                  <p>Ninguem curtiu ainda.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {likes.map((user) => {
                    const displayName = user.nickname || user.name || 'Usuario';
                    return (
                      <li key={user.uid} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center flex-shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">&#x1F464;</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-text-primary">{displayName}</div>
                          {user.name && user.name !== user.nickname && (
                            <div className="text-xs text-text-secondary">{user.name}</div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
