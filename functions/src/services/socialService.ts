import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { FeedComment, FeedLikeUser, FeedPost, UserProfile } from '../types';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Alterna a curtida do usuário em uma postagem do feed:
 * Garante atomicidade e que cada usuário só pode curtir uma única vez.
 */
export async function toggleLikePost(uid: string, postId: string): Promise<{ liked: boolean; likeCount: number }> {
  const postRef = db.collection('feed').doc(postId);
  const likeRef = postRef.collection('likes').doc(uid);

  return await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists) {
      throw new HttpsError('not-found', 'Postagem não encontrada.');
    }

    const likeSnap = await tx.get(likeRef);
    const postData = postSnap.data() as FeedPost;
    let currentLikeCount = postData.likeCount || 0;

    if (likeSnap.exists) {
      // Remove curtida
      tx.delete(likeRef);
      const newCount = Math.max(0, currentLikeCount - 1);
      tx.update(postRef, { likeCount: newCount });
      return { liked: false, likeCount: newCount };
    } else {
      // Adiciona curtida
      const now = admin.firestore.Timestamp.now();
      tx.set(likeRef, {
        uid,
        createdAt: now,
      });
      const newCount = currentLikeCount + 1;
      tx.update(postRef, { likeCount: newCount });
      return { liked: true, likeCount: newCount };
    }
  });
}

/**
 * Adiciona um comentário a uma postagem do feed
 */
export async function addComment(uid: string, postId: string, content: string): Promise<FeedComment> {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new HttpsError('invalid-argument', 'O comentário deve conter entre 1 e 500 caracteres.');
  }

  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado.');
  }
  const userData = userSnap.data() as UserProfile;

  const postRef = db.collection('feed').doc(postId);
  const commentRef = postRef.collection('comments').doc();
  const now = admin.firestore.Timestamp.now();

  const comment: FeedComment = {
    id: commentRef.id,
    postId,
    userId: uid,
    userNickname: userData.nickname,
    userAvatarUrl: userData.avatarUrl || null,
    content: trimmed,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(commentRef, comment);
  batch.update(postRef, {
    commentCount: admin.firestore.FieldValue.increment(1),
  });

  await batch.commit();
  return comment;
}

/**
 * Remove um comentário (apenas o autor tem permissão)
 */
export async function deleteComment(uid: string, postId: string, commentId: string): Promise<void> {
  const postRef = db.collection('feed').doc(postId);
  const commentRef = postRef.collection('comments').doc(commentId);

  const commentSnap = await commentRef.get();
  if (!commentSnap.exists) {
    throw new HttpsError('not-found', 'Comentário não encontrado.');
  }
  const comment = commentSnap.data() as FeedComment;

  if (comment.userId !== uid) {
    throw new HttpsError('permission-denied', 'Você só pode excluir seus próprios comentários.');
  }

  const batch = db.batch();
  batch.delete(commentRef);
  batch.update(postRef, {
    commentCount: admin.firestore.FieldValue.increment(-1),
  });

  await batch.commit();
}

/**
 * Lista o feed social de um grupo, com flag isLikedByMe se uid fornecido
 */
export async function getGroupFeed(
  groupId: string,
  limit: number = 20,
  uid?: string
): Promise<FeedPost[]> {
  const feedSnap = await db
    .collection('feed')
    .where('groupId', '==', groupId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  if (!uid) {
    return feedSnap.docs.map((d) => d.data() as FeedPost);
  }

  // Verifica isLikedByMe em paralelo para todos os posts
  const posts = await Promise.all(
    feedSnap.docs.map(async (d) => {
      const post = d.data() as FeedPost;
      const likeSnap = await db
        .collection('feed')
        .doc(post.id)
        .collection('likes')
        .doc(uid)
        .get();
      return { ...post, isLikedByMe: likeSnap.exists };
    })
  );

  return posts;
}

/**
 * Lista comentários de um post
 */
export async function getPostComments(postId: string): Promise<FeedComment[]> {
  const commentsSnap = await db
    .collection('feed')
    .doc(postId)
    .collection('comments')
    .orderBy('createdAt', 'asc')
    .get();

  return commentsSnap.docs.map((d) => d.data() as FeedComment);
}

/**
 * Retorna a lista de usuários que curtiram um post
 */
export async function getPostLikes(postId: string): Promise<FeedLikeUser[]> {
  const likesSnap = await db
    .collection('feed')
    .doc(postId)
    .collection('likes')
    .get();

  if (likesSnap.empty) return [];

  // Busca dados dos usuários em batch
  const uids = likesSnap.docs.map((d) => d.data().uid as string).filter(Boolean);

  if (uids.length === 0) return [];

  const userRefs = uids.map((uid) => db.collection('users').doc(uid));
  const userSnaps = await db.getAll(...userRefs);

  const result: FeedLikeUser[] = [];
  for (const snap of userSnaps) {
    if (!snap.exists) continue;
    const data = snap.data() as UserProfile;
    result.push({
      uid: data.uid,
      name: data.name,
      nickname: data.nickname,
      avatarUrl: data.avatarUrl || null,
    });
  }

  return result;
}
