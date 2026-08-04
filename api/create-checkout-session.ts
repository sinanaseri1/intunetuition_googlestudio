import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { handleCors, checkoutSchema, sanitizeError, safeJsonResponse, verifyAuthToken, resolveAppUrl } from '../lib/api-utils';
import { resolvePackageByPriceId } from '../lib/package-catalog';

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

    const validation = checkoutSchema.safeParse(req.body);
    if (!validation.success) {
      return safeJsonResponse(res, 400, { error: validation.error.errors[0]?.message || 'Invalid input' });
    }

    const { priceId, studentId } = validation.data;

    if (studentId !== decodedToken.uid) {
      return safeJsonResponse(res, 403, { error: 'Forbidden: cannot checkout for another account' });
    }

    // Never trust packageId/credits/location/planName from the client for
    // this metadata — the webhook credits creditsRemaining based on exactly
    // what ends up here, so it must be derived from priceId server-side
    // (see lib/package-catalog.ts), not accepted as-is from the request body.
    const resolvedPackage = resolvePackageByPriceId(priceId);
    if (!resolvedPackage) {
      return safeJsonResponse(res, 400, { error: 'Unknown package' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return safeJsonResponse(res, 500, { error: 'Payment processing not configured' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Return the buyer to whichever allowed domain they started on, so they
    // don't land on a domain where their session isn't signed in.
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
      mode: 'payment',
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/dashboard?canceled=true`,
      metadata: {
        studentId,
        packageId: resolvedPackage.packageId,
        credits: resolvedPackage.credits.toString(),
        location: resolvedPackage.location,
        planName: resolvedPackage.planName,
      },
    });

    return safeJsonResponse(res, 200, { id: session.id, url: session.url });
  } catch (error) {
    const { status, message } = sanitizeError(error, 'Failed to create checkout session');
    return safeJsonResponse(res, status, { error: message });
  }
}
