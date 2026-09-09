import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { UserProfile } from '../types';

import { ensureUserProfile } from '../services/authService';

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Cancela o listener de perfil anterior antes de trocar de usuário
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Seta o usuário mas mantém loading=true até o perfil resolver
      setUser(firebaseUser);

      let isSubscribed = true;
      let autoHealing = false;

      unsubProfile = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        async (snap) => {
          if (!isSubscribed) return;

          if (snap.exists()) {
            setProfile({ ...snap.data(), uid: snap.id } as UserProfile);
            setLoading(false);
          } else {
            // O usuário está autenticado no Auth mas NÃO possui documento em users/{uid}
            // Auto-recupera o perfil chamando ensureUserProfile
            if (!autoHealing) {
              autoHealing = true;
              try {
                console.log('Perfil não encontrado no Firestore. Recuperando perfil órfão...');
                await ensureUserProfile();
                // O listener onSnapshot receberá o documento recém-criado
              } catch (err) {
                console.error('Falha ao auto-recuperar perfil:', err);
                if (isSubscribed) {
                  await auth.signOut();
                  setProfile(null);
                  setLoading(false);
                }
              }
            }
          }
        },
        (error) => {
          console.error('Erro ao escutar alterações de perfil:', error);
          if (isSubscribed) {
            setLoading(false);
          }
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticated: !!user && !!profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
