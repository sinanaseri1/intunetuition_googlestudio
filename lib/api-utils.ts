import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import admin from 'firebase-admin';

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

export function sanitizeError(error: unknown, defaultMsg = 'An internal error occurred') {
  if (error instanceof z.ZodError) {
    return { status: 400 as const, message: error.errors[0]?.message || 'Invalid input' };
  }
  console.error('Server error:', error);
  return { status: 500 as const, message: defaultMsg };
}

export function safeJsonResponse(res: VercelResponse, status: number, data: unknown) {
  return res.status(status).json(data);
}

export async function verifyAuthToken(req: VercelRequest): Promise<admin.auth.DecodedIdToken> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      throw new Error('Firebase service account not configured');
    }
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  }

  return admin.auth().verifyIdToken(token);
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
});

export const subscriptionSchema = z.object({
  priceId: z.string().min(1, 'priceId is required'),
  studentId: z.string().min(1, 'studentId is required'),
  planName: z.string().optional(),
});

export const anonymizeSchema = z.object({
  reason: z.string().max(1000).optional(),
});
