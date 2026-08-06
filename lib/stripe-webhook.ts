import type Stripe from 'stripe';
import { getWebhookSecrets } from './api-utils.js';

/**
 * Verifies a Stripe webhook signature against every configured secret.
 *
 * Running one deployment behind several domains means a separate Stripe
 * webhook endpoint (and therefore a separate signing secret) per domain, so a
 * single-secret check would reject legitimate events from all but one of them.
 * Each candidate is still a full cryptographic verification — this widens which
 * secrets are accepted, never what counts as a valid signature.
 *
 * Throws if no secret is configured, or if none of them verify.
 */
export function constructStripeEvent(
  stripe: Stripe,
  rawBody: string,
  signature: string
): Stripe.Event {
  const secrets = getWebhookSecrets();
  if (secrets.length === 0) {
    throw new Error('No Stripe webhook signing secret configured');
  }

  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
