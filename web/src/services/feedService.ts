import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { FeedComment, FeedPost } from '../types';

/**
 * Obtém as publicações do feed social de um grupo específico.
 */
export async function getGroupFeed(
  groupId: string,
  limit?: number
): Promise<FeedPost[]> {
  try {
    const fn = httpsCallable<
      { groupId: string; limit?: number },
      FeedPost[]
    >(functions, 'get_group_feed');

    const payload: { groupId: string; limit?: number } = { groupId };
    if (limit !== undefined) payload.limit = limit;

    const result = await fn(payload);
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar o feed do grupo.';
    console.error('Erro em getGroupFeed:', error);
    throw new Error(message);
  }
}

/**
 * Alterna a curtida (like/unlike) do usuário logado em uma publicação do feed.
 */
export async function toggleLike(
  postId: string
): Promise<{ liked: boolean; likeCount: number }> {
  try {
    const fn = httpsCallable<
      { postId: string },
      { liked: boolean; likeCount: number }
    >(functions, 'toggle_like_post');

    const result = await fn({ postId });
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao curtir/descurtir postagem.';
    console.error('Erro em toggleLike:', error);
    throw new Error(message);
  }
}

/**
 * Adiciona um novo comentário a uma publicação existente no feed.
 */
export async function addComment(
  postId: string,
  content: string
): Promise<FeedComment> {
  try {
    const fn = httpsCallable<
      { postId: string; content: string },
      FeedComment
    >(functions, 'add_comment');

    const result = await fn({ postId, content: content.trim() });
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao adicionar comentário.';
    console.error('Erro em addComment:', error);
    throw new Error(message);
  }
}

/**
 * Exclui um comentário previamente publicado pelo autor na postagem.
 */
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<{ success: boolean }> {
  try {
    const fn = httpsCallable<
      { postId: string; commentId: string },
      { success: boolean }
    >(functions, 'delete_comment');

    const result = await fn({ postId, commentId });
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao excluir comentário.';
    console.error('Erro em deleteComment:', error);
    throw new Error(message);
  }
}

/**
 * Obtém todos os comentários associados a uma publicação específica.
 */
export async function getComments(postId: string): Promise<FeedComment[]> {
  try {
    const fn = httpsCallable<{ postId: string }, FeedComment[]>(
      functions,
      'get_post_comments'
    );

    const result = await fn({ postId });
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar comentários.';
    console.error('Erro em getComments:', error);
    throw new Error(message);
  }
}
