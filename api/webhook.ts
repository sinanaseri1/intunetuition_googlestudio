import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { handleCors, sanitizeError, safeJsonResponse, requireEnv } from '../lib/api-utils';

let firestoreDb: ReturnType<typeof getFirestore> | null = null;
let stripe: Stripe | null = null;

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

function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
  }
  return stripe;
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

  try {
    const event = getStripe().webhooks.constructEvent(
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      sig,
      webhookSecret
    );

    const db = getFirestoreDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { studentId, packageId, credits, planName } = session.metadata || {};

        if (studentId) {
          const studentDocRef = doc(db, 'students', studentId);
          const studentDoc = await getDoc(studentDocRef);

          const creditAmount = credits ? parseInt(credits, 10) : 0;

          if (studentDoc.exists()) {
            const updates: Record<string, unknown> = {
              updatedAt: new Date().toISOString(),
            };
            if (creditAmount > 0) {
              updates.creditsRemaining = increment(creditAmount);
            }
            if (packageId) {
              updates.packageHistory = arrayUnion({
                packageId,
                purchasedAt: new Date().toISOString(),
                sessionId: session.id,
              });
            }
            await updateDoc(studentDocRef, updates as any);
          }
        }

        console.log(`Checkout session completed: ${session.id}`, { studentId, packageId, credits, planName });
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
    const { status, message } = sanitizeError(error, 'Webhook processing failed');
    return safeJsonResponse(res, status, { error: message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
