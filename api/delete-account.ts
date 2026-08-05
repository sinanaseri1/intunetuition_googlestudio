import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteAccountCompletely, countAdmins } from '../lib/account-deletion';
import { getAdminFirestore } from '../lib/firebase-admin';
import { handleCors, verifyAuthToken, sanitizeError, safeJsonResponse } from '../lib/api-utils';

/**
 * Permanent self-deletion. Distinct from /api/anonymize-account, which keeps the
 * account and scrubs the personal data; this removes it entirely.
 *
 * Only ever acts on the caller's own uid, taken from the verified token rather
 * than the request body, so it cannot be pointed at anyone else.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decodedToken = await verifyAuthToken(req);
    const uid = decodedToken.uid;

    // Blocked for the same reason the admin endpoint blocks it: no code path
    // here can create a replacement admin, so this would be unrecoverable.
    const own = await getAdminFirestore().collection('users').doc(uid).get();
    if (own.data()?.role === 'admin' && (await countAdmins()) <= 1) {
      return safeJsonResponse(res, 400, {
        error: 'You are the only admin. Promote another admin before deleting your account.',
      });
    }

    const result = await deleteAccountCompletely(uid);
    return safeJsonResponse(res, 200, { success: true, result });
  } catch (error) {
    const { status, message } = sanitizeError(error, 'Failed to delete account');
    return safeJsonResponse(res, status, { error: message });
  }
}
