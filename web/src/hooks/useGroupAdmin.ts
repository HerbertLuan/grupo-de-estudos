import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthContext } from '../contexts/AuthContext';
import { db } from '../firebase/config';

export function useGroupAdmin() {
  const { user, profile } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsAdmin(null);
    setError(null);
    if (!user || !profile?.groupId) return;
    return onSnapshot(
      doc(db, 'groups', profile.groupId, 'members', user.uid),
      snap => setIsAdmin(snap.exists() && snap.data().role === 'admin'),
      err => { setIsAdmin(null); setError(err.message); },
    );
  }, [user?.uid, profile?.groupId]);

  return { isAdmin, error };
}
