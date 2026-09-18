import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getZonedDateString } from '../utils/timezone';
import { DEFAULT_TIMEZONE } from '../config/constants';
import { GroupMember } from '../types';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const id = z.string().min(1).max(128).regex(/^[^/]+$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const parsed = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
}, 'Data inválida');
export const seasonInput = z.object({ groupId: id, name: z.string().trim().min(1).max(100), startDate: date, endDate: date })
  .refine(v => v.endDate >= v.startDate, 'O fim deve ser igual ou posterior ao início.');

export function officialPodium(members: GroupMember[], seasonId: string) {
  return members.filter(m => m.seasonId === seasonId && m.seasonStudySeconds > 0)
    .sort((a, b) => b.seasonPoints - a.seasonPoints || b.seasonStudySeconds - a.seasonStudySeconds ||
      (a.joinedAt?.toMillis() || 0) - (b.joinedAt?.toMillis() || 0) || a.uid.localeCompare(b.uid))
    .slice(0, 3).map((m, i) => ({ rank: i + 1, uid: m.uid, name: m.name, nickname: m.nickname,
      avatarUrl: m.avatarUrl || null, points: m.seasonPoints, studySeconds: m.seasonStudySeconds }));
}

export async function createSeason(uid: string, input: unknown) {
  const parsed = seasonInput.safeParse(input);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Informe nome e datas válidas, com fim igual ou posterior ao início.');
  const data = parsed.data;
  const ref = db.collection('seasons').doc();
  await db.runTransaction(async tx => {
    const member = await tx.get(db.doc(`groups/${data.groupId}/members/${uid}`));
    if (member.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Somente administradores podem criar temporadas.');
    tx.create(ref, { ...data, id: ref.id, active: false, status: 'draft', podium: [], createdBy: uid, createdAt: admin.firestore.Timestamp.now() });
  });
  return { id: ref.id };
}

export async function transitionSeason(uid: string | null, seasonId: string, action: 'start' | 'close') {
  if (!id.safeParse(seasonId).success) throw new HttpsError('invalid-argument', 'Temporada inválida.');
  return db.runTransaction(async tx => {
    const ref = db.collection('seasons').doc(seasonId);
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Temporada não encontrada.');
    const season = snap.data()!;
    const groupRef = db.collection('groups').doc(season.groupId);
    const group = await tx.get(groupRef);
    if (uid) {
      const member = await tx.get(groupRef.collection('members').doc(uid));
      if (member.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Somente administradores podem gerenciar temporadas.');
    }
    const now = admin.firestore.Timestamp.now();
    const today = getZonedDateString(now.toDate(), group.data()?.timezone || DEFAULT_TIMEZONE);
    if (action === 'close' && season.status === 'closed') return { success: true };
    if (action === 'start' && season.active && group.data()?.activeSeasonId === seasonId) return { success: true };
    if (action === 'start') {
      if (!uid || season.status === 'closed' || group.data()?.activeSeasonId || today < season.startDate || today > season.endDate)
        throw new HttpsError('failed-precondition', 'Inicie dentro das datas previstas e encerre a temporada ativa primeiro.');
      const members = await tx.get(groupRef.collection('members'));
      members.docs.forEach(m => tx.update(m.ref, { seasonId, seasonPoints: 0, seasonStudySeconds: 0, updatedAt: now }));
      tx.update(ref, { active: true, status: 'active', startedAt: now });
      tx.update(groupRef, { activeSeasonId: seasonId, updatedAt: now });
    } else {
      if (!season.active || group.data()?.activeSeasonId !== seasonId)
        throw new HttpsError('failed-precondition', 'A temporada não está ativa.');
      if (!uid && today <= season.endDate) return { success: false };
      const members = await tx.get(groupRef.collection('members'));
      const postRef = db.collection('feed').doc(`season_${seasonId}`);
      const existingPost = await tx.get(postRef);
      const podium = officialPodium(members.docs.map(m => m.data() as GroupMember), seasonId);
      tx.update(ref, { active: false, status: 'closed', closedAt: now, podium });
      tx.update(groupRef, { activeSeasonId: null, updatedAt: now });
      podium.forEach(winner => {
        const badgeId = `season_${seasonId}`;
        tx.set(db.doc(`users/${winner.uid}/badges/${badgeId}`), { id: badgeId, badgeId, seasonId,
          name: `${winner.rank}º lugar • ${season.name}`, description: `Pódio oficial: ${winner.points} pontos.`,
          icon: ['🥇', '🥈', '🥉'][winner.rank - 1], unlockedAt: now });
      });
      const postId = postRef.id;
      const post = { id: postId, groupId: season.groupId,
        userId: season.createdBy || group.data()?.ownerId, userNickname: 'Temporadas', userAvatarUrl: null,
        type: 'season_closed', title: `🏆 ${season.name} encerrada!`,
        message: podium.length ? podium.map(w => `${w.rank}º: ${w.nickname} (${w.points} pontos)`).join(' • ') : 'Temporada encerrada sem participantes com estudo registrado.',
        metadata: { seasonId, podium } };
      if (existingPost.exists) {
        tx.update(postRef, post);
      } else {
        tx.create(postRef, { ...post, likeCount: 0, commentCount: 0, createdAt: now });
      }
    }
    return { success: true };
  });
}

export async function closeExpiredSeasons() {
  const active = await db.collection('seasons').where('active', '==', true).get();
  const results = await Promise.allSettled(active.docs.map(s => transitionSeason(null, s.id, 'close')));
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length) throw new Error(`Falha ao encerrar ${failures.length} temporadas: ${JSON.stringify(failures)}`);
}
