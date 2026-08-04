# Deployment Guide (Vercel)

Follow this step-by-step guide to securely deploy your application to Vercel and ensure that all features (including Firebase Authentication, Stripe payments, and GDPR compliance) work correctly in production.

## 1. Pre-Deployment Security Check
Before pushing your code to GitHub, ensure your secrets are safe:
- Make sure `.env` and `firebase-applet-config.json` are in your `.gitignore` file.
- **Never** commit your actual `.env` file to your repository.
- Verify that `firebase-admin` and `zod` are in your `package.json` dependencies.

## 2. Gather Your Environment Variables
You will need to enter these into Vercel. Keep this list handy.

**Secret Backend Keys (Keep these hidden):**
*   `GEMINI_API_KEY`: Your Google Gemini API key (from Google AI Studio).
*   `STRIPE_SECRET_KEY`: Your Stripe secret key (from Stripe Dashboard > Developers > API keys).
*   `STRIPE_WEBHOOK_SECRETS`: Comma-separated Stripe webhook signing secrets — one per registered endpoint (from Stripe Dashboard > Developers > Webhooks > each endpoint). **Required for payment processing to update Firestore.** `STRIPE_WEBHOOK_SECRET` (singular) still works for a single endpoint.
*   `FIREBASE_SERVICE_ACCOUNT`: The full JSON of your Firebase service account (from Firebase Console > Project Settings > Service Accounts > Generate new private key). Paste as a single-line JSON string. **Required for Stripe webhook credit updates, account anonymization, data export, and the admin User Management list.**
*   `APP_URLS`: Comma-separated list of every domain this deployment serves, no trailing slashes — for this project:
    `https://intunetuition.co.uk,https://intunetuition-googlestudio.vercel.app`
    Drives CORS and Stripe success/cancel URLs, so a checkout started on either domain returns to that same domain. The first entry is the fallback when a request's origin isn't recognised. `APP_URL` (singular) is still honoured for single-domain setups.

**Public Frontend Keys (From your Firebase Console or `firebase-applet-config.json`):**
*   `VITE_FIREBASE_API_KEY`
*   `VITE_FIREBASE_AUTH_DOMAIN`
*   `VITE_FIREBASE_PROJECT_ID`
*   `VITE_FIREBASE_STORAGE_BUCKET`
*   `VITE_FIREBASE_MESSAGING_SENDER_ID`
*   `VITE_FIREBASE_APP_ID`
*   `VITE_FIREBASE_MEASUREMENT_ID` (Optional)
*   `VITE_FIRESTORE_DATABASE_ID`

## 3. CRITICAL: Make Logins Work Online (Firebase)
By default, Firebase Authentication only allows logins from `localhost` and your specific AI Studio preview URL. To make Google Login work on your new Vercel domain:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the left sidebar, click **Authentication**, then click the **Settings** tab.
4. Click on **Authorized domains** in the left menu of the settings page.
5. Click **Add domain**.
6. Enter your Vercel production domain (e.g., `your-app-name.vercel.app`). Do not include `https://` or any trailing slashes.
7. Click **Add**.

*If you skip this step, users will get an "Unauthorized Domain" error when trying to log in.*

## 4. Bootstrap the First Admin
Admin access is **role-based**: any user whose `users/{uid}` document has `role: 'admin'` in Firestore can access `/admin` and is treated as an admin by `firestore.rules` (`isAdmin()` checks this field, not an email). There is no env var for this — it's intentionally not possible to self-assign admin on sign-up, since that would let anyone claim admin by controlling an env var.

To create the first admin after deploying:
1. Sign up normally through the app (you'll land as a regular `student`).
2. In the Firebase Console, go to **Firestore Database** → the `ai-studio-...` database → `users` collection → your user document → edit the `role` field to `admin`.
3. Sign out and back in (or refresh) — you'll now see the Admin Dashboard.
4. From then on, promote/demote any other user's role from the Admin Dashboard's **Users & Roles** tab — no more manual Firestore edits needed, and you can have as many admins as you like.

## 4a. CRITICAL: Publish Firestore Security Rules
Sign-up and login fail with "Missing or insufficient permissions" until the repo's `firestore.rules` are published to the custom database (`ai-studio-62953b58-6116-498b-9d65-2c51621042f0`). Either:

- **Firebase Console (no CLI):** Firestore Database → select the `ai-studio-...` database → Rules tab → paste the full contents of `firestore.rules` → Publish.
- **Firebase CLI:** install with `npm i -g firebase-tools`, then run `firebase login` and `firebase deploy --only firestore:rules` (`firebase.json` now pins the `database` field to the `ai-studio-...` database, so this deploys to the right place).

Verify after publishing: a new sign-up should create `users/{uid}` and `students/{uid}` docs (check the browser console for `permission-denied` errors if it doesn't).

## 5. Set Up Stripe Webhooks
To ensure payments correctly update student credits and package history:

1. Go to Stripe Dashboard > Developers > Webhooks.
2. Click **Add endpoint**.
3. Set the endpoint URL to `https://intunetuition.co.uk/api/webhook`.
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**.
6. Copy the **Signing secret** (starts with `whsec_...`).
7. *(Optional)* Repeat steps 2–6 for `https://intunetuition-googlestudio.vercel.app/api/webhook` if you want events delivered to the Vercel domain too.
8. Put every signing secret you collected into `STRIPE_WEBHOOK_SECRETS` in Vercel as a comma-separated list — each incoming event is verified against them in turn, so both endpoints work.
9. Redeploy your Vercel project so the server picks up the new variable.

*One endpoint is enough:* both domains hit the same deployment, so a single webhook endpoint on your primary domain will process payments made from either. Register the second only if you want redundancy.

## 6. Deploying to Vercel
1. Go to [Vercel](https://vercel.com/) and log in with your GitHub account.
2. Click **Add New...** and select **Project**.
3. Import your GitHub repository.
4. In the "Configure Project" section:
   - **Framework Preset:** Vercel should automatically detect **Vite**.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Open the **Environment Variables** dropdown.
6. Add every single key and value from **Step 2**.
7. Click **Deploy**.

## 7. Post-Deployment: Domains, Stripe & Price IDs

1. **Set `APP_URLS`:** In Vercel Project Settings > Environment Variables, set `APP_URLS` to every domain the app serves, comma-separated, no trailing slashes:
   `https://intunetuition.co.uk,https://intunetuition-googlestudio.vercel.app`
   Both domains must be listed, or checkout redirects and CORS will fail on the missing one.
2. **Authorize both domains in Firebase:** Repeat Step 3 for *each* domain (`intunetuition.co.uk` and `intunetuition-googlestudio.vercel.app`), otherwise Google sign-in fails with "Unauthorized Domain" on whichever is missing.
3. **Redeploy** so the server picks up the new variables.
4. **Update Stripe Webhooks:** Ensure the endpoint URL(s) from Step 5 match your live domains.
5. **Sync real Stripe price IDs:** `src/config/terms.ts` ships with placeholder price IDs (e.g. `price_NOTT_AUT1_STD`) that Stripe will reject. Run `npm run prices:create` (needs `STRIPE_SECRET_KEY` in your local `.env`) to create the real Products/Prices and rewrite `terms.ts`, then commit and redeploy. The script prints whether it ran in **TEST** or **LIVE** mode — switching keys and re-running regenerates the IDs for that account. Until this is done, the pricing page shows "Currently Unavailable" instead of letting anyone attempt checkout.

Your app is now live, secure, and fully functional!

## Architecture Notes

This app uses **Vercel serverless functions** for all API routes (in the `api/` directory). The `server.ts` file is only used for local development with Vite's middleware mode. All production API traffic goes through Vercel's serverless infrastructure.

Key security features:
- **CORS** restricted to the origins listed in `APP_URLS` (or `APP_URL`); redirect targets are validated against the same allowlist, so a spoofed `Origin` header can't redirect a buyer off-site
- **Input validation** via Zod schemas on all endpoints
- **Error sanitization** — internal errors never leak to clients
- **Stripe webhook signature verification** prevents fake payment events
- **Admin access** controlled via a `role` field on the user's Firestore document, enforced server-side by `firestore.rules`
- **Security headers** (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- **Gemini API key** proxied through backend — never exposed to the client
