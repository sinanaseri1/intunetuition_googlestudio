import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { getAdminFirestore } from '../lib/firebase-admin.js';
import { handleCors, verifyAuthToken, anonymizeSchema, sanitizeError, safeJsonResponse } from '../lib/api-utils.js';

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

    const db = getAdminFirestore();
    const hash = userId.substring(0, 8);
    const anonymizedEmail = `anonymized_${hash}@anonymized.local`;
    const anonymizedName = '[DELETED]';

    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.set({
      email: anonymizedEmail,
      name: anonymizedName,
      anonymizedAt: new Date().toISOString(),
      originalId: userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    const studentDocRef = db.collection('students').doc(userId);
    const studentDoc = await studentDocRef.get();
    if (studentDoc.exists) {
      await studentDocRef.set({
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
    return safeJsonResponse(res, status, { error: message });
  }
}
