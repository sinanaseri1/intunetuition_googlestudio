import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from "stripe";
import admin from "firebase-admin";
import { getAdminFirestore, verifyIdToken } from './lib/firebase-admin';
import { checkoutSchema, subscriptionSchema, anonymizeSchema, sanitizeError, AuthError } from './lib/api-utils';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Webhook route must be registered before express.json() so the raw body
  // is preserved for Stripe signature verification.
  app.post("/api/webhook", express.raw({ type: () => true }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || typeof sig !== "string") {
      return res.status(400).json({ error: "Missing Stripe signature" });
    }
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let event: Stripe.Event;
    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body ?? "");
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);
      return res.status(400).json({ error: "Invalid signature" });
    }

    try {
      const db = getAdminFirestore();

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const { studentId, packageId, credits, location, planName } = session.metadata || {};

          if (studentId) {
            const studentDocRef = db.collection("students").doc(studentId);
            const studentDoc = await studentDocRef.get();

            const creditAmount = credits ? parseInt(credits, 10) : 0;

            if (studentDoc.exists) {
              const history = (studentDoc.data()?.packageHistory as Array<Record<string, unknown>>) || [];
              const alreadyProcessed = history.some((h) => h.sessionId === session.id);
              if (alreadyProcessed) {
                console.log(`Checkout session already processed, skipping: ${session.id}`);
                return res.status(200).json({ received: true });
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
                  location: location || "",
                  planName: planName || "",
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

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription ${event.type.split(".").pop()}: ${subscription.id}`, {
            customerId: subscription.customer,
            status: subscription.status,
          });
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`Subscription cancelled: ${subscription.id}`, {
            customerId: subscription.customer,
          });
          break;
        }

        default:
          console.log(`Unhandled Stripe event: ${event.type}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  async function requireUserId(req: express.Request): Promise<string> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError();
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = await verifyIdToken(token);
      return decoded.uid;
    } catch {
      throw new AuthError();
    }
  }

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const uid = await requireUserId(req);
      const validation = checkoutSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Invalid input" });
      }

      const { priceId, studentId, packageId, credits, location, planName } = validation.data;

      if (studentId !== uid) {
        return res.status(403).json({ error: "Forbidden: cannot checkout for another account" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Payment processing not configured" });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.APP_URL}/dashboard?canceled=true`,
        metadata: {
          studentId,
          packageId: packageId || "",
          credits: credits?.toString() || "",
          location: location || "",
          planName: planName || "",
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      const { status, message } = sanitizeError(error, "Failed to create checkout session");
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/create-subscription-session", async (req, res) => {
    try {
      const uid = await requireUserId(req);
      const validation = subscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Invalid input" });
      }

      const { priceId, studentId, planName } = validation.data;

      if (studentId !== uid) {
        return res.status(403).json({ error: "Forbidden: cannot checkout for another account" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Payment processing not configured" });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&subscription_success=true`,
        cancel_url: `${process.env.APP_URL}/dashboard?canceled=true`,
        metadata: {
          studentId,
          planName: planName || "",
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      const { status, message } = sanitizeError(error, "Failed to create subscription session");
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/anonymize-account", async (req, res) => {
    try {
      const uid = await requireUserId(req);

      const validation = anonymizeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Invalid input" });
      }

      const db = getAdminFirestore();
      const hash = uid.substring(0, 8);
      const anonymizedEmail = `anonymized_${hash}@anonymized.local`;
      const anonymizedName = "[DELETED]";

      const userDocRef = db.collection("users").doc(uid);
      await userDocRef.set({
        email: anonymizedEmail,
        name: anonymizedName,
        anonymizedAt: new Date().toISOString(),
        originalId: uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      const studentDocRef = db.collection("students").doc(uid);
      const studentDoc = await studentDocRef.get();
      if (studentDoc.exists) {
        await studentDocRef.set({
          childName: "[DELETED]",
          yearGroup: "[DELETED]",
          school: "[DELETED]",
          phone: "[DELETED]",
          anonymizedAt: new Date().toISOString(),
          originalId: uid,
          gdprConsentGiven: false,
        }, { merge: true });
      }

      await admin.auth().updateUser(uid, {
        email: anonymizedEmail,
        displayName: anonymizedName,
      });

      res.json({ success: true, message: "Account anonymized successfully" });
    } catch (error) {
      const { status, message } = sanitizeError(error);
      res.status(status).json({ error: message });
    }
  });

  app.get("/api/export-data", async (req, res) => {
    try {
      const uid = await requireUserId(req);

      const db = getAdminFirestore();

      const userDoc = await db.collection("users").doc(uid).get();
      const studentDoc = await db.collection("students").doc(uid).get();

      const bookingsSnapshot = await db.collection("bookings").where("studentId", "==", uid).get();
      const bookings = bookingsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const data = {
        exportDate: new Date().toISOString(),
        account: userDoc.exists ? userDoc.data() : null,
        student: studentDoc.exists ? studentDoc.data() : null,
        bookings,
      };

      res.json(data);
    } catch (error) {
      const { status, message } = sanitizeError(error);
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
