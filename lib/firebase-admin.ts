import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export function getAdminApp(): admin.app.App {
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      throw new Error('Firebase service account not configured');
    }
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  }
  return admin.app();
}

export function getAdminFirestore(): FirebaseFirestore.Firestore {
  const app = getAdminApp();
  const databaseId = process.env.VITE_FIRESTORE_DATABASE_ID || '(default)';
  return getFirestore(app, databaseId);
}

export function verifyIdToken(idToken: string) {
  return getAuth(getAdminApp()).verifyIdToken(idToken);
}
