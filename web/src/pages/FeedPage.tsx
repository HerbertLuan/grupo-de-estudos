import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useFeed } from '../hooks/useFeed';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import { CommentSheet } from '../components/feed/CommentSheet';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../components/ui/Toast';
import { getComments } from '../services/feedService';
import type { FeedComment } from '../types';

export const FeedPage: React.FC = () => {
  const { user, profile } = useAuthContext();
  const { showToast } = useToast();
  const { posts, loading, error, fetchFeed, toggleLike, addComment, deleteComment } = useFeed(profile?.groupId ?? null);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetComments, setSheetComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleOpenComments = useCallback(async (postId: string) => {
    setSelectedPostId(postId);
    setIsSheetOpen(true);
    setCommentsLoading(true);
    try {
      const comments = await getComments(postId);
      setSheetComments(comments);
    } catch {
      showToast('Erro ao carregar comentários', 'error');
    } finally {
      setCommentsLoading(false);
    }
  }, [showToast]);

  const handleCloseComments = useCallback(() => {
    setIsSheetOpen(false);
    setSelectedPostId(null);
    setSheetComments([]);
  }, []);

  const handleAddComment = useCallback(async (content: string) => {
    if (!selectedPostId) return;
    const comment = await addComment(selectedPostId, content);
    setSheetComments(prev => [...prev, comment]);
  }, [selectedPostId, addComment]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!selectedPostId) return;
    await deleteComment(selectedPostId, commentId);
    setSheetComments(prev => prev.filter(c => c.id !== commentId));
  }, [selectedPostId, deleteComment]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      await toggleLike(postId);
    } catch {
      showToast('Erro ao curtir', 'error');
    }
  }, [toggleLike, showToast]);

  return (
    <div className="pb-28 max-w-2xl mx-auto w-full min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-6 mb-2">
        <h1 className="text-2xl font-bold text-text-primary">Feed 📢</h1>
        <button
          onClick={fetchFeed}
          disabled={loading}
          className="text-sm text-accent-primary hover:text-accent-primary-hover font-medium disabled:opacity-50"
          aria-label="Atualizar feed"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingState message="Carregando feed..." />
        </div>
      ) : error ? (
        <div className="px-4">
          <ErrorState message={error} onRetry={fetchFeed} />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-4">
          <EmptyState
            icon="📢"
            title="Nenhuma atividade ainda"
            description="As conquistas e pontos do grupo aparecerão aqui."
          />
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {posts.map(post => (
            <FeedPostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleOpenComments}
            />
          ))}
        </div>
      )}

      {/* Comments bottom sheet */}
      <CommentSheet
        postId={selectedPostId || ''}
        isOpen={isSheetOpen}
        onClose={handleCloseComments}
        comments={commentsLoading ? [] : sheetComments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        currentUserId={user?.uid || ''}
      />
    </div>
  );
};
