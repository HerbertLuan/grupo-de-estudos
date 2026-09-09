import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'grupo-de-estudos-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'grupo-de-estudos-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'grupo-de-estudos-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Em dev sem emuladores, aponta o SDK para o proxy do Vite em vez da URL de produção.
// O SDK aceita uma URL completa como segundo argumento — quando é URL, usa como customDomain
// e constrói: `${customDomain}/${nomeDaFunção}`. O proxy do Vite encaminha para o Cloud Run
// com changeOrigin=true, eliminando o CORS no browser.
const functionsRegionOrDomain =
  import.meta.env.DEV && !useEmulators
    ? `${window.location.origin}/southamerica-east1-grupo-de-estudos-4b504`
    : 'southamerica-east1';

export const functions = getFunctions(app, functionsRegionOrDomain);

if (import.meta.env.DEV && useEmulators) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
}

