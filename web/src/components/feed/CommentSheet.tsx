import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedComment } from '../../types';
import { formatRelativeTime } from '../../utils/formatTime';

interface CommentSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  comments: FeedComment[];
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string;
}

export const CommentSheet: React.FC<CommentSheetProps> = ({ 
  isOpen, onClose, comments, onAddComment, onDeleteComment, currentUserId 
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[75vh] bg-bg-primary rounded-t-3xl z-50 flex flex-col border-t border-border shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg text-text-primary">Comentários</h3>
              <button onClick={onClose} className="w-8 h-8 bg-bg-secondary rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center text-text-secondary py-10">Nenhum comentário ainda. Seja o primeiro!</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary flex-shrink-0 overflow-hidden">
                      {c.authorAvatarUrl ? <img src={c.authorAvatarUrl} alt="" className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-xs">👤</span>}
                    </div>
                    <div className="flex-1 bg-bg-secondary p-3 rounded-2xl rounded-tl-sm border border-border relative group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-xs text-text-primary">{c.authorName}</span>
                        <span className="text-[10px] text-text-muted">{formatRelativeTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-text-secondary">{c.content}</p>
                      
                      {c.authorId === currentUserId && (
                        <button 
                          onClick={() => onDeleteComment(c.id)}
                          className="absolute -right-2 -top-2 w-6 h-6 bg-accent-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-bg-secondary">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={content} 
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 bg-bg-tertiary border border-border rounded-full px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
                <button 
                  type="submit" 
                  disabled={!content.trim() || isSubmitting}
                  className="w-10 h-10 bg-accent-primary text-white rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  ➤
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
