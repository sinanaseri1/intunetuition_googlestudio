// Re-exports the term/pricing catalog from lib/terms.ts.
//
// The canonical data lives in lib/, not here, so that api/create-checkout-session.ts
// (via lib/package-catalog.ts) never has to reach across the api/lib <-> src
// boundary to resolve a Stripe price ID to a package. That cross-boundary import
// is exactly what crashed the live checkout endpoint on Vercel with
// FUNCTION_INVOCATION_FAILED — everything api/ depends on now stays inside lib/,
// which is already known to bundle correctly for serverless functions.
//
// This file exists purely so the many existing frontend imports
// (`from '../config/terms'` in Pricing.tsx, Dashboard.tsx, AdminDashboard.tsx)
// keep working unchanged.
export * from '../../lib/terms';
