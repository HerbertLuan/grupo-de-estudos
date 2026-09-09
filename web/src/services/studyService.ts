import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { ActiveSessionState, FinishSessionResult, StudySession } from '../types';

/**
 * Inicia uma nova sessão de estudo para o usuário autenticado.
 * Garante que apenas uma sessão ativa/pausada exista por usuário.
 */
export async function startSession(): Promise<StudySession> {
  try {
    const fn = httpsCallable<void, StudySession>(functions, 'start_study_session');
    const result = await fn();
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao iniciar sessão de estudo.';
    console.error('Erro em startSession:', error);
    throw new Error(message);
  }
}

/**
 * Pausa a sessão de estudo atualmente ativa do usuário.
 */
export async function pauseSession(): Promise<StudySession> {
  try {
    const fn = httpsCallable<void, StudySession>(functions, 'pause_study_session');
    const result = await fn();
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao pausar sessão de estudo.';
    console.error('Erro em pauseSession:', error);
    throw new Error(message);
  }
}

/**
 * Retoma uma sessão de estudo previamente pausada.
 */
export async function resumeSession(): Promise<StudySession> {
  try {
    const fn = httpsCallable<void, StudySession>(functions, 'resume_study_session');
    const result = await fn();
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao retomar sessão de estudo.';
    console.error('Erro em resumeSession:', error);
    throw new Error(message);
  }
}

/**
 * Finaliza a sessão de estudo ativa ou pausada, consolidando os segundos no total do dia,
 * calculando streaks, pontos e conquistas de badges.
 */
export async function finishSession(): Promise<FinishSessionResult> {
  try {
    const fn = httpsCallable<void, FinishSessionResult>(functions, 'finish_study_session');
    const result = await fn();
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao finalizar sessão de estudo.';
    console.error('Erro em finishSession:', error);
    throw new Error(message);
  }
}

/**
 * Descarta a sessão de estudo ativa ou pausada sem contabilizar pontos ou tempo.
 */
export async function discardSession(): Promise<{ success: boolean }> {
  try {
    const fn = httpsCallable<void, { success: boolean }>(functions, 'discard_study_session');
    const result = await fn();
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao descartar sessão de estudo.';
    console.error('Erro em discardSession:', error);
    throw new Error(message);
  }
}

/**
 * Recupera o estado da sessão de estudo atual do usuário, incluindo tempo decorrido calculado no servidor.
 */
export async function getCurrentSession(): Promise<ActiveSessionState> {
  try {
    const fn = httpsCallable<void, ActiveSessionState>(functions, 'get_current_session');
    const result = await fn();
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao obter sessão atual de estudo.';
    console.error('Erro em getCurrentSession:', error);
    throw new Error(message);
  }
}
