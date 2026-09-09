import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { Group, GroupMember } from '../types';

/**
 * Ingressa o usuário em um grupo privado utilizando o código de convite de 6 caracteres.
 */
export async function joinGroupWithCode(inviteCode: string): Promise<Group> {
  try {
    const fn = httpsCallable<{ inviteCode: string }, Group>(
      functions,
      'join_group_with_code'
    );

    const result = await fn({ inviteCode: inviteCode.trim().toUpperCase() });
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao ingressar no grupo com código de convite.';
    console.error('Erro em joinGroupWithCode:', error);
    throw new Error(message);
  }
}

/**
 * Obtém a lista de membros pertencentes ao grupo, ordenada por total de pontos e tempo de estudo.
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    const fn = httpsCallable<{ groupId: string }, GroupMember[]>(
      functions,
      'get_group_members'
    );

    const result = await fn({ groupId });
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar membros do grupo.';
    console.error('Erro em getGroupMembers:', error);
    throw new Error(message);
  }
}

/**
 * Cria um novo grupo de estudos e adiciona o criador como administrador.
 */
export async function createGroup(
  name: string,
  inviteCode?: string,
  timezone?: string
): Promise<Group> {
  try {
    const fn = httpsCallable<
      { name: string; inviteCode?: string; timezone?: string },
      Group
    >(functions, 'create_group');

    const payload: { name: string; inviteCode?: string; timezone?: string } = {
      name: name.trim(),
    };
    if (inviteCode) payload.inviteCode = inviteCode.trim().toUpperCase();
    if (timezone) payload.timezone = timezone;

    const result = await fn(payload);
    return result.data;
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar grupo.';
    console.error('Erro em createGroup:', error);
    throw new Error(message);
  }
}
