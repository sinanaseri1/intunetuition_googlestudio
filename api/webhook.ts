import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { getAdminFirestore } from '../lib/firebase-admin';
import { handleCors, safeJsonResponse } from '../lib/api-utils';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return stripe;
}

async function getRawBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    return safeJsonResponse(res, 400, { error: 'Missing Stripe signature' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return safeJsonResponse(res, 500, { error: 'Webhook not configured' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return safeJsonResponse(res, 500, { error: 'Webhook not configured' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return safeJsonResponse(res, 400, { error: 'Invalid signature' });
  }

  try {
    const db = getAdminFirestore();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { studentId, packageId, credits, location, planName } = session.metadata || {};

        if (studentId) {
          const studentDocRef = db.collection('students').doc(studentId);
          const studentDoc = await studentDocRef.get();

          const creditAmount = credits ? parseInt(credits, 10) : 0;

          if (studentDoc.exists) {
            const history = (studentDoc.data()?.packageHistory as Array<Record<string, unknown>>) || [];
            const alreadyProcessed = history.some((h) => h.sessionId === session.id);
            if (alreadyProcessed) {
              console.log(`Checkout session already processed, skipping: ${session.id}`);
              return safeJsonResponse(res, 200, { received: true });
            }

            const updates: Record<string, unknown> = {
              updatedAt: new Date().toISOString(),
            };
            if (creditAmount > 0) {
              updates.creditsRemaining = admin.firestore.FieldValue.increment(creditAmount);
            }
            if (packageId) {
              updates.packageHistory = admin.firestore.FieldValue.arrayUnion({
                packageId,
                location: location || '',
                planName: planName || '',
                credits: creditAmount,
                purchasedAt: new Date().toISOString(),
                sessionId: session.id,
                amountTotal: session.amount_total ? session.amount_total / 100 : null,
              });
            }
            await studentDocRef.update(updates);
          }
        }

        console.log(`Checkout session completed: ${session.id}`, { studentId, packageId, credits, location, planName });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${event.type.split('.').pop()}: ${subscription.id}`, {
          customerId: subscription.customer,
          status: subscription.status,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription cancelled: ${subscription.id}`, {
          customerId: subscription.customer,
        });
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return safeJsonResponse(res, 200, { received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return safeJsonResponse(res, 500, { error: 'Webhook processing failed' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
