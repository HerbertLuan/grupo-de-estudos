import React from 'react';
import { FeedPost } from '../../types';
import { formatRelativeTime } from '../../utils/formatTime';

interface FeedPostCardProps {
  post: FeedPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  isLikeLoading?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  point_earned: '🎯',
  badge_unlocked: '🏅',
  streak_milestone: '🔥',
  hours_milestone: '⏳',
  manual_post: '📝'
};

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, onLike, onComment, isLikeLoading }) => {
  const icon = TYPE_ICONS[post.type] || '📌';

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bg-tertiary overflow-hidden flex items-center justify-center">
            {post.authorAvatarUrl ? (
              <img src={post.authorAvatarUrl} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-text-primary text-sm">{post.authorName || post.userNickname}</div>
            <div className="text-xs text-text-secondary">
              {formatRelativeTime(post.createdAt)} • @{post.authorNickname || post.userNickname}
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
        <button 
          onClick={() => onLike(post.id)}
          disabled={isLikeLoading}
          className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLikedByMe ? 'text-accent-danger' : 'text-text-secondary hover:text-accent-danger'}`}
        >
          <span>{post.isLikedByMe ? '❤️' : '🤍'}</span>
          <span>{post.likesCount ?? post.likeCount ?? 0}</span>
        </button>
        <button 
          onClick={() => onComment(post.id)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>💬</span>
          <span>{post.commentsCount ?? post.commentCount ?? 0}</span>
        </button>
      </div>
    </div>
  );
};
