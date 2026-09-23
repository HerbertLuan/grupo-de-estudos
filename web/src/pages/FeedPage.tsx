import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useFeed } from '../hooks/useFeed';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import { CommentSheet } from '../components/feed/CommentSheet';
import { LikesModal } from '../components/feed/LikesModal';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../components/ui/Toast';
import { getComments, getPostLikes } from '../services/feedService';
import type { FeedComment, FeedLikeUser } from '../types';
import { StudyStories } from '../components/feed/StudyStories';
import { Link } from 'react-router-dom';
import { PageHeader, Button, Card, Badge, Icon } from '../components/ui/DesignSystem';
import '../styles/social-redesign.css';

export const FeedPage: React.FC = () => {
  const { user, profile } = useAuthContext();
  const { showToast } = useToast();
  const { posts, loading, error, fetchFeed, toggleLike, addComment, deleteComment } = useFeed(profile?.groupId ?? null);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetComments, setSheetComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Estado do modal de curtidas
  const [likesPostId, setLikesPostId] = useState<string | null>(null);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesList, setLikesList] = useState<FeedLikeUser[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);

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

  const handleShowLikes = useCallback(async (postId: string) => {
    setLikesPostId(postId);
    setIsLikesOpen(true);
    setLikesList([]);
    setLikesLoading(true);
    try {
      const result = await getPostLikes(postId);
      setLikesList(result);
    } catch {
      showToast('Erro ao carregar curtidas', 'error');
    } finally {
      setLikesLoading(false);
    }
  }, [showToast]);

  const handleCloseLikes = useCallback(() => {
    setIsLikesOpen(false);
    setLikesPostId(null);
    setLikesList([]);
  }, []);

  return (
    <div className="ej-page space-y-6">
      <PageHeader eyebrow="Comunidade" title="Mais que estudos. Juntos." description="Compartilhe o caminho e celebre cada conquista do seu grupo." actions={<Button variant="secondary" onClick={fetchFeed} disabled={loading} aria-label="Atualizar feed">{loading ? 'Atualizando...' : 'Atualizar feed'}</Button>} />
      <div className="community-layout">
        <div className="community-main space-y-5">
          {profile?.groupId && user && <StudyStories key={profile.groupId} groupId={profile.groupId} uid={user.uid} />}
          <div className="social-section-title"><h2>Atividade do grupo</h2><Badge tone="neutral">Recentes</Badge></div>
          {loading ? <LoadingState message="Carregando feed..." /> : error ? <ErrorState message={error} onRetry={fetchFeed} /> : posts.length === 0 ? <EmptyState icon="📢" title="A próxima conquista começa aqui" description="As conquistas e os pontos do grupo aparecerão neste espaço. Comece uma sessão e dê o primeiro passo." /> : <div className="space-y-4">{posts.map(post => <FeedPostCard key={post.id} post={post} onLike={handleLike} onComment={handleOpenComments} onShowLikes={handleShowLikes} />)}</div>}
        </div>
        <aside className="community-aside" aria-label="Sua comunidade">
          <Card className="community-note"><Badge tone="yellow">Estuda Junto</Badge><h2>Pequenos avanços.<br />Grandes conquistas.</h2><p>Seu esforço inspira o grupo. Incentive quem está ao seu lado e continue construindo sua rotina.</p><Link className="social-link mt-4" to="/">Iniciar meus estudos <Icon name="arrow" size={16} /></Link></Card>
          {profile && <Card className="community-note"><p className="social-eyebrow">Sua presença faz a diferença</p><div className="mt-3 mb-3 text-3xl font-bold text-text-primary">{profile.currentStreak}<span className="ml-2 text-sm font-normal text-text-secondary">dias de sequência</span></div><Link to="/profile" className="social-link">Ver meu perfil <Icon name="arrow" size={16} /></Link></Card>}
        </aside>
      </div>
      <CommentSheet postId={selectedPostId || ''} isOpen={isSheetOpen} onClose={handleCloseComments} comments={commentsLoading ? [] : sheetComments} isLoading={commentsLoading} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} currentUserId={user?.uid || ''} />
      <LikesModal isOpen={isLikesOpen} onClose={handleCloseLikes} likes={likesList} isLoading={likesLoading} />
    </div>
  );
};
