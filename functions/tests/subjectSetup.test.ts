import * as admin from 'firebase-admin';
import { beforeEach, describe, expect, it } from 'vitest';
import { getSubjectSetup, saveSubjectSetup } from '../src/services/subjectService';

// These tests use only the local Firestore emulator.
describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('Configuração pessoal de matérias', () => {
  if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-subject-setup' });
  const db = admin.firestore();
  let groupId: string;
  let uid: string;

  beforeEach(async () => {
    groupId = db.collection('groups').doc().id;
    uid = `user_${groupId}`;
    await db.doc(`users/${uid}`).set({ groupId, preferredSubjectIds: [] });
    await db.doc(`groups/${groupId}/members/${uid}`).set({ role: 'member' });
    await db.doc(`groups/${groupId}/subjects/math`).set({ name: 'Matemática' });
    await db.doc(`groups/${groupId}/subjects/history`).set({ name: 'História' });
  });

  it('salva seleção e cores juntas e permite remover sem apagar o catálogo', async () => {
    await expect(saveSubjectSetup(uid, ['math', 'history'], { math: '#AABBCC' })).resolves.toMatchObject({
      preferredSubjectIds: ['math', 'history'], subjectColors: { math: '#aabbcc' },
    });
    const saved = await getSubjectSetup(uid);
    expect(saved.preferredSubjectIds).toEqual(['math', 'history']);
    expect(saved.subjectColors.math).toBe('#aabbcc');

    await saveSubjectSetup(uid, ['history'], {});
    expect((await getSubjectSetup(uid)).preferredSubjectIds).toEqual(['history']);
    expect((await db.doc(`groups/${groupId}/subjects/math`).get()).exists).toBe(true);
  });

  it('rejeita cores inválidas ou matéria de outro grupo sem alterar a configuração', async () => {
    await saveSubjectSetup(uid, ['math'], { math: '#112233' });
    await expect(saveSubjectSetup(uid, ['history'], { history: 'red' })).rejects.toMatchObject({ code: 'invalid-argument' });
    await expect(saveSubjectSetup(uid, ['missing'], {})).rejects.toMatchObject({ code: 'invalid-argument' });
    const saved = await getSubjectSetup(uid);
    expect(saved.preferredSubjectIds).toEqual(['math']);
    expect(saved.subjectColors.math).toBe('#112233');
  });
});
