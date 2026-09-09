import { doc, getDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { DailyStudy } from '../types';

/**
 * Escuta em tempo real o registro de estudo diário de um usuário para uma data específica (YYYY-MM-DD).
 * Se o documento ainda não existir no dia, o callback recebe null.
 */
export function subscribeToDailyStudy(
  uid: string,
  date: string,
  callback: (daily: DailyStudy | null) => void
): Unsubscribe {
  const dailyDocRef = doc(db, 'users', uid, 'dailyStudy', date);

  return onSnapshot(
    dailyDocRef,
    (snap) => {
      if (snap.exists()) {
        callback({
          ...(snap.data() as DailyStudy),
          id: snap.id,
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Erro no listener de estudo diário (subscribeToDailyStudy):', error);
    }
  );
}

/**
 * Realiza a leitura pontual do registro consolidado de estudo diário do usuário.
 */
export async function getDailyStudy(
  uid: string,
  date: string
): Promise<DailyStudy | null> {
  try {
    const dailyDocRef = doc(db, 'users', uid, 'dailyStudy', date);
    const snap = await getDoc(dailyDocRef);

    if (!snap.exists()) {
      return null;
    }

    return {
      ...(snap.data() as DailyStudy),
      id: snap.id,
    };
  } catch (error: any) {
    const message = error?.message || 'Erro ao obter estudo diário.';
    console.error('Erro em getDailyStudy:', error);
    throw new Error(message);
  }
}
