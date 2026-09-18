import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { StudySession, UserProfile } from '../types';
import { getZonedDateString } from '../utils/timezone';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

function cleanName(value: unknown): string {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Informe o nome da matéria.');
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) throw new HttpsError('invalid-argument', 'O nome deve ter entre 2 e 80 caracteres.');
  return name;
}

function nameKey(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function membership(uid: string) {
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'Usuário não encontrado.');
  const user = userSnap.data() as UserProfile & { preferredSubjectIds?: string[] };
  if (!user.groupId) throw new HttpsError('failed-precondition', 'Entre em um grupo primeiro.');
  const memberSnap = await db.doc(`groups/${user.groupId}/members/${uid}`).get();
  if (!memberSnap.exists) throw new HttpsError('permission-denied', 'Você não é membro deste grupo.');
  return { user, groupId: user.groupId, isAdmin: memberSnap.data()?.role === 'admin' };
}

export async function getSubjectSetup(uid: string) {
  const { user, groupId, isAdmin } = await membership(uid);
  const groupRef = db.collection('groups').doc(groupId);
  // Configuração privada: as regras do Firestore não expõem privateSettings a outros usuários.
  const colorsRef = db.doc(`users/${uid}/privateSettings/subjectColors_${groupId}`);
  const [subjectsSnap, requestsSnap, colorsSnap] = await Promise.all([
    groupRef.collection('subjects').get(),
    groupRef.collection('subjectRequests').get(),
    colorsRef.get(),
  ]);
  return {
    subjects: subjectsSnap.docs.map(d => ({ id: d.id, name: d.data().name as string })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    requests: requestsSnap.docs.filter(d => isAdmin || d.data().requestedBy === uid).map(d => ({ id: d.id, name: d.data().name as string, status: d.data().status as string, requestedBy: d.data().requestedBy as string })),
    preferredSubjectIds: user.preferredSubjectIds || [],
    subjectColors: (colorsSnap.data()?.colors || {}) as Record<string, string>,
    isAdmin,
  };
}

export async function setSubjectColor(uid: string, rawSubjectId: unknown, rawColor: unknown) {
  const { groupId } = await membership(uid);
  if (typeof rawSubjectId !== 'string' || !rawSubjectId || rawSubjectId.includes('/') ||
      typeof rawColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(rawColor)) {
    throw new HttpsError('invalid-argument', 'Matéria ou cor inválida.');
  }
  const subjectRef = db.doc(`groups/${groupId}/subjects/${rawSubjectId}`);
  const colorsRef = db.doc(`users/${uid}/privateSettings/subjectColors_${groupId}`);
  await db.runTransaction(async tx => {
    const [subjectSnap, colorsSnap] = await Promise.all([tx.get(subjectRef), tx.get(colorsRef)]);
    if (!subjectSnap.exists) throw new HttpsError('invalid-argument', 'Selecione uma matéria do grupo.');
    tx.set(colorsRef, {
      colors: { ...(colorsSnap.data()?.colors || {}), [rawSubjectId]: rawColor.toLowerCase() },
      updatedAt: admin.firestore.Timestamp.now(),
    });
  });
  return { subjectId: rawSubjectId, color: rawColor.toLowerCase() };
}

export async function createSubject(uid: string, rawName: unknown) {
  const { groupId, isAdmin } = await membership(uid);
  if (!isAdmin) throw new HttpsError('permission-denied', 'Somente o administrador pode criar matérias.');
  const name = cleanName(rawName);
  const id = nameKey(name);
  if (!id) throw new HttpsError('invalid-argument', 'Nome de matéria inválido.');
  const ref = db.doc(`groups/${groupId}/subjects/${id}`);
  await db.runTransaction(async tx => {
    if ((await tx.get(ref)).exists) throw new HttpsError('already-exists', 'Esta matéria já existe.');
    tx.create(ref, { id, name, groupId, createdBy: uid, createdAt: admin.firestore.Timestamp.now() });
  });
  return { id, name };
}

export async function requestSubject(uid: string, rawName: unknown) {
  const { groupId } = await membership(uid);
  const name = cleanName(rawName);
  const key = nameKey(name);
  if (!key) throw new HttpsError('invalid-argument', 'Nome de matéria inválido.');
  const subjectRef = db.doc(`groups/${groupId}/subjects/${key}`);
  const requestRef = db.doc(`groups/${groupId}/subjectRequests/${key}`);
  await db.runTransaction(async tx => {
    const [subject, prior] = await Promise.all([tx.get(subjectRef), tx.get(requestRef)]);
    if (subject.exists) throw new HttpsError('already-exists', 'Esta matéria já está disponível no catálogo.');
    if (prior.exists && prior.data()?.status === 'pending') throw new HttpsError('already-exists', 'Você já enviou esta sugestão.');
    tx.set(requestRef, { id: requestRef.id, groupId, name, requestedBy: uid, status: 'pending', updatedAt: admin.firestore.Timestamp.now() });
  });
  return { id: requestRef.id };
}

export async function reviewSubject(uid: string, requestId: unknown, decision: unknown, rawName?: unknown) {
  const { groupId, isAdmin } = await membership(uid);
  if (!isAdmin) throw new HttpsError('permission-denied', 'Somente o administrador pode avaliar sugestões.');
  if (typeof requestId !== 'string' || !requestId || !['approve', 'reject'].includes(String(decision))) throw new HttpsError('invalid-argument', 'Solicitação ou decisão inválida.');
  const requestRef = db.doc(`groups/${groupId}/subjectRequests/${requestId}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(requestRef);
    if (!snap.exists || snap.data()?.status !== 'pending') throw new HttpsError('failed-precondition', 'Esta solicitação não está pendente.');
    const name = decision === 'approve' ? cleanName(rawName ?? snap.data()?.name) : null;
    const subjectId = name ? nameKey(name) : null;
    if (name && !subjectId) throw new HttpsError('invalid-argument', 'Nome de matéria inválido.');
    const subjectRef = subjectId ? db.doc(`groups/${groupId}/subjects/${subjectId}`) : null;
    const existing = subjectRef ? await tx.get(subjectRef) : null;
    if (existing?.exists) throw new HttpsError('already-exists', 'Esta matéria já existe.');
    if (subjectRef && name) tx.create(subjectRef, { id: subjectId, name, groupId, createdBy: uid, createdAt: admin.firestore.Timestamp.now() });
    tx.update(requestRef, { status: decision === 'approve' ? 'approved' : 'rejected', reviewedBy: uid, approvedSubjectId: subjectId, updatedAt: admin.firestore.Timestamp.now() });
  });
  return { success: true };
}

export async function setPreferredSubjects(uid: string, rawIds: unknown) {
  const { groupId } = await membership(uid);
  if (!Array.isArray(rawIds) || rawIds.length > 100 || rawIds.some(id => typeof id !== 'string')) throw new HttpsError('invalid-argument', 'Lista de matérias inválida.');
  const ids = [...new Set(rawIds as string[])];
  const refs = ids.map(id => db.doc(`groups/${groupId}/subjects/${id}`));
  const docs = refs.length ? await db.getAll(...refs) : [];
  if (docs.some(d => !d.exists)) throw new HttpsError('invalid-argument', 'Uma matéria não pertence ao catálogo do grupo.');
  await db.collection('users').doc(uid).update({ preferredSubjectIds: ids, updatedAt: admin.firestore.Timestamp.now() });
  return { preferredSubjectIds: ids };
}

export async function saveSubjectSetup(uid: string, rawIds: unknown, rawColors: unknown) {
  const { groupId } = await membership(uid);
  if (!Array.isArray(rawIds) || rawIds.length > 100 ||
      rawIds.some(id => typeof id !== 'string' || !id || id.includes('/'))) {
    throw new HttpsError('invalid-argument', 'Lista de matérias inválida.');
  }
  const ids = [...new Set(rawIds as string[])];
  if (!rawColors || typeof rawColors !== 'object' || Array.isArray(rawColors)) {
    throw new HttpsError('invalid-argument', 'Cores inválidas.');
  }
  const colors = rawColors as Record<string, unknown>;
  if (Object.keys(colors).length > 100 || Object.entries(colors).some(([id, color]) =>
    !ids.includes(id) || typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color))) {
    throw new HttpsError('invalid-argument', 'Cores inválidas.');
  }
  const refs = ids.map(id => db.doc(`groups/${groupId}/subjects/${id}`));
  const docs = refs.length ? await db.getAll(...refs) : [];
  if (docs.some(d => !d.exists)) throw new HttpsError('invalid-argument', 'Uma matéria não pertence ao catálogo do grupo.');

  const userRef = db.doc(`users/${uid}`);
  const colorsRef = db.doc(`users/${uid}/privateSettings/subjectColors_${groupId}`);
  const normalized = Object.fromEntries(Object.entries(colors).map(([id, color]) => [id, (color as string).toLowerCase()]));
  const subjectColors = await db.runTransaction(async tx => {
    const colorsSnap = await tx.get(colorsRef);
    const merged = { ...(colorsSnap.data()?.colors || {}), ...normalized } as Record<string, string>;
    const updatedAt = admin.firestore.Timestamp.now();
    tx.update(userRef, { preferredSubjectIds: ids, updatedAt });
    tx.set(colorsRef, { colors: merged, updatedAt });
    return merged;
  });
  return { preferredSubjectIds: ids, subjectColors };
}

export async function saveSessionDetails(uid: string, input: any) {
  const { groupId } = await membership(uid);
  const { sessionId, subjectId, didQuestions, questionCount, correctCount } = input || {};
  if (typeof sessionId !== 'string' || !sessionId || (subjectId !== null && typeof subjectId !== 'string') || typeof didQuestions !== 'boolean') throw new HttpsError('invalid-argument', 'Dados da sessão inválidos.');
  if (didQuestions && (!Number.isSafeInteger(questionCount) || questionCount < 1 || !Number.isSafeInteger(correctCount) || correctCount < 0 || correctCount > questionCount)) throw new HttpsError('invalid-argument', 'Confira o total de questões e acertos.');
  const sessionRef = db.doc(`users/${uid}/studySessions/${sessionId}`);
  const subjectRef = subjectId ? db.doc(`groups/${groupId}/subjects/${subjectId}`) : null;
  await db.runTransaction(async tx => {
    const [sessionSnap, subjectSnap] = await Promise.all([tx.get(sessionRef), subjectRef ? tx.get(subjectRef) : Promise.resolve(null)]);
    if (!sessionSnap.exists || (sessionSnap.data() as StudySession).status !== 'completed' || sessionSnap.data()?.groupId !== groupId) throw new HttpsError('failed-precondition', 'Sessão concluída não encontrada neste grupo.');
    if (subjectRef && !subjectSnap?.exists) throw new HttpsError('invalid-argument', 'Selecione uma matéria aprovada.');
    tx.update(sessionRef, { subjectId: subjectId || null, didQuestions, questionCount: didQuestions ? questionCount : 0, correctCount: didQuestions ? correctCount : 0, detailsRecorded: true, updatedAt: admin.firestore.Timestamp.now() });
  });
  return { success: true };
}

export async function getSubjectSessions(uid: string) {
  await membership(uid);
  const snap = await db.collection('users').doc(uid).collection('studySessions').where('status', '==', 'completed').get();
  return snap.docs.sort((a, b) => {
    const aSession = a.data() as StudySession;
    const bSession = b.data() as StudySession;
    return (bSession.endedAt?.toMillis() || bSession.startedAt?.toMillis() || 0) - (aSession.endedAt?.toMillis() || aSession.startedAt?.toMillis() || 0);
  }).map(d => {
    const s = d.data() as StudySession & { subjectId?: string | null; didQuestions?: boolean | null; questionCount?: number | null; correctCount?: number | null; detailsRecorded?: boolean };
    return { id: d.id, studyDate: s.studyDate, totalSeconds: s.totalSeconds, subjectId: s.subjectId ?? null, didQuestions: s.didQuestions ?? null, questionCount: s.questionCount ?? null, correctCount: s.correctCount ?? null, detailsRecorded: s.detailsRecorded ?? false };
  });
}

/** Daily totals for the two progress charts. A member may view another member of the same group. */
export async function getSubjectChartData(callerUid: string, targetUid: unknown) {
  const { groupId } = await membership(callerUid);
  if (typeof targetUid !== 'string' || !targetUid || targetUid.includes('/')) {
    throw new HttpsError('invalid-argument', 'Usuário inválido.');
  }
  const targetSnap = await db.collection('users').doc(targetUid).get();
  if (!targetSnap.exists || (targetSnap.data() as UserProfile).groupId !== groupId) {
    throw new HttpsError('permission-denied', 'O usuário não pertence ao seu grupo.');
  }
  const targetMember = await db.doc(`groups/${groupId}/members/${targetUid}`).get();
  if (!targetMember.exists) throw new HttpsError('permission-denied', 'O usuário não pertence ao seu grupo.');

  const [subjectsSnap, colorsSnap, sessionsSnap] = await Promise.all([
    db.collection('groups').doc(groupId).collection('subjects').get(),
    db.doc(`users/${targetUid}/privateSettings/subjectColors_${groupId}`).get(),
    db.collection('users').doc(targetUid).collection('studySessions').where('status', '==', 'completed').get(),
  ]);
  const colors = (colorsSnap.data()?.colors || {}) as Record<string, string>;
  const subjects = subjectsSnap.docs.map(d => ({ id: d.id, name: d.data().name as string, color: colors[d.id] || null }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const byDay = new Map<string, { date: string; subjectId: string | null; seconds: number; questions: number; correct: number }>();
  for (const doc of sessionsSnap.docs) {
    const session = doc.data() as StudySession & { subjectId?: string | null; questionCount?: number | null; correctCount?: number | null };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(session.studyDate)) continue;
    const subjectId = session.subjectId && subjects.some(s => s.id === session.subjectId) ? session.subjectId : null;
    const key = `${session.studyDate}|${subjectId || 'others'}`;
    const entry = byDay.get(key) || { date: session.studyDate, subjectId, seconds: 0, questions: 0, correct: 0 };
    entry.seconds += Math.max(0, session.totalSeconds || 0);
    const questions = Math.max(0, session.questionCount || 0);
    entry.questions += questions;
    entry.correct += Math.min(questions, Math.max(0, session.correctCount || 0));
    byDay.set(key, entry);
  }
  return { today: getZonedDateString(), subjects, days: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)) };
}
