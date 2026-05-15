import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, studentId, packageId, credits } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe secret key not configured" });
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
          packageId,
          credits: credits.toString()
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-subscription-session", async (req, res) => {
    try {
      const { priceId, studentId, planName } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe secret key not configured" });
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
          planName
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/anonymize-account", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(' ')[1];
      const admin = require('firebase-admin');
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'))
        });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const { initializeApp, getApps } = require('firebase/app');
      const { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');

      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      };

      if (getApps.length === 0) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();

      const hash = userId.substring(0, 8);
      const anonymizedEmail = `anonymized_${hash}@anonymized.local`;
      const anonymizedName = '[DELETED]';

      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        email: anonymizedEmail,
        name: anonymizedName,
        anonymizedAt: new Date().toISOString(),
        originalId: userId,
        updatedAt: new Date().toISOString()
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
          gdprConsentGiven: false
        }, { merge: true });
      }

      await admin.auth().updateUser(userId, {
        email: anonymizedEmail,
        displayName: anonymizedName,
      });

      res.json({ success: true, message: "Account anonymized successfully" });
    } catch (error: any) {
      console.error("Anonymization error:", error);
      res.status(500).json({ error: error.message || "Failed to anonymize account" });
    }
  });

  app.get("/api/export-data", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(' ')[1];
      const admin = require('firebase-admin');
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'))
        });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const { initializeApp, getApps } = require('firebase/app');
      const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      };

      if (getApps.length === 0) {
        initializeApp(firebaseConfig);
      }
      const db = getFirestore();

      const userDoc = await getDoc(doc(db, 'users', userId));
      const studentDoc = await getDoc(doc(db, 'students', userId));

      const bookingsQuery = query(collection(db, 'bookings'), where('studentId', '==', userId));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const data = {
        exportDate: new Date().toISOString(),
        account: userDoc.exists() ? userDoc.data() : null,
        student: studentDoc.exists() ? studentDoc.data() : null,
        bookings: bookings
      };

      res.json(data);
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ error: error.message || "Failed to export data" });
    }
  });

  app.get("/api/admin/users-without-consent", async (req, res) => {
    try {
      res.json({ 
        users: [],
        message: "Admin endpoint - requires admin authentication in production"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
