import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { handleCors, subscriptionSchema, sanitizeError, safeJsonResponse, verifyAuthToken, resolveAppUrl } from '../lib/api-utils';

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

    const validation = subscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return safeJsonResponse(res, 400, { error: validation.error.errors[0]?.message || 'Invalid input' });
    }

    const { priceId, studentId, planName } = validation.data;

    if (studentId !== decodedToken.uid) {
      return safeJsonResponse(res, 403, { error: 'Forbidden: cannot checkout for another account' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return safeJsonResponse(res, 500, { error: 'Payment processing not configured' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const appUrl = resolveAppUrl(req.headers);
    if (!appUrl) {
      return safeJsonResponse(res, 500, { error: 'Application URL is not configured' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&subscription_success=true`,
      cancel_url: `${appUrl}/dashboard?canceled=true`,
      metadata: {
        studentId,
        planName: planName || '',
      },
    });

    return safeJsonResponse(res, 200, { id: session.id, url: session.url });
  } catch (error) {
    const { status, message } = sanitizeError(error, 'Failed to create subscription session');
    return safeJsonResponse(res, status, { error: message });
  }
}
