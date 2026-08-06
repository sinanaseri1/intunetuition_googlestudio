import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { LOCATIONS } from '../lib/terms';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The price IDs this script rewrites in place now live in lib/terms.ts —
// src/config/terms.ts is just a re-export (see that file for why).
const TERMS_FILE = path.resolve(__dirname, '../lib/terms.ts');

function pence(amount: number): number {
  return Math.round(amount * 100);
}

// Stable identifier stored on each Stripe product so re-runs match the product
// they created before, even if the display name changes. Matching on name alone
// breaks the moment a term is renamed (creating silent duplicates) and can
// collide with unrelated products in the same Stripe account.
const CATALOG_KEY = 'ittCatalogKey';

async function loadCatalogProducts(stripe: Stripe): Promise<Map<string, Stripe.Product>> {
  const byKey = new Map<string, Stripe.Product>();
  const byName = new Map<string, Stripe.Product>();

  // autoPagingEach, not list({ limit: 100 }) — a single page silently ignores
  // everything past the first 100 products in the account.
  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    const key = product.metadata?.[CATALOG_KEY];
    if (key && !byKey.has(key)) byKey.set(key, product);
    if (!byName.has(product.name)) byName.set(product.name, product);
  }

  // Adopt products created by earlier runs (which predate the metadata key) by
  // falling back to their name, so this doesn't duplicate the whole catalog.
  for (const [name, product] of byName) {
    const legacyKey = `name:${name}`;
    if (!byKey.has(legacyKey)) byKey.set(legacyKey, product);
  }

  return byKey;
}

async function ensureProduct(
  stripe: Stripe,
  catalogProducts: Map<string, Stripe.Product>,
  catalogKey: string,
  name: string
): Promise<Stripe.Product> {
  const existing = catalogProducts.get(catalogKey) ?? catalogProducts.get(`name:${name}`);
  if (existing) {
    if (existing.metadata?.[CATALOG_KEY] !== catalogKey) {
      // Tag adopted/legacy products so the next run matches by key, not name.
      return stripe.products.update(existing.id, { metadata: { [CATALOG_KEY]: catalogKey } });
    }
    return existing;
  }
  return stripe.products.create({ name, metadata: { [CATALOG_KEY]: catalogKey } });
}

async function ensurePrice(
  stripe: Stripe,
  productId: string,
  amountPence: number
): Promise<Stripe.Price> {
  for await (const price of stripe.prices.list({ product: productId, active: true, limit: 100 })) {
    if (price.unit_amount === amountPence && price.currency === 'gbp' && !price.recurring) {
      return price;
    }
  }
  return stripe.prices.create({
    product: productId,
    unit_amount: amountPence,
    currency: 'gbp',
  });
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('STRIPE_SECRET_KEY is not set in your environment (.env).');
    process.exit(1);
  }

  const isLiveMode = key.startsWith('sk_live_');
  console.log(`Stripe mode: ${isLiveMode ? 'LIVE' : 'TEST'}\n`);

  const stripe = new Stripe(key);
  const catalogProducts = await loadCatalogProducts(stripe);
  const oldToNew: [string, string][] = [];

  for (const location of LOCATIONS) {
    for (const term of location.terms) {
      for (const [packageId, oldPriceId] of Object.entries(term.stripePriceIds)) {
        const pkg = location.packages.find((p) => p.id === packageId);
        if (!pkg) continue;

        const amount = term.prices[packageId];
        if (typeof amount !== 'number') {
          console.error(`Missing price for ${location.label} ${term.name} ${pkg.name}`);
          continue;
        }

        const catalogKey = `${location.id}-${term.id}-${packageId}`;
        const productName = `${location.label} ${term.name} - ${pkg.name}`;
        const product = await ensureProduct(stripe, catalogProducts, catalogKey, productName);
        const price = await ensurePrice(stripe, product.id, pence(amount));

        console.log(`${productName}: £${amount.toFixed(2)} -> ${price.id}`);
        oldToNew.push([oldPriceId, price.id]);
      }
    }
  }

  if (oldToNew.length === 0) {
    console.log('No prices to update.');
    return;
  }

  let source = fs.readFileSync(TERMS_FILE, 'utf8');

  // The rewrite is a literal find/replace, so a price id that appears more than
  // once in terms.ts would have every occurrence rewritten to whichever package
  // was processed last — silently pointing packages at the wrong price. Bail out
  // instead of corrupting the config.
  const duplicates = oldToNew
    .map(([oldId]) => oldId)
    .filter((oldId, index, all) => all.indexOf(oldId) !== index);
  if (duplicates.length > 0) {
    console.error(
      `\nAborting: these price ids appear on more than one package in terms.ts, ` +
        `so they cannot be rewritten unambiguously:\n  ${[...new Set(duplicates)].join('\n  ')}`
    );
    process.exit(1);
  }

  let replaced = 0;
  for (const [oldId, newId] of oldToNew) {
    if (oldId === newId) continue; // already in sync
    if (!source.includes(oldId)) {
      console.warn(`Warning: price id ${oldId} was not found in terms.ts; skipping.`);
      continue;
    }
    source = source.split(oldId).join(newId);
    replaced++;
  }

  fs.writeFileSync(TERMS_FILE, source);

  console.log(
    `\nUpdated ${replaced} price id(s) in ${path.relative(process.cwd(), TERMS_FILE)}` +
      `${replaced === 0 ? ' (already up to date)' : ''}`
  );
  if (isLiveMode) {
    console.log('These are LIVE price ids — commit and redeploy to activate them in production.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
