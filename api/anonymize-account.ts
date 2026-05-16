import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { handleCors, verifyAuthToken, anonymizeSchema, sanitizeError, safeJsonResponse } from '../lib/api-utils';

let firestoreDb: ReturnType<typeof getFirestore> | null = null;

function getFirestoreDb() {
  if (!firestoreDb) {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    };
    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
    }
    firestoreDb = getFirestore();
  }
  return firestoreDb;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decodedToken = await verifyAuthToken(req);
    const userId = decodedToken.uid;

    const bodyValidation = anonymizeSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return safeJsonResponse(res, 400, { error: bodyValidation.error.errors[0]?.message || 'Invalid input' });
    }

    if (!admin.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!serviceAccount) {
        return safeJsonResponse(res, 500, { error: 'Server configuration error' });
      }
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    }

    const db = getFirestoreDb();
    const hash = userId.substring(0, 8);
    const anonymizedEmail = `anonymized_${hash}@anonymized.local`;
    const anonymizedName = '[DELETED]';

    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      email: anonymizedEmail,
      name: anonymizedName,
      anonymizedAt: new Date().toISOString(),
      originalId: userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    const studentDocRef = doc(db, 'students', userId);
    const studentDoc = await getDoc(studentDocRef);
    if (studentDoc.exists()) {
      await setDoc(studentDocRef, {
        childName: '[DELETED]',
        yearGroup: '[DELETED]',
        school: '[DELETED]',
        phone: '[DELETED]',
        anonymizedAt: new Date().toISOString(),
        originalId: userId,
        gdprConsentGiven: false,
      }, { merge: true });
    }

    await admin.auth().updateUser(userId, {
      email: anonymizedEmail,
      displayName: anonymizedName,
    });

    return safeJsonResponse(res, 200, { success: true, message: 'Account anonymized successfully' });
  } catch (error) {
    const { status, message } = sanitizeError(error);
    if (message === 'Unauthorized') {
      return safeJsonResponse(res, 401, { error: 'Authentication required' });
    }
    return safeJsonResponse(res, status, { error: message });
  }
}
