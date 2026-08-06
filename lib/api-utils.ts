import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { IncomingHttpHeaders } from 'node:http';
import { z } from 'zod';
import { verifyIdToken, getAdminFirestore } from './firebase-admin.js';
import type { DecodedIdToken } from 'firebase-admin/auth';

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Every origin this deployment is allowed to serve, in priority order.
 *
 * Set APP_URLS to a comma-separated list to run the same deployment behind
 * more than one domain (e.g. the Vercel URL plus the custom domain). APP_URL
 * remains supported as the single-origin fallback so existing deployments
 * keep working unchanged.
 */
export function getAllowedOrigins(): string[] {
  const raw = process.env.APP_URLS || process.env.APP_URL || '';
  return raw
    .split(',')
    .map((value) => stripTrailingSlash(value.trim()))
    .filter(Boolean);
}

/**
 * Picks the origin to build absolute URLs with (Stripe success/cancel links).
 *
 * Hardcoding a single APP_URL sends someone who checked out on domain A back
 * to domain B, where they are not signed in. So we echo back the caller's own
 * origin — but only ever one from the allowlist, since these values land in
 * redirect URLs and an unvalidated header would be an open redirect.
 */
export function resolveAppUrl(headers: IncomingHttpHeaders): string {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return '';

  const origin = typeof headers.origin === 'string' ? stripTrailingSlash(headers.origin) : '';
  if (origin && allowed.includes(origin)) return origin;

  // Same-origin requests may omit Origin; fall back to the forwarded host.
  const forwardedHost = headers['x-forwarded-host'] || headers.host;
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  if (host) {
    const forwardedProto = headers['x-forwarded-proto'];
    const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || 'https';
    const candidate = stripTrailingSlash(`${proto}://${host}`);
    if (allowed.includes(candidate)) return candidate;
  }

  return allowed[0];
}

/**
 * Stripe signing secrets to accept. Registering one webhook endpoint per
 * domain in Stripe yields a distinct secret for each, so accept a
 * comma-separated list via STRIPE_WEBHOOK_SECRETS; STRIPE_WEBHOOK_SECRET
 * stays supported for single-endpoint setups.
 */
export function getWebhookSecrets(): string[] {
  const raw = process.env.STRIPE_WEBHOOK_SECRETS || process.env.STRIPE_WEBHOOK_SECRET || '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function corsHeaders(origin?: string) {
  const allowed = getAllowedOrigins();
  const normalized = origin ? stripTrailingSlash(origin) : '';
  const allowOrigin = allowed.length === 0
    ? '*'
    : (normalized && allowed.includes(normalized) ? normalized : allowed[0]);

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(req: VercelRequest, res: VercelResponse) {
  const headers = corsHeaders(req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', headers['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', headers['Access-Control-Allow-Headers']);
  res.setHeader('Access-Control-Max-Age', headers['Access-Control-Max-Age']);
  // The allowed origin now varies per request, so caches must key on it.
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
}

export class AuthError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'AuthError';
  }
}

// Distinct from AuthError so a missing FIREBASE_SERVICE_ACCOUNT (a server
// misconfiguration) surfaces as a 500 instead of masquerading as the client
// having sent a bad/missing token — those look identical from verifyIdToken()
// alone but need very different fixes.
export class ServerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerConfigError';
  }
}

// Authenticated, but not permitted — 403 rather than 401, so the client knows
// re-authenticating won't help.
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

function isStripeMissingPriceError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    (error as { type?: string }).type === 'StripeInvalidRequestError' &&
    (error as { code?: string }).code === 'resource_missing' &&
    typeof (error as { param?: string }).param === 'string' &&
    (error as { param?: string }).param!.includes('price')
  );
}

export function sanitizeError(error: unknown, defaultMsg = 'An internal error occurred') {
  if (error instanceof AuthError) {
    return { status: 401 as const, message: 'Authentication required' };
  }
  if (error instanceof ForbiddenError) {
    return { status: 403 as const, message: error.message };
  }
  if (error instanceof ServerConfigError) {
    console.error('Server configuration error:', error.message);
    return { status: 500 as const, message: 'Server is not fully configured. Please contact the site administrator.' };
  }
  if (error instanceof z.ZodError) {
    return { status: 400 as const, message: error.errors[0]?.message || 'Invalid input' };
  }
  if (isStripeMissingPriceError(error)) {
    console.error('Stripe price lookup failed (likely unsynced price ID):', error);
    return { status: 400 as const, message: 'This package is not currently available for purchase. Please contact us.' };
  }
  console.error('Server error:', error);
  return { status: 500 as const, message: defaultMsg };
}

export function safeJsonResponse(res: VercelResponse, status: number, data: unknown) {
  return res.status(status).json(data);
}

export async function verifyAuthToken(req: VercelRequest): Promise<DecodedIdToken> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError();
  }
  // verifyIdToken() below only needs *a* Firebase Admin app to exist — it can
  // run against a projectId-only app with no service account (see
  // lib/firebase-admin.ts). Only bail early if neither is configured at all.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.VITE_FIREBASE_PROJECT_ID) {
    throw new ServerConfigError('Firebase Admin is not configured: set FIREBASE_SERVICE_ACCOUNT or VITE_FIREBASE_PROJECT_ID');
  }

  const token = authHeader.split(' ')[1];
  try {
    return await verifyIdToken(token);
  } catch {
    throw new AuthError();
  }
}

/**
 * Verifies the caller is signed in AND holds the admin role.
 *
 * Role lives on the Firestore user document (never on the client), so this is
 * the server-side equivalent of firestore.rules' isAdmin(). Any endpoint that
 * exposes data across all users must gate on this, not just verifyAuthToken.
 */
export async function verifyAdminToken(req: VercelRequest): Promise<DecodedIdToken> {
  const decodedToken = await verifyAuthToken(req);
  // Reading another user's document needs real Admin credentials, not the
  // projectId-only app that token verification alone can run on. Say so
  // explicitly rather than surfacing an opaque Firestore credential error.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new ServerConfigError('FIREBASE_SERVICE_ACCOUNT is required for admin operations');
  }
  const userDoc = await getAdminFirestore().collection('users').doc(decodedToken.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  return decodedToken;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const checkoutSchema = z.object({
  priceId: z.string().min(1, 'priceId is required'),
  studentId: z.string().min(1, 'studentId is required'),
  packageId: z.string().optional(),
  credits: z.union([z.string(), z.number()]).optional(),
  location: z.string().optional(),
  planName: z.string().optional(),
});

export const subscriptionSchema = z.object({
  priceId: z.string().min(1, 'priceId is required'),
  studentId: z.string().min(1, 'studentId is required'),
  planName: z.string().optional(),
});

export const anonymizeSchema = z.object({
  reason: z.string().max(1000).optional(),
});
