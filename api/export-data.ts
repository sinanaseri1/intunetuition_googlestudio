import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { handleCors, verifyAuthToken, sanitizeError, safeJsonResponse } from '../lib/api-utils';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decodedToken = await verifyAuthToken(req);
    const userId = decodedToken.uid;

    const db = getFirestoreDb();

    const userDoc = await getDoc(doc(db, 'users', userId));
    const studentDoc = await getDoc(doc(db, 'students', userId));

    const bookingsQuery = query(collection(db, 'bookings'), where('studentId', '==', userId));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const data = {
      exportDate: new Date().toISOString(),
      account: userDoc.exists() ? userDoc.data() : null,
      student: studentDoc.exists() ? studentDoc.data() : null,
      bookings,
    };

    return safeJsonResponse(res, 200, data);
  } catch (error) {
    const { status, message } = sanitizeError(error);
    if (message === 'Unauthorized') {
      return safeJsonResponse(res, 401, { error: 'Authentication required' });
    }
    return safeJsonResponse(res, status, { error: message });
  }
}
