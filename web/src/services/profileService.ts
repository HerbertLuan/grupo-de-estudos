import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { UserProfile } from '../types';

/**
 * Obtém os dados de perfil de um usuário diretamente do Cloud Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      throw new Error(`Perfil do usuário com UID ${uid} não foi encontrado.`);
    }

    return {
      ...(snap.data() as UserProfile),
      uid: snap.id,
    };
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar perfil do usuário.';
    console.error('Erro em getUserProfile:', error);
    throw new Error(message);
  }
}

/**
 * Escuta em tempo real as atualizações de perfil do usuário.
 */
export function subscribeToProfile(
  uid: string,
  callback: (profile: UserProfile) => void
): Unsubscribe {
  const userDocRef = doc(db, 'users', uid);

  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        callback({
          ...(snap.data() as UserProfile),
          uid: snap.id,
        });
      }
    },
    (error) => {
      console.error('Erro no listener de perfil (subscribeToProfile):', error);
    }
  );
}

/**
 * Atualiza campos específicos do perfil do usuário no Firestore (nome e/ou avatarUrl),
 * definindo automaticamente `updatedAt` com o carimbo de data/hora do servidor.
 */
export async function updateProfile(
  uid: string,
  data: { name?: string; avatarUrl?: string }
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);

    const updatePayload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (data.name !== undefined) {
      updatePayload.name = data.name.trim();
    }
    if (data.avatarUrl !== undefined) {
      updatePayload.avatarUrl = data.avatarUrl;
    }

    await updateDoc(userDocRef, updatePayload);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar perfil do usuário.';
    console.error('Erro em updateProfile:', error);
    throw new Error(message);
  }
}

/**
 * Faz upload do arquivo de imagem do avatar do usuário para o Firebase Storage
 * no caminho 'avatars/{uid}/{filename}' e retorna a URL de download pública.
 */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  try {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `avatars/${uid}/${filename}`);

    const metadata = {
      contentType: file.type,
    };

    await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    const message = error?.message || 'Erro ao fazer upload do avatar.';
    console.error('Erro em uploadAvatar:', error);
    throw new Error(message);
  }
}
