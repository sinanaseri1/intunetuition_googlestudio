import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { handleCors, sanitizeError, safeJsonResponse, requireEnv, verifyAuthToken } from '../lib/api-utils.js';

const geminiSchema = {
  type: 'object' as const,
  properties: {
    prompt: { type: 'string' as const },
    model: { type: 'string' as const },
  },
  required: ['prompt'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Unauthenticated callers could otherwise burn the project's Gemini quota
    // for free — this endpoint is currently unused by the client, but lock it
    // down rather than leave a live, unmetered proxy to a paid API sitting
    // exposed at a guessable URL.
    await verifyAuthToken(req);

    const apiKey = requireEnv('GEMINI_API_KEY');
    const ai = new GoogleGenAI({ apiKey });

    const body = req.body;
    if (!body || typeof body !== 'object' || !body.prompt || typeof body.prompt !== 'string') {
      return safeJsonResponse(res, 400, { error: 'Invalid request: prompt is required' });
    }

    const modelName = (typeof body.model === 'string' && body.model) || 'gemini-2.0-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: body.prompt,
    });

    return safeJsonResponse(res, 200, {
      text: response.text,
    });
  } catch (error) {
    const { status, message } = sanitizeError(error, 'AI request failed');
    return safeJsonResponse(res, status, { error: message });
  }
}
