import React, { useState } from 'react';
import { FeedComment } from '../../types';
import { formatRelativeTime } from '../../utils/formatTime';
import { Avatar } from '../ui/Avatar';
import { Button, Icon } from '../ui/DesignSystem';
import { LoadingState } from '../ui/LoadingState';
import { CommunityDialog } from './CommunityDialog';

interface CommentSheetProps { postId: string; isOpen: boolean; onClose: () => void; comments: FeedComment[]; isLoading?: boolean; onAddComment: (content: string) => Promise<void>; onDeleteComment: (commentId: string) => Promise<void>; currentUserId: string; }

export const CommentSheet: React.FC<CommentSheetProps> = ({ isOpen, onClose, comments, isLoading = false, onAddComment, onDeleteComment, currentUserId }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try { await onAddComment(content); setContent(''); } finally { setIsSubmitting(false); }
  };
  return (
    <CommunityDialog open={isOpen} title="Comentários" onClose={onClose} footer={<form onSubmit={handleSubmit} className="comment-compose"><label className="sr-only" htmlFor="feed-comment">Seu comentário</label><input id="feed-comment" type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="Incentive essa conquista..." /><Button type="submit" disabled={!content.trim() || isSubmitting} aria-label="Enviar comentário" busy={isSubmitting}><Icon name="arrow" size={20} /></Button></form>}>
      <div className="p-5 sm:p-6 space-y-5">
        {isLoading ? <LoadingState message="Carregando comentários..." /> : comments.length === 0 ? <div className="py-12 text-center"><p className="font-semibold">Comece uma conversa</p><p className="mt-2 text-sm text-text-secondary">Seu incentivo pode fazer a diferença.</p></div> : comments.map(c => {
          const avatarUrl = c.userAvatarUrl || c.authorAvatarUrl;
          const authorName = c.userNickname || c.authorName || 'Usuário';
          const authorId = c.userId || c.authorId;
          return <div key={c.id} className="comment-item"><Avatar src={avatarUrl} name={authorName} size="sm" /><div className="comment-item__content"><div className="comment-item__meta"><strong>{authorName}</strong><time>{formatRelativeTime(c.createdAt)}</time></div><p>{c.content}</p>{authorId === currentUserId && <button type="button" onClick={() => onDeleteComment(c.id)} className="min-h-11 text-xs text-text-secondary hover:text-accent-danger" aria-label="Excluir seu comentário">Excluir comentário</button>}</div></div>;
        })}
      </div>
    </CommunityDialog>
  );
};
