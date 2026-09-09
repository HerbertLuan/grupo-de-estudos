import React from 'react';
import { FeedPost } from '../../types';
import { formatRelativeTime } from '../../utils/formatTime';

interface FeedPostCardProps {
  post: FeedPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShowLikes?: (postId: string) => void;
  isLikeLoading?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  point_earned: '🎯',
  badge_unlocked: '🏅',
  streak_milestone: '🔥',
  hours_milestone: '⏳',
  manual_post: '📝'
};

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  onLike,
  onComment,
  onShowLikes,
  isLikeLoading,
}) => {
  const icon = TYPE_ICONS[post.type] || '📌';

  // Compatibilidade defensiva com campos legados (authorAvatarUrl, authorName)
  const avatarUrl = post.userAvatarUrl || post.authorAvatarUrl;
  const displayName = post.userNickname || post.authorName || post.authorNickname || 'Usuário';
  const likeCount = post.likesCount ?? post.likeCount ?? 0;
  const commentCount = post.commentsCount ?? post.commentCount ?? 0;

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-text-primary text-sm">{displayName}</div>
            <div className="text-xs text-text-secondary">
              {formatRelativeTime(post.createdAt)} • @{post.userNickname || post.authorNickname || displayName}
            </div>
          </div>
        </div>
        <div className="text-2xl bg-bg-tertiary w-8 h-8 flex items-center justify-center rounded-full">
          {icon}
        </div>
      </div>

      <div className="mb-4">
        {post.title && <h4 className="font-bold text-text-primary mb-1">{post.title}</h4>}
        <p className="text-text-secondary text-sm">{post.content || post.message}</p>
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1">
          {/* Botão do coração: alterna curtida */}
          <button
            onClick={() => onLike(post.id)}
            disabled={isLikeLoading}
            aria-label={post.isLikedByMe ? 'Descurtir' : 'Curtir'}
            className={`flex items-center justify-center transition-colors disabled:opacity-50 ${
              post.isLikedByMe ? 'text-accent-danger' : 'text-text-secondary hover:text-accent-danger'
            }`}
          >
            <span>{post.isLikedByMe ? '❤️' : '🤍'}</span>
          </button>
          {/* Contador de curtidas: abre modal de quem curtiu */}
          <button
            onClick={() => onShowLikes?.(post.id)}
            disabled={likeCount === 0}
            aria-label="Ver quem curtiu"
            className="text-sm text-text-secondary hover:text-accent-primary transition-colors disabled:cursor-default px-1"
          >
            {likeCount}
          </button>
        </div>

        <button
          onClick={() => onComment(post.id)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>💬</span>
          <span>{commentCount}</span>
        </button>
      </div>
    </div>
  );
};
