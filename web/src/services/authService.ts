import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
  type Unsubscribe,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase/config';
import type { RegisterUserResult } from '../types';

/**
 * Registra um novo usuário via Cloud Function 'register_user'
 * e realiza o login automático utilizando custom token ou credenciais com fallback direto.
 */
export async function registerUser(
  name: string,
  nickname: string,
  password: string
): Promise<RegisterUserResult> {
  try {
    const cleanNickname = nickname.trim().toLowerCase();
    const registerFn = httpsCallable<
      { name: string; nickname: string; password: string },
      RegisterUserResult
    >(functions, 'register_user');

    const result = await registerFn({
      name: name.trim(),
      nickname: cleanNickname,
      password,
    });

    const data = result.data;
    const formattedEmail = `${cleanNickname}@estudos.internal`;
    let authenticated = false;

    // Login com o custom token gerado pela function (se disponível)
    if (data?.token) {
      try {
        await signInWithCustomToken(auth, data.token);
        authenticated = true;
      } catch (tokenErr) {
        console.warn('signInWithCustomToken falhou, utilizando login com credenciais:', tokenErr);
      }
    }

    // Fallback: login direto com email interno e senha
    if (!authenticated) {
      await signInWithEmailAndPassword(auth, formattedEmail, password);
    }

    return data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao cadastrar usuário.';
    console.error('Erro em registerUser:', error);
    throw new Error(message);
  }
}

/**
 * Garante que o documento de perfil do usuário exista no Firestore.
 */
export async function ensureUserProfile(): Promise<void> {
  try {
    const ensureFn = httpsCallable(functions, 'ensure_user_profile');
    await ensureFn();
  } catch (error) {
    console.error('Erro ao assegurar perfil do usuário:', error);
    throw error;
  }
}

/**
 * Realiza login utilizando o apelido único e senha do usuário.
 * Mapeia o apelido para o formato de email interno `${nickname.toLowerCase().trim()}@estudos.internal`.
 */
export async function loginUser(
  nickname: string,
  password: string
): Promise<UserCredential> {
  try {
    const formattedEmail = `${nickname.toLowerCase().trim()}@estudos.internal`;
    return await signInWithEmailAndPassword(auth, formattedEmail, password);
  } catch (error: any) {
    const message = error?.message || 'Erro ao realizar login.';
    console.error('Erro em loginUser:', error);
    throw new Error(message);
  }
}

/**
 * Desconecta o usuário atualmente autenticado da aplicação.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    const message = error?.message || 'Erro ao desconectar usuário.';
    console.error('Erro em logoutUser:', error);
    throw new Error(message);
  }
}

/**
 * Inscreve um ouvinte para alterações no estado de autenticação do Firebase.
 */
export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export const authService = {
  login: loginUser,
  register: registerUser,
  logout: logoutUser,
  onAuthChange,
  ensureUserProfile,
};

