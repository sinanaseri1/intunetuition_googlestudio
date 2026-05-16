import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { z } from "zod";
import admin from "firebase-admin";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment, arrayUnion } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const checkoutSchema = z.object({
    priceId: z.string().min(1, 'priceId is required'),
    studentId: z.string().min(1, 'studentId is required'),
    packageId: z.string().optional(),
    credits: z.union([z.string(), z.number()]).optional(),
    location: z.string().optional(),
    planName: z.string().optional(),
  });

  const subscriptionSchema = z.object({
    priceId: z.string().min(1, 'priceId is required'),
    studentId: z.string().min(1, 'studentId is required'),
    planName: z.string().optional(),
  });

  const anonymizeSchema = z.object({
    reason: z.string().max(1000).optional(),
  });

  let firestoreDb: ReturnType<typeof getFirestore> | null = null;

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

  function sanitizeError(error: unknown, defaultMsg = 'An internal error occurred') {
    if (error instanceof z.ZodError) {
      return { status: 400 as const, message: error.errors[0]?.message || 'Invalid input' };
    }
    console.error('Server error:', error);
    return { status: 500 as const, message: defaultMsg };
  }

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const validation = checkoutSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || 'Invalid input' });
      }

      const { priceId, studentId, packageId, credits, location, planName } = validation.data;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Payment processing not configured' });
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
          location: location || '',
          planName: planName || '',
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      const { status, message } = sanitizeError(error, 'Failed to create checkout session');
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/create-subscription-session", async (req, res) => {
    try {
      const validation = subscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || 'Invalid input' });
      }

      const { priceId, studentId, planName } = validation.data;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Payment processing not configured' });
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
        mode: 'subscription',
        success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&subscription_success=true`,
        cancel_url: `${process.env.APP_URL}/dashboard?canceled=true`,
        metadata: {
          studentId,
          planName: planName || '',
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      const { status, message } = sanitizeError(error, 'Failed to create subscription session');
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/anonymize-account", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = anonymizeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || 'Invalid input' });
      }

      const token = authHeader.split(' ')[1];

      if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccount) {
          return res.status(500).json({ error: 'Server configuration error' });
        }
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const db = getFirestoreDb();
      const hash = userId.substring(0, 8);
      const anonymizedEmail = `anonymized_${hash}@anonymized.local`;
      const anonymizedName = '[DELETED]';

      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        email: anonymizedEmail,
        name: anonymizedName,
        anonymizedAt: new Date().toISOString(),
        originalId: userId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const studentDocRef = doc(db, 'students', userId);
      const studentDoc = await getDoc(studentDocRef);
      if (studentDoc.exists()) {
        await setDoc(studentDocRef, {
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

      res.json({ success: true, message: 'Account anonymized successfully' });
    } catch (error) {
      const { status, message } = sanitizeError(error);
      if (message === 'Unauthorized') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      res.status(status).json({ error: message });
    }
  });

  app.get("/api/export-data", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1];

      if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccount) {
          return res.status(500).json({ error: 'Server configuration error' });
        }
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const db = getFirestoreDb();

      const userDoc = await getDoc(doc(db, 'users', userId));
      const studentDoc = await getDoc(doc(db, 'students', userId));

      const bookingsQuery = query(collection(db, 'bookings'), where('studentId', '==', userId));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const data = {
        exportDate: new Date().toISOString(),
        account: userDoc.exists() ? userDoc.data() : null,
        student: studentDoc.exists() ? studentDoc.data() : null,
        bookings,
      };

      res.json(data);
    } catch (error) {
      const { status, message } = sanitizeError(error);
      if (message === 'Unauthorized') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      res.status(status).json({ error: message });
    }
  });

  app.get("/api/admin/users-without-consent", async (req, res) => {
    res.json({
      users: [],
      message: "Admin endpoint - requires admin authentication in production",
    });
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dev server running on http://localhost:${PORT}`);
  });
}

startServer();
