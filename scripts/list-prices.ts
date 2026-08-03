import 'dotenv/config';
import Stripe from 'stripe';

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('STRIPE_SECRET_KEY is not set in your environment (.env).');
    process.exit(1);
  }

  const stripe = new Stripe(key);

  const prices = await stripe.prices.list({
    limit: 100,
    expand: ['data.product'],
  });

  console.log(`Found ${prices.data.length} prices\n`);

  for (const price of prices.data) {
    const product = price.product as Stripe.Product;
    const metadata = product.metadata && Object.keys(product.metadata).length
      ? ` ${JSON.stringify(product.metadata)}`
      : '';
    console.log(`- ${price.id}`);
    console.log(`    product: ${product.name}${metadata}`);
    console.log(`    amount: ${price.unit_amount ?? '-'} ${price.currency}`);
    console.log(`    active: ${price.active}  type: ${price.type}  recurring: ${price.recurring ? price.recurring.interval : 'n/a'}`);
  }

  console.log('\nMapping of product -> Stripe price id (copy into src/config/terms.ts):\n');

  const mapping: Record<string, string> = {};
  for (const price of prices.data) {
    const product = price.product as Stripe.Product;
    const key = `${product.name} - ${((price.unit_amount ?? 0) / 100).toFixed(2)} ${price.currency.toUpperCase()}`;
    mapping[key] = price.id;
  }
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
