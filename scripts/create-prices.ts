import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { LOCATIONS } from '../src/config/terms';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TERMS_FILE = path.resolve(__dirname, '../src/config/terms.ts');

function pence(amount: number): number {
  return Math.round(amount * 100);
}

async function ensureProduct(stripe: Stripe, name: string): Promise<Stripe.Product> {
  const existing = await stripe.products.list({ active: true, limit: 100 });
  const found = existing.data.find((p) => p.name === name);
  if (found) {
    return found;
  }
  return stripe.products.create({ name });
}

async function ensurePrice(
  stripe: Stripe,
  productId: string,
  amountPence: number
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const found = prices.data.find((p) => p.unit_amount === amountPence && p.currency === 'gbp');
  if (found) {
    return found;
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

  const stripe = new Stripe(key);
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

        const productName = `${location.label} ${term.name} - ${pkg.name}`;
        const product = await ensureProduct(stripe, productName);
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
  for (const [oldId, newId] of oldToNew) {
    source = source.split(oldId).join(newId);
  }
  fs.writeFileSync(TERMS_FILE, source);

  console.log(`\nUpdated ${oldToNew.length} price ids in ${path.relative(process.cwd(), TERMS_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
