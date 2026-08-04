import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export function getAdminApp(): admin.app.App {
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    } else if (projectId) {
      // No service account configured (typical for local dev, where nobody
      // wants a live private key sitting in .env). admin.auth().verifyIdToken()
      // only checks the token's signature against Google's public certs — it
      // never needs a credential — so auth-gated endpoints that don't touch
      // Firestore (like checkout session creation) still work end-to-end
      // without one. Firestore admin operations (webhook credits, anonymize,
      // export) do need a real credential and will fail clearly at the point
      // they're actually used if only a projectId is available.
      admin.initializeApp({ projectId });
    } else {
      throw new Error('Firebase Admin is not configured: set FIREBASE_SERVICE_ACCOUNT (or at least VITE_FIREBASE_PROJECT_ID for auth-only use)');
    }
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
