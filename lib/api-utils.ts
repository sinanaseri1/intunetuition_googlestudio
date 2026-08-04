import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyIdToken } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

export function corsHeaders(origin?: string) {
  const allowedOrigin = process.env.APP_URL || '*';
  return {
    'Access-Control-Allow-Origin': origin && (allowedOrigin === '*' || origin === allowedOrigin) ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', corsHeaders(req.headers.origin)['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  const headers = corsHeaders(req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', headers['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', headers['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', headers['Access-Control-Allow-Headers']);
  res.setHeader('Access-Control-Max-Age', headers['Access-Control-Max-Age']);
}

export class AuthError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'AuthError';
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

  const token = authHeader.split(' ')[1];
  try {
    return await verifyIdToken(token);
  } catch {
    throw new AuthError();
  }
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
