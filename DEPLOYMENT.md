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
*   `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret (from Stripe Dashboard > Developers > Webhooks > your endpoint). **Required for payment processing to update Firestore.**
*   `FIREBASE_SERVICE_ACCOUNT`: The full JSON of your Firebase service account (from Firebase Console > Project Settings > Service Accounts > Generate new private key). Paste as a single-line JSON string. **Required for account anonymization and data export.**
*   `VITE_ADMIN_EMAIL`: Email address that gets admin access (must match the email in `firestore.rules`).
*   `APP_URL`: The final production URL of your Vercel app (e.g., `https://your-app-name.vercel.app`). *Note: You will set this after Vercel generates your URL.*

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

## 4. Configure Admin Email
Admin access is controlled by email address. Make sure `VITE_ADMIN_EMAIL` in Vercel matches the email hardcoded in `firestore.rules`. If you need to change the admin email, update both places.

## 5. Set Up Stripe Webhooks
To ensure payments correctly update student credits and package history:

1. Go to Stripe Dashboard > Developers > Webhooks.
2. Click **Add endpoint**.
3. Set the endpoint URL to `https://your-app-name.vercel.app/api/webhook`.
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**.
6. Copy the **Signing secret** (starts with `whsec_...`) and add it as `STRIPE_WEBHOOK_SECRET` in Vercel.
7. Redeploy your Vercel project so the server picks up the new variable.

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

## 7. Post-Deployment: Update Stripe & APP_URL
Once Vercel finishes deploying, it will give you your live production URL (e.g., `https://my-awesome-app.vercel.app`).

1. **Update Vercel:** Go back to your Vercel Project Settings > Environment Variables. Add or update the `APP_URL` variable to be your exact new Vercel URL (including `https://`, but no trailing slash).
2. **Redeploy:** Go to the "Deployments" tab in Vercel, click the three dots next to your latest deployment, and select **Redeploy** so the server picks up the new `APP_URL`.
3. **Update Stripe Webhooks:** If you set up webhooks in Step 5, ensure the endpoint URL matches your production URL.
4. **Verify Admin Email:** Ensure `VITE_ADMIN_EMAIL` in Vercel matches the email in `firestore.rules`.

Your app is now live, secure, and fully functional!

## Architecture Notes

This app uses **Vercel serverless functions** for all API routes (in the `api/` directory). The `server.ts` file is only used for local development with Vite's middleware mode. All production API traffic goes through Vercel's serverless infrastructure.

Key security features:
- **CORS** restricted to `APP_URL`
- **Input validation** via Zod schemas on all endpoints
- **Error sanitization** — internal errors never leak to clients
- **Stripe webhook signature verification** prevents fake payment events
- **Admin access** controlled via email matching (env var + firestore.rules)
- **Security headers** (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- **Gemini API key** proxied through backend — never exposed to the client
