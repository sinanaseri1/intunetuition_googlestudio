# Deployment Guide (Vercel)

Follow this step-by-step guide to securely deploy your application to Vercel and ensure that all features (including Firebase Authentication and Stripe payments) work correctly in production.

## 1. Pre-Deployment Security Check
Before pushing your code to GitHub, ensure your secrets are safe:
- Make sure `.env` and `firebase-applet-config.json` are in your `.gitignore` file (this has already been done for you).
- **Never** commit your actual `.env` file to your repository.

## 2. Gather Your Environment Variables
You will need to enter these into Vercel. Keep this list handy.

**Secret Backend Keys (Keep these hidden):**
*   `GEMINI_API_KEY`: Your Google Gemini API key (from Google AI Studio).
*   `STRIPE_SECRET_KEY`: Your Stripe secret key (from Stripe Dashboard > Developers > API keys).
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

## 4. Deploying to Vercel
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

## 5. Post-Deployment: Update Stripe & APP_URL
Once Vercel finishes deploying, it will give you your live production URL (e.g., `https://my-awesome-app.vercel.app`).

1. **Update Vercel:** Go back to your Vercel Project Settings > Environment Variables. Add or update the `APP_URL` variable to be your exact new Vercel URL (including `https://`, but no trailing slash).
2. **Redeploy:** Go to the "Deployments" tab in Vercel, click the three dots next to your latest deployment, and select **Redeploy** so the server picks up the new `APP_URL`.
3. **Update Stripe (If using Webhooks):** If you are using Stripe Webhooks, go to the Stripe Dashboard > Developers > Webhooks, and add a new endpoint pointing to `https://your-app-name.vercel.app/api/webhook`.

Your app is now live, secure, and fully functional!
