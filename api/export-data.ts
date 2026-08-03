import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminFirestore } from '../lib/firebase-admin';
import { handleCors, verifyAuthToken, sanitizeError, safeJsonResponse } from '../lib/api-utils';

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

    const db = getAdminFirestore();

    const userDoc = await db.collection('users').doc(userId).get();
    const studentDoc = await db.collection('students').doc(userId).get();

    const bookingsSnapshot = await db.collection('bookings').where('studentId', '==', userId).get();
    const bookings = bookingsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const data = {
      exportDate: new Date().toISOString(),
      account: userDoc.exists ? userDoc.data() : null,
      student: studentDoc.exists ? studentDoc.data() : null,
      bookings,
    };

    return safeJsonResponse(res, 200, data);
  } catch (error) {
    const { status, message } = sanitizeError(error);
    return safeJsonResponse(res, status, { error: message });
  }
}
