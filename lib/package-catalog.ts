import { LOCATIONS } from './terms.js';

export interface ResolvedPackage {
  packageId: string;
  location: string;
  planName: string;
  credits: number;
}

// Resolves a Stripe price ID back to the package it represents in our own
// catalog. This is the only trustworthy source for what a checkout session
// should credit — the webhook blindly credits whatever ends up in the
// session's metadata, so that metadata must never be built from client-
// supplied packageId/credits/location/planName values (those are easy to
// forge: an authenticated user could pay for the cheapest package while
// claiming an arbitrary credits amount). Returns null for any priceId that
// isn't a real package, which also rejects checkout for unrelated Stripe
// prices that might exist in the same account.
export function resolvePackageByPriceId(priceId: string): ResolvedPackage | null {
  for (const location of LOCATIONS) {
    for (const term of location.terms) {
      for (const [packageKey, id] of Object.entries(term.stripePriceIds)) {
        if (id === priceId) {
          const pkg = location.packages.find((p) => p.id === packageKey);
          return {
            packageId: `${location.id}-${term.id}-${packageKey}`,
            location: location.id,
            planName: `${location.label} - ${term.name} - ${pkg?.name ?? packageKey}`,
            credits: term.lessons,
          };
        }
      }
    }
  }
  return null;
}
