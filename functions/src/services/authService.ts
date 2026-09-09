import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { UserProfile } from '../types';
import { DEFAULT_LEVELS } from '../config/constants';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();

export interface RegisterUserInput {
  name: string;
  nickname: string;
  password: string;
}

export interface RegisterUserResult {
  uid: string;
  name: string;
  nickname: string;
  token?: string;
}

/**
 * Registra um novo usuário de forma atômica e resiliente:
 * 1. Valida nome, apelido e senha
 * 2. Verifica a disponibilidade do apelido no Firestore e limpa eventuais resíduos órfãos no Auth
 * 3. Cria a conta no Firebase Authentication
 * 4. Cria os documentos de apelido e perfil no Firestore (com rollback seguro em caso de falha)
 * 5. Tenta gerar token customizado (sem quebrar caso IAM não tenha permissão)
 */
export async function registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
  const name = input.name.trim();
  const nickname = input.nickname.trim();
  const password = input.password;

  if (!name || name.length < 2) {
    throw new HttpsError('invalid-argument', 'O nome deve ter pelo menos 2 caracteres.');
  }

  if (!nickname || nickname.length < 3 || nickname.length > 20) {
    throw new HttpsError('invalid-argument', 'O apelido deve ter entre 3 e 20 caracteres.');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
    throw new HttpsError('invalid-argument', 'O apelido deve conter apenas letras, números e underline.');
  }

  if (!password || password.length < 6) {
    throw new HttpsError('invalid-argument', 'A senha deve conter no mínimo 6 caracteres.');
  }

  const nicknameLower = nickname.toLowerCase();
  const nicknameRef = db.collection('nicknames').doc(nicknameLower);

  // Email interno determinístico para o Firebase Authentication
  const internalEmail = `${nicknameLower}@estudos.internal`;

  // 1. Verifica no Firestore se o apelido já pertence a um usuário ativo
  const existingNickSnap = await nicknameRef.get();
  if (existingNickSnap.exists) {
    throw new HttpsError('already-exists', 'Este apelido já está em uso por outro participante.');
  }

  // 2. Verifica se há usuário no Auth com este e-mail interno
  try {
    const existingAuthUser = await auth.getUserByEmail(internalEmail);
    if (existingAuthUser) {
      // Se existir perfil no Firestore para este UID, o apelido realmente está ocupado
      const userDoc = await db.collection('users').doc(existingAuthUser.uid).get();
      if (userDoc.exists) {
        throw new HttpsError('already-exists', 'Este apelido já está em uso.');
      }
      // Se não houver documento no Firestore nem em nicknames, trata-se de resíduo de tentativa anterior
      console.log(`Limpando conta órfã no Auth para e-mail: ${internalEmail}`);
      await auth.deleteUser(existingAuthUser.uid);
    }
  } catch (err: any) {
    if (err.code !== 'auth/user-not-found') {
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', `Falha ao validar credenciais: ${err.message}`);
    }
  }

  // 3. Cria o usuário no Firebase Auth
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: internalEmail,
      password: password,
      displayName: name,
    });
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Este apelido já está em uso.');
    }
    throw new HttpsError('internal', `Falha ao criar credenciais de autenticação: ${err.message}`);
  }

  const uid = userRecord.uid;
  const now = admin.firestore.Timestamp.now();
  const userRef = db.collection('users').doc(uid);

  const initialProfile: UserProfile = {
    uid: uid,
    name: name,
    nickname: nickname,
    avatarUrl: null,
    groupId: null,
    active: true,
    activeSessionId: null,
    totalPoints: 0,
    totalStudySeconds: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    levelId: DEFAULT_LEVELS[0].id,
    createdAt: now,
    updatedAt: now,
  };

  // 4. Grava no Firestore atomicamente (com rollback do Auth em caso de erro)
  try {
    await db.runTransaction(async (tx) => {
      const nickSnap = await tx.get(nicknameRef);
      if (nickSnap.exists) {
        throw new HttpsError('already-exists', 'Este apelido já está em uso por outro participante.');
      }

      tx.set(nicknameRef, {
        uid: uid,
        nickname: nickname,
        createdAt: now,
      });

      tx.set(userRef, initialProfile);
    });
  } catch (err) {
    // Rollback: se falhar a gravação no Firestore, removemos a conta do Auth para não deixar órfão
    console.error('Erro ao salvar no Firestore. Executando rollback no Auth:', err);
    try {
      await auth.deleteUser(uid);
    } catch (delErr) {
      console.error('Falha no rollback do usuário no Auth:', delErr);
    }
    throw err;
  }

  // 5. Gera token customizado de forma segura (não-bloqueante se GCP IAM não tiver signBlob)
  let customToken = '';
  try {
    customToken = await auth.createCustomToken(uid);
  } catch (tokenErr) {
    console.warn('Não foi possível gerar custom token (o cliente usará login direto com senha):', tokenErr);
  }

  return {
    uid: uid,
    name: name,
    nickname: nickname,
    token: customToken,
  };
}

/**
 * Garante a existência do perfil de usuário em `users/{uid}`.
 * Útil para recuperar contas criadas no Auth que ficaram órfãs sem documento no Firestore.
 */
export async function ensureUserProfile(uid: string): Promise<UserProfile> {
  if (!uid) {
    throw new HttpsError('invalid-argument', 'O UID do usuário é obrigatório.');
  }

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    return userSnap.data() as UserProfile;
  }

  // Busca dados no Firebase Auth para reconstituir o perfil
  let authUser;
  try {
    authUser = await auth.getUser(uid);
  } catch (err: any) {
    throw new HttpsError('not-found', 'Usuário não encontrado no Firebase Authentication.');
  }

  const email = authUser.email || '';
  // Deriva o apelido a partir do internalEmail (ex: apelido@estudos.internal)
  let nickname = email.split('@')[0];
  if (!nickname || nickname.length < 3) {
    nickname = `user_${uid.substring(0, 5)}`;
  }
  const nicknameLower = nickname.toLowerCase();
  const displayName = authUser.displayName || nickname;

  const now = admin.firestore.Timestamp.now();
  const profile: UserProfile = {
    uid: uid,
    name: displayName,
    nickname: nickname,
    avatarUrl: authUser.photoURL || null,
    groupId: null,
    active: true,
    activeSessionId: null,
    totalPoints: 0,
    totalStudySeconds: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    levelId: DEFAULT_LEVELS[0].id,
    createdAt: now,
    updatedAt: now,
  };

  const nicknameRef = db.collection('nicknames').doc(nicknameLower);

  await db.runTransaction(async (tx) => {
    const nickSnap = await tx.get(nicknameRef);
    if (!nickSnap.exists) {
      tx.set(nicknameRef, {
        uid: uid,
        nickname: nickname,
        createdAt: now,
      });
    }
    tx.set(userRef, profile);
  });

  return profile;
}
