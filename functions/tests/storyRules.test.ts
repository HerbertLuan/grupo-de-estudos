import * as admin from 'firebase-admin';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeApp, deleteApp, type FirebaseApp } from '../../web/node_modules/firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from '../../web/node_modules/firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from '../../web/node_modules/firebase/firestore';
import { connectStorageEmulator, getBytes, getStorage, ref, uploadBytes } from '../../web/node_modules/firebase/storage';
import { prepareStory, publishStory } from '../src/services/storyService';
import { startStudySession } from '../src/services/timerService';

describe.skipIf(!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST)('Stories — regras com clientes autenticados', () => {
  const apps: FirebaseApp[] = [];
  afterEach(async () => { await Promise.all(apps.splice(0).map(deleteApp)); });
  async function client() {
    const config = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
    const app = initializeApp({ projectId: config.projectId, apiKey: 'demo-key', storageBucket: config.storageBucket }, `rules-${Date.now()}-${Math.random()}`); apps.push(app);
    const auth = getAuth(app); connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    const uid = (await signInAnonymously(auth)).user.uid;
    const db = getFirestore(app); const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(':'); connectFirestoreEmulator(db, host, Number(port));
    const storage = getStorage(app); const [sh, sp] = process.env.FIREBASE_STORAGE_EMULATOR_HOST!.split(':'); connectStorageEmulator(storage, sh, Number(sp));
    return { uid, db, storage };
  }
  it('aceita upload reservado e leitura do grupo; bloqueia intruso, sobrescrita e escrita direta', async () => {
    const owner = await client(); const outsider = await client();
    const db = admin.firestore(); const groupId = `rules-${owner.uid}`;
    await db.doc(`groups/${groupId}`).set({ timezone: 'America/Sao_Paulo' });
    await db.doc(`groups/${groupId}/members/${owner.uid}`).set({ uid: owner.uid });
    await db.doc(`users/${owner.uid}`).set({ groupId, activeSessionId: null });
    await startStudySession(owner.uid);
    const upload = await prepareStory(owner.uid);
    const bytes = new Uint8Array([255, 216, 255, 217]);
    const metadata = { contentType: 'image/jpeg', customMetadata: { storyId: upload.storyId } };
    await expect(uploadBytes(ref(outsider.storage, upload.storagePath), bytes, metadata)).rejects.toMatchObject({ code: 'storage/unauthorized' });
    await expect(uploadBytes(ref(owner.storage, `study-stories/${owner.uid}/unreserved.jpg`), bytes, metadata)).rejects.toMatchObject({ code: 'storage/unauthorized' });
    await uploadBytes(ref(owner.storage, upload.storagePath), bytes, metadata);
    await expect(uploadBytes(ref(owner.storage, upload.storagePath), bytes, metadata)).rejects.toMatchObject({ code: 'storage/unauthorized' });
    await publishStory(owner.uid, upload.storyId);
    expect((await getBytes(ref(owner.storage, upload.storagePath))).byteLength).toBe(4);
    await expect(getBytes(ref(outsider.storage, upload.storagePath))).rejects.toMatchObject({ code: 'storage/unauthorized' });
    expect((await getDoc(doc(owner.db, 'studyStories', upload.storyId))).exists()).toBe(true);
    await expect(getDoc(doc(outsider.db, 'studyStories', upload.storyId))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(getDoc(doc(outsider.db, 'groups', groupId, 'members', owner.uid))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(setDoc(doc(owner.db, 'studyStories', upload.storyId, 'reactions', owner.uid), { emoji: '🔥' })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(setDoc(doc(owner.db, 'studyStories', upload.storyId), { published: true })).rejects.toMatchObject({ code: 'permission-denied' });
    await db.doc(`studyStories/${upload.storyId}`).update({ expiresAt: admin.firestore.Timestamp.fromMillis(1) });
    await expect(getBytes(ref(owner.storage, upload.storagePath))).rejects.toMatchObject({ code: 'storage/unauthorized' });
  }, 30000);
});
