import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { BadgeConfig, UserBadge } from '../types';

/**
 * Obtém todo o catálogo de medalhas/badges disponíveis na plataforma,
 * ordenadas pelo identificador 'id'.
 */
export async function getCatalogBadges(): Promise<BadgeConfig[]> {
  try {
    const badgesCol = collection(db, 'badges');
    const badgesQuery = query(badgesCol, orderBy('id'));
    const snapshot = await getDocs(badgesQuery);

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as BadgeConfig),
      id: doc.id,
    }));
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar catálogo de medalhas.';
    console.error('Erro em getCatalogBadges:', error);
    throw new Error(message);
  }
}

/**
 * Obtém todas as medalhas/badges desbloqueadas por um usuário específico.
 */
export async function getUserBadges(uid: string): Promise<UserBadge[]> {
  try {
    const userBadgesCol = collection(db, 'users', uid, 'badges');
    const snapshot = await getDocs(userBadgesCol);

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as UserBadge),
      id: doc.id,
    }));
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar medalhas do usuário.';
    console.error('Erro em getUserBadges:', error);
    throw new Error(message);
  }
}
