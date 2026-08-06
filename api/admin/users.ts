import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { listAllUsers, backfillUserProfile } from '../../lib/admin-users.js';
import { deleteAccountCompletely, countAdmins } from '../../lib/account-deletion.js';
import { getAdminFirestore } from '../../lib/firebase-admin.js';
import { handleCors, verifyAdminToken, sanitizeError, safeJsonResponse } from '../../lib/api-utils.js';

const uidSchema = z.object({
  uid: z.string().min(1, 'uid is required').max(128),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // Exposes (and can delete) every account on the platform — admin-only, not
    // merely signed in.
    const decodedToken = await verifyAdminToken(req);

    if (req.method === 'GET') {
      return safeJsonResponse(res, 200, { users: await listAllUsers() });
    }

    if (req.method === 'POST') {
      const validation = uidSchema.safeParse(req.body);
      if (!validation.success) {
        return safeJsonResponse(res, 400, { error: validation.error.errors[0]?.message || 'Invalid input' });
      }
      return safeJsonResponse(res, 200, { user: await backfillUserProfile(validation.data.uid) });
    }

    if (req.method === 'DELETE') {
      const validation = uidSchema.safeParse(req.body);
      if (!validation.success) {
        return safeJsonResponse(res, 400, { error: validation.error.errors[0]?.message || 'Invalid input' });
      }
      const { uid } = validation.data;

      // An admin deleting themselves would drop their own session mid-request
      // and, if they were the only admin, lock the platform permanently.
      if (uid === decodedToken.uid) {
        return safeJsonResponse(res, 400, {
          error: 'You cannot delete your own account from here. Use Account Settings.',
        });
      }

      // Nothing in this codebase can create the first admin, so removing the
      // last one is unrecoverable without hand-editing Firestore.
      const target = await getAdminFirestore().collection('users').doc(uid).get();
      if (target.data()?.role === 'admin' && (await countAdmins()) <= 1) {
        return safeJsonResponse(res, 400, {
          error: 'Cannot delete the last remaining admin. Promote another admin first.',
        });
      }

      return safeJsonResponse(res, 200, { result: await deleteAccountCompletely(uid) });
    }

    return safeJsonResponse(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    const { status, message } = sanitizeError(error, 'Failed to load users');
    return safeJsonResponse(res, status, { error: message });
  }
}
