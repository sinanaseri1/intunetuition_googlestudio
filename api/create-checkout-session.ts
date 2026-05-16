import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { handleCors, checkoutSchema, sanitizeError, safeJsonResponse } from '../lib/api-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      return safeJsonResponse(res, 400, { error: validation.error.errors[0]?.message || 'Invalid input' });
    }

    const { priceId, studentId, packageId, credits } = validation.data;

    if (!process.env.STRIPE_SECRET_KEY) {
      return safeJsonResponse(res, 500, { error: 'Payment processing not configured' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.APP_URL}/dashboard?canceled=true`,
      metadata: {
        studentId,
        packageId: packageId || '',
        credits: credits?.toString() || '',
      },
    });

    return safeJsonResponse(res, 200, { id: session.id, url: session.url });
  } catch (error) {
    const { status, message } = sanitizeError(error, 'Failed to create checkout session');
    return safeJsonResponse(res, status, { error: message });
  }
}
