import * as admin from 'firebase-admin';
import { runSeedDatabase } from '../src/services/seedService';

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  'grupo-de-estudos-4b504';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
  });
}

const db = admin.firestore();

runSeedDatabase(db)
  .then((result) => {
    console.log('✅', result.message, result.counts);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro durante o seed:', err);
    process.exit(1);
  });
