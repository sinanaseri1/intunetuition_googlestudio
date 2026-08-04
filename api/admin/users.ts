import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { listAllUsers, backfillUserProfile } from '../../lib/admin-users';
import { handleCors, verifyAdminToken, sanitizeError, safeJsonResponse } from '../../lib/api-utils';

const backfillSchema = z.object({
  uid: z.string().min(1, 'uid is required').max(128),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // Exposes every account on the platform — admin-only, not merely signed in.
    await verifyAdminToken(req);

    if (req.method === 'GET') {
      return safeJsonResponse(res, 200, { users: await listAllUsers() });
    }

    if (req.method === 'POST') {
      const validation = backfillSchema.safeParse(req.body);
      if (!validation.success) {
        return safeJsonResponse(res, 400, { error: validation.error.errors[0]?.message || 'Invalid input' });
      }
      return safeJsonResponse(res, 200, { user: await backfillUserProfile(validation.data.uid) });
    }

    return safeJsonResponse(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    const { status, message } = sanitizeError(error, 'Failed to load users');
    return safeJsonResponse(res, status, { error: message });
  }
}
