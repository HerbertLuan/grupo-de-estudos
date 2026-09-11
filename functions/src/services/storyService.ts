import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { addDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { z } from 'zod';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
export const storyEmojis = ['🔥', '💪', '📚', '⚡', '🎯', '👏'] as const;
const id = z.string().min(1).max(128).regex(/^[\w-]+$/);
export function nextStoryMidnight(now: Date, timezone: string): Date {
  const next = format(addDays(toZonedTime(now, timezone), 1), 'yyyy-MM-dd');
  return fromZonedTime(`${next}T00:00:00`, timezone);
}

// Reserve an immutable upload path. Unpublished uploads also expire through the job.
export async function prepareStory(uid: string) {
  const user = (await db.doc(`users/${uid}`).get()).data();
  if (!user?.groupId || !user.activeSessionId) throw new HttpsError('failed-precondition', 'Inicie ou retome uma sessão para postar.');
  const [member, session, group] = await Promise.all([
    db.doc(`groups/${user.groupId}/members/${uid}`).get(),
    db.doc(`users/${uid}/studySessions/${user.activeSessionId}`).get(),
    db.doc(`groups/${user.groupId}`).get(),
  ]);
  if (!member.exists || !['active', 'paused'].includes(session.data()?.status)) throw new HttpsError('permission-denied', 'Sessão ou grupo indisponível.');
  const story = db.collection('studyStories').doc();
  const now = admin.firestore.Timestamp.now();
  const storagePath = `study-stories/${uid}/${user.activeSessionId}_${story.id}.jpg`;
  await story.set({ id: story.id, userId: uid, groupId: user.groupId, sessionId: user.activeSessionId,
    storagePath, photoUrl: '', published: false, createdAt: now,
    expiresAt: admin.firestore.Timestamp.fromDate(nextStoryMidnight(now.toDate(), group.data()?.timezone || 'America/Sao_Paulo')) });
  return { storyId: story.id, storagePath };
}

export async function publishStory(uid: string, input: unknown) {
  const storyId = id.parse(input);
  const ref = db.doc(`studyStories/${storyId}`);
  const initial = (await ref.get()).data();
  if (!initial || initial.userId !== uid) throw new HttpsError('permission-denied', 'Foto indisponível.');
  const file = admin.storage().bucket().file(initial.storagePath);
  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) > 5 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(metadata.contentType || '')) {
    throw new HttpsError('invalid-argument', 'Escolha uma imagem estática de até 5 MB.');
  }
  await db.runTransaction(async tx => {
    const userRef = db.doc(`users/${uid}`);
    const [snap, userSnap] = await Promise.all([tx.get(ref), tx.get(userRef)]);
    const story = snap.data(); const user = userSnap.data();
    if (!story || story.expiresAt.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'A foto expirou. Selecione novamente.');
    if (story.published) return;
    if (user?.groupId !== story.groupId || user?.activeSessionId !== story.sessionId) throw new HttpsError('failed-precondition', 'A sessão mudou. Selecione novamente.');
    const [session, member] = await Promise.all([tx.get(db.doc(`users/${uid}/studySessions/${story.sessionId}`)), tx.get(db.doc(`groups/${story.groupId}/members/${uid}`))]);
    if (!member.exists || !['active', 'paused'].includes(session.data()?.status)) throw new HttpsError('failed-precondition', 'É preciso ter uma sessão ativa ou pausada.');
    const previous = user?.activeStoryId;
    // The old generation is hidden atomically; its cleanup cannot delete the new photo/reactions.
    if (previous && previous !== storyId) tx.update(db.doc(`studyStories/${previous}`), { published: false, expiresAt: admin.firestore.Timestamp.now() });
    tx.update(ref, { published: true, createdAt: admin.firestore.Timestamp.now(), photoUrl: `gs://${file.bucket.name}/${file.name}` });
    tx.update(userRef, { activeStoryId: storyId });
  });
  await cleanupExpiredStories().catch(error => console.error('Story cleanup will retry on schedule', error));
  return { success: true };
}

export async function removeStory(uid: string, input: unknown) {
  const ref = db.doc(`studyStories/${id.parse(input)}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    if (snap.data()?.userId !== uid) throw new HttpsError('permission-denied', 'Você só pode remover sua foto.');
    tx.update(ref, { published: false, expiresAt: admin.firestore.Timestamp.now() });
  });
  await cleanupExpiredStories().catch(error => console.error('Story cleanup will retry on schedule', error));
  return { success: true };
}

export async function reactToStory(uid: string, input: unknown) {
  const data = z.object({ storyId: id, emoji: z.enum(storyEmojis).nullable() }).parse(input);
  const ref = db.doc(`studyStories/${data.storyId}`);
  await db.runTransaction(async tx => {
    const story = (await tx.get(ref)).data();
    if (!story?.published || story.expiresAt.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'Este story expirou.');
    if (story.userId === uid || !(await tx.get(db.doc(`groups/${story.groupId}/members/${uid}`))).exists) throw new HttpsError('permission-denied', 'Reação não permitida.');
    const reaction = ref.collection('reactions').doc(uid);
    if (data.emoji === null) tx.delete(reaction);
    else tx.set(reaction, { uid, emoji: data.emoji, reactedAt: admin.firestore.Timestamp.now() });
  });
  return { success: true };
}

export async function cleanupExpiredStories() {
  // Immutable story IDs make retries safe, including concurrent replacement and removal.
  const expired = await db.collection('studyStories').where('expiresAt', '<=', admin.firestore.Timestamp.now()).limit(200).get();
  for (const snap of expired.docs) {
    const data = snap.data();
    await admin.storage().bucket().file(data.storagePath).delete({ ignoreNotFound: true });
    await db.runTransaction(async tx => {
      const userRef = db.doc(`users/${data.userId}`);
      if ((await tx.get(userRef)).data()?.activeStoryId === snap.id) tx.update(userRef, { activeStoryId: null });
    });
    await db.recursiveDelete(snap.ref);
  }
}

// One-time, transaction-safe upgrade of members created before US-024.
export async function initializeStoryPresence(uid: string) {
  const user = (await db.doc(`users/${uid}`).get()).data();
  if (!user?.groupId || !(await db.doc(`groups/${user.groupId}/members/${uid}`).get()).exists) throw new HttpsError('permission-denied', 'Grupo indisponível.');
  const members = await db.collection(`groups/${user.groupId}/members`).get();
  for (const member of members.docs.filter(m => !('sessionStatus' in m.data()))) {
    await db.runTransaction(async tx => {
      const [current, profile] = await Promise.all([tx.get(member.ref), tx.get(db.doc(`users/${member.id}`))]);
      if (!current.exists || 'sessionStatus' in current.data()!) return;
      const sessionId = profile.data()?.activeSessionId;
      const session = sessionId ? (await tx.get(db.doc(`users/${member.id}/studySessions/${sessionId}`))).data() : null;
      const open = session && session.groupId === user.groupId && ['active', 'paused'].includes(session.status);
      tx.update(member.ref, { activeSessionId: open ? sessionId : null, sessionStatus: open ? session.status : null });
    });
  }
  return { success: true };
}
