import React from 'react';
import { FeedPost } from '../../types';
import { formatRelativeTime } from '../../utils/formatTime';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/DesignSystem';
import '../../styles/social-redesign.css';

interface FeedPostCardProps { post: FeedPost; onLike: (postId: string) => void; onComment: (postId: string) => void; onShowLikes?: (postId: string) => void; isLikeLoading?: boolean; }
const TYPE_LABELS: Record<string, string> = { season_closed: 'Temporada', point_earned: 'Ponto conquistado', badge_unlocked: 'Conquista', streak_milestone: 'Consistência', hours_milestone: 'Evolução', manual_post: 'Comunidade' };

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, onLike, onComment, onShowLikes, isLikeLoading }) => {
  const avatarUrl = post.userAvatarUrl || post.authorAvatarUrl;
  const displayName = post.userNickname || post.authorName || post.authorNickname || 'Usuário';
  const likeCount = post.likesCount ?? post.likeCount ?? 0;
  const commentCount = post.commentsCount ?? post.commentCount ?? 0;
  return (
    <article className="feed-post">
      <div className="feed-post__header">
        <div className="feed-post__author"><Avatar src={avatarUrl} name={displayName} /><div className="min-w-0"><h3>{displayName}</h3><p>@{post.userNickname || post.authorNickname || displayName} · {formatRelativeTime(post.createdAt)}</p></div></div>
      </div>
      <div className="mt-4"><Badge tone={post.type === 'season_closed' || post.type === 'badge_unlocked' ? 'yellow' : 'blue'}>{TYPE_LABELS[post.type] || 'Atividade'}</Badge></div>
      <div className="feed-post__content">{post.title && <h4>{post.title}</h4>}<p>{post.content || post.message}</p></div>
      <div className="feed-post__footer">
        <div className="flex items-center">
          <button type="button" onClick={() => onLike(post.id)} disabled={isLikeLoading} aria-pressed={Boolean(post.isLikedByMe)} aria-label={post.isLikedByMe ? 'Descurtir' : 'Curtir'}><svg width="20" height="20" viewBox="0 0 24 24" fill={post.isLikedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg></button>
          <button type="button" onClick={() => onShowLikes?.(post.id)} disabled={likeCount === 0} aria-label={`Ver ${likeCount} curtidas`}>{likeCount} <span className="hidden sm:inline">curtidas</span></button>
        </div>
        <button type="button" onClick={() => onComment(post.id)} aria-label={`Ver ${commentCount} comentários`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z" /></svg>{commentCount} <span className="hidden sm:inline">comentários</span></button>
      </div>
    </article>
  );
};
