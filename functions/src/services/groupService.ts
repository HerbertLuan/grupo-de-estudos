import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { Group, GroupMember } from '../types';
import { DEFAULT_TIMEZONE } from '../config/constants';
import { getCurrentMonthId, getCurrentWeekId } from '../utils/timezone';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export interface CreateGroupInput {
  name: string;
  inviteCode?: string;
  timezone?: string;
}

export async function createGroup(ownerUid: string, input: CreateGroupInput): Promise<Group> {
  const name = input.name.trim();
  if (!name || name.length < 2) {
    throw new HttpsError('invalid-argument', 'O nome do grupo deve ter pelo menos 2 caracteres.');
  }

  const inviteCode = (input.inviteCode || Math.random().toString(36).substring(2, 8)).toUpperCase().trim();
  const timezone = input.timezone || DEFAULT_TIMEZONE;

  const userRef = db.collection('users').doc(ownerUid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado.');
  }
  const userData = userSnap.data()!;

  const groupRef = db.collection('groups').doc();
  const now = admin.firestore.Timestamp.now();
  const weekId = getCurrentWeekId(new Date(), timezone);
  const monthId = getCurrentMonthId(new Date(), timezone);

  const newGroup: Group = {
    id: groupRef.id,
    name: name,
    inviteCode: inviteCode,
    timezone: timezone,
    ownerId: ownerUid,
    memberCount: 1,
    activeSeasonId: null,
    createdAt: now,
    updatedAt: now,
  };

  const memberRef = groupRef.collection('members').doc(ownerUid);
  const initialMember: GroupMember = {
    uid: ownerUid,
    groupId: groupRef.id,
    name: userData.name,
    nickname: userData.nickname,
    avatarUrl: userData.avatarUrl || null,
    role: 'admin',
    joinedAt: now,
    totalPoints: userData.totalPoints || 0,
    totalStudySeconds: userData.totalStudySeconds || 0,
    weekPoints: 0,
    weekStudySeconds: 0,
    weekId: weekId,
    monthPoints: 0,
    monthStudySeconds: 0,
    monthId: monthId,
    seasonPoints: 0,
    seasonStudySeconds: 0,
    seasonId: null,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(groupRef, newGroup);
  batch.set(memberRef, initialMember);
  batch.update(userRef, { groupId: groupRef.id, updatedAt: now });

  await batch.commit();
  return newGroup;
}

export async function joinGroupWithInviteCode(uid: string, inviteCode: string): Promise<Group> {
  const code = inviteCode.trim().toUpperCase();
  if (!code) {
    throw new HttpsError('invalid-argument', 'O código de convite é obrigatório.');
  }

  const groupQuery = await db.collection('groups').where('inviteCode', '==', code).limit(1).get();
  if (groupQuery.empty) {
    throw new HttpsError('not-found', 'Nenhum grupo encontrado com este código de convite.');
  }

  const groupDoc = groupQuery.docs[0];
  const group = groupDoc.data() as Group;
  const groupId = group.id;

  const userRef = db.collection('users').doc(uid);
  const memberRef = db.collection('groups').doc(groupId).collection('members').doc(uid);

  return await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Usuário não encontrado.');
    }
    const userData = userSnap.data()!;

    const memberSnap = await tx.get(memberRef);
    if (memberSnap.exists) {
      return group; // Já é membro
    }

    const now = admin.firestore.Timestamp.now();
    const timezone = group.timezone || DEFAULT_TIMEZONE;
    const weekId = getCurrentWeekId(new Date(), timezone);
    const monthId = getCurrentMonthId(new Date(), timezone);

    const newMember: GroupMember = {
      uid: uid,
      groupId: groupId,
      name: userData.name,
      nickname: userData.nickname,
      avatarUrl: userData.avatarUrl || null,
      role: 'member',
      joinedAt: now,
      totalPoints: userData.totalPoints || 0,
      totalStudySeconds: userData.totalStudySeconds || 0,
      weekPoints: 0,
      weekStudySeconds: 0,
      weekId: weekId,
      monthPoints: 0,
      monthStudySeconds: 0,
      monthId: monthId,
      seasonPoints: 0,
      seasonStudySeconds: 0,
      seasonId: group.activeSeasonId || null,
      updatedAt: now,
    };

    tx.set(memberRef, newMember);
    tx.update(userRef, { groupId: groupId, updatedAt: now });
    tx.update(groupDoc.ref, {
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    return group;
  });
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const membersSnap = await db
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .orderBy('totalPoints', 'desc')
    .orderBy('totalStudySeconds', 'desc')
    .get();

  if (membersSnap.empty) return [];

  const members = membersSnap.docs.map((doc) => doc.data() as GroupMember);
  const userRefs = members.map((m) => db.collection('users').doc(m.uid));
  const userDocs = userRefs.length > 0 ? await db.getAll(...userRefs) : [];
  const userMap = new Map<string, FirebaseFirestore.DocumentData>();
  userDocs.forEach((d) => {
    if (d.exists) {
      userMap.set(d.id, d.data()!);
    }
  });

  return members.map((m) => {
    const u = userMap.get(m.uid);
    return {
      ...m,
      avatarUrl: u?.avatarUrl !== undefined ? u.avatarUrl : (m.avatarUrl || null),
      name: u?.name || m.name,
      nickname: u?.nickname || m.nickname,
    };
  });
}
