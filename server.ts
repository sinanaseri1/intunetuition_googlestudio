import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from "stripe";
import admin from "firebase-admin";
import { getAdminFirestore, verifyIdToken } from './lib/firebase-admin';
import {
  checkoutSchema,
  subscriptionSchema,
  anonymizeSchema,
  sanitizeError,
  AuthError,
  ServerConfigError,
  ForbiddenError,
  getWebhookSecrets,
  resolveAppUrl,
} from './lib/api-utils';
import { resolvePackageByPriceId } from './lib/package-catalog';
import { constructStripeEvent } from './lib/stripe-webhook';
import { listAllUsers, backfillUserProfile } from './lib/admin-users';
import { deleteAccountCompletely, countAdmins } from './lib/account-deletion';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Webhook route must be registered before express.json() so the raw body
  // is preserved for Stripe signature verification.
  app.post("/api/webhook", express.raw({ type: () => true }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig || typeof sig !== "string") {
      return res.status(400).json({ error: "Missing Stripe signature" });
    }
    if (getWebhookSecrets().length === 0) {
      console.error("No Stripe webhook signing secret configured (STRIPE_WEBHOOK_SECRET / STRIPE_WEBHOOK_SECRETS)");
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
      event = constructStripeEvent(stripe, rawBody, sig);
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

            // Idempotency: Stripe retries deliveries, so a replayed event must
            // never credit twice.
            const history = (studentDoc.data()?.packageHistory as Array<Record<string, unknown>>) || [];
            if (history.some((h) => h.sessionId === session.id)) {
              console.log(`Checkout session already processed, skipping: ${session.id}`);
              return res.status(200).json({ received: true });
            }

            const updates: Record<string, unknown> = {
              userId: studentId,
              updatedAt: new Date().toISOString(),
            };
            if (creditAmount > 0) {
              updates.creditsRemaining = admin.firestore.FieldValue.increment(creditAmount);
            } else if (!studentDoc.exists) {
              updates.creditsRemaining = 0;
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
            } else if (!studentDoc.exists) {
              updates.packageHistory = [];
            }

            // set+merge rather than update(): a missing student document used to
            // make this a no-op, so the customer was charged, Stripe received a
            // 200, and the credits vanished with no retry.
            await studentDocRef.set(updates, { merge: true });
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
    if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.VITE_FIREBASE_PROJECT_ID) {
      throw new ServerConfigError("Firebase Admin is not configured: set FIREBASE_SERVICE_ACCOUNT or VITE_FIREBASE_PROJECT_ID");
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = await verifyIdToken(token);
      return decoded.uid;
    } catch {
      throw new AuthError();
    }
  }

  // Mirrors verifyAdminToken() in lib/api-utils.ts: role lives on the Firestore
  // user document, never on the client.
  async function requireAdminId(req: express.Request): Promise<string> {
    const uid = await requireUserId(req);
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new ServerConfigError("FIREBASE_SERVICE_ACCOUNT is required for admin operations");
    }
    const userDoc = await getAdminFirestore().collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new ForbiddenError("Admin access required");
    }
    return uid;
  }

  app.get("/api/admin/users", async (req, res) => {
    try {
      await requireAdminId(req);
      res.json({ users: await listAllUsers() });
    } catch (error) {
      const { status, message } = sanitizeError(error, "Failed to load users");
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      await requireAdminId(req);
      const uid = typeof req.body?.uid === "string" ? req.body.uid.trim() : "";
      if (!uid) {
        return res.status(400).json({ error: "uid is required" });
      }
      res.json({ user: await backfillUserProfile(uid) });
    } catch (error) {
      const { status, message } = sanitizeError(error, "Failed to create user profile");
      res.status(status).json({ error: message });
    }
  });

  // Mirrors the DELETE branch of api/admin/users.ts.
  app.delete("/api/admin/users", async (req, res) => {
    try {
      const adminUid = await requireAdminId(req);
      const uid = typeof req.body?.uid === "string" ? req.body.uid.trim() : "";
      if (!uid) {
        return res.status(400).json({ error: "uid is required" });
      }
      if (uid === adminUid) {
        return res.status(400).json({
          error: "You cannot delete your own account from here. Use Account Settings.",
        });
      }
      const target = await getAdminFirestore().collection("users").doc(uid).get();
      if (target.data()?.role === "admin" && (await countAdmins()) <= 1) {
        return res.status(400).json({
          error: "Cannot delete the last remaining admin. Promote another admin first.",
        });
      }
      res.json({ result: await deleteAccountCompletely(uid) });
    } catch (error) {
      const { status, message } = sanitizeError(error, "Failed to delete user");
      res.status(status).json({ error: message });
    }
  });

  // Mirrors api/delete-account.ts — permanent self-deletion.
  app.post("/api/delete-account", async (req, res) => {
    try {
      const uid = await requireUserId(req);
      const own = await getAdminFirestore().collection("users").doc(uid).get();
      if (own.data()?.role === "admin" && (await countAdmins()) <= 1) {
        return res.status(400).json({
          error: "You are the only admin. Promote another admin before deleting your account.",
        });
      }
      res.json({ success: true, result: await deleteAccountCompletely(uid) });
    } catch (error) {
      const { status, message } = sanitizeError(error, "Failed to delete account");
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const uid = await requireUserId(req);
      const validation = checkoutSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Invalid input" });
      }

      const { priceId, studentId } = validation.data;

      if (studentId !== uid) {
        return res.status(403).json({ error: "Forbidden: cannot checkout for another account" });
      }

      // See lib/package-catalog.ts — never trust packageId/credits/location/
      // planName from the client, since the webhook credits creditsRemaining
      // based on exactly what ends up in this metadata.
      const resolvedPackage = resolvePackageByPriceId(priceId);
      if (!resolvedPackage) {
        return res.status(400).json({ error: "Unknown package" });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Payment processing not configured" });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const appUrl = resolveAppUrl(req.headers);
      if (!appUrl) {
        return res.status(500).json({ error: "Application URL is not configured" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${appUrl}/checkout/cancel?canceled=true`,
        metadata: {
          studentId,
          packageId: resolvedPackage.packageId,
          credits: resolvedPackage.credits.toString(),
          location: resolvedPackage.location,
          planName: resolvedPackage.planName,
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

      const appUrl = resolveAppUrl(req.headers);
      if (!appUrl) {
        return res.status(500).json({ error: "Application URL is not configured" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&subscription_success=true`,
        cancel_url: `${appUrl}/checkout/cancel?canceled=true`,
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
