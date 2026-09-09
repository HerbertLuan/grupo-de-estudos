import { useState, useCallback } from 'react';
import * as feedService from '../services/feedService';
import type { FeedPost, FeedComment } from '../types';

export function useFeed(groupId: string | null) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await feedService.getGroupFeed(groupId);
      setPosts(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching feed');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const toggleLike = useCallback(async (postId: string) => {
    const result = await feedService.toggleLike(postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likeCount: result.likeCount } : p))
    );
    return result;
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    const comment = await feedService.addComment(postId, content);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
    );
    return comment;
  }, []);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    await feedService.deleteComment(postId, commentId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
      )
    );
  }, []);

  const getComments = useCallback(async (postId: string): Promise<FeedComment[]> => {
    return await feedService.getComments(postId);
  }, []);

  return { posts, loading, error, fetchFeed, toggleLike, addComment, deleteComment, getComments };
}
