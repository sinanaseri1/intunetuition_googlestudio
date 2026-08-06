export interface PackageDef {
  id: string;
  name: string;
  groupSize: string;
  guitarsProvided: string;
  popular?: boolean;
}

export interface TermPackages {
  [packageId: string]: string; // packageId -> stripePriceId
}

export interface TermPrices {
  [packageId: string]: number; // packageId -> total price for the term (GBP)
}

export interface Term {
  id: string;
  name: string;
  dates: string;
  weeks: string;
  lessons: number;
  prices: TermPrices;
  stripePriceIds: TermPackages;
}

export interface Location {
  id: string;
  label: string;
  packages: PackageDef[];
  terms: Term[];
}

export const LOCATIONS: Location[] = [
  {
    id: 'nottingham',
    label: 'Nottingham',
    packages: [
      { id: 'standard', name: 'Standard', groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided' },
      { id: 'sibling', name: 'Sibling', groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided', popular: true },
      { id: 'premium', name: 'Premium', groupSize: 'Groups of 2 children', guitarsProvided: 'Guitars provided' },
    ],
    terms: [
      {
        id: 'autumn-1',
        name: 'Autumn 1',
        dates: '7th Sept - 16th Oct',
        weeks: '6 weeks',
        lessons: 6,
        prices: {
          standard: 35.1,
          sibling: 65.1,
          premium: 66.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlUCBRNABHb9bnlJD4O1e',
          sibling: 'price_1U1SlVCBRNABHb9bmDWWgCoR',
          premium: 'price_1U1SlVCBRNABHb9b0RXhe2QE',
        },
      },
      {
        id: 'autumn-2',
        name: 'Autumn 2',
        dates: '2nd Nov - 18th Dec',
        weeks: '7 weeks',
        lessons: 7,
        prices: {
          standard: 40.95,
          sibling: 75.95,
          premium: 77.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlWCBRNABHb9b6IeyfZaQ',
          sibling: 'price_1U1SlXCBRNABHb9bZ8dZZUxR',
          premium: 'price_1U1SlXCBRNABHb9buIkGwghl',
        },
      },
      {
        id: 'spring-1',
        name: 'Spring 1',
        dates: '4th Jan - 12th Feb',
        weeks: '6 weeks',
        lessons: 6,
        prices: {
          standard: 35.1,
          sibling: 65.1,
          premium: 66.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlYCBRNABHb9bHZYf9Rqa',
          sibling: 'price_1U1SlYCBRNABHb9biCKiABxo',
          premium: 'price_1U1SlZCBRNABHb9bgVZsVRV9',
        },
      },
      {
        id: 'spring-2',
        name: 'Spring 2',
        dates: '22nd Feb - 26th Mar',
        weeks: '5 weeks',
        lessons: 5,
        prices: {
          standard: 29.25,
          sibling: 54.25,
          premium: 55.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlaCBRNABHb9b7IE8rppL',
          sibling: 'price_1U1SlaCBRNABHb9bFwyRzwAz',
          premium: 'price_1U1SlbCBRNABHb9bWNXVtRRb',
        },
      },
    ],
  },
  {
    id: 'derby',
    label: 'Derby',
    packages: [
      { id: 'standard', name: 'Standard', groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided' },
      { id: 'sibling', name: 'Sibling', groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided', popular: true },
      { id: 'premium', name: 'Premium', groupSize: 'Groups of 2 children', guitarsProvided: 'Guitars provided' },
    ],
    terms: [
      {
        id: 'autumn-1',
        name: 'Autumn 1',
        dates: '7th Sept - 23rd Oct',
        weeks: '7 weeks',
        lessons: 7,
        prices: {
          standard: 40.95,
          sibling: 75.95,
          premium: 77.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlbCBRNABHb9bU8Z19uPu',
          sibling: 'price_1U1SlcCBRNABHb9bJivHjKfC',
          premium: 'price_1U1SldCBRNABHb9bSIXFS1XI',
        },
      },
      {
        id: 'autumn-2',
        name: 'Autumn 2',
        dates: '2nd Nov - 18th Dec',
        weeks: '7 weeks',
        lessons: 7,
        prices: {
          standard: 40.95,
          sibling: 75.95,
          premium: 77.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SldCBRNABHb9bi8tYNgk6',
          sibling: 'price_1U1SleCBRNABHb9bZUgneNoC',
          premium: 'price_1U1SlfCBRNABHb9bvA4a3i0k',
        },
      },
      {
        id: 'spring-1',
        name: 'Spring 1',
        dates: '4th Jan - 12th Feb',
        weeks: '6 weeks',
        lessons: 6,
        prices: {
          standard: 35.1,
          sibling: 65.1,
          premium: 66.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlfCBRNABHb9bNGxYtjPa',
          sibling: 'price_1U1SlgCBRNABHb9bguZsqEiJ',
          premium: 'price_1U1SlgCBRNABHb9bdwBAdpws',
        },
      },
      {
        id: 'spring-2',
        name: 'Spring 2',
        dates: '22nd Feb - 26th Mar',
        weeks: '5 weeks',
        lessons: 5,
        prices: {
          standard: 29.25,
          sibling: 54.25,
          premium: 55.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlhCBRNABHb9buS8GL5vg',
          sibling: 'price_1U1SliCBRNABHb9bFtDryyTG',
          premium: 'price_1U1SliCBRNABHb9bL3yohfUD',
        },
      },
    ],
  },
  {
    id: 'leicester',
    label: 'Leicester',
    packages: [
      { id: 'standard', name: 'Standard', groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided' },
      { id: 'sibling', name: 'Sibling', groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided', popular: true },
      { id: 'premium', name: 'Premium', groupSize: 'Groups of 2 children', guitarsProvided: 'Guitars provided' },
    ],
    terms: [
      {
        id: 'autumn-1',
        name: 'Autumn 1',
        dates: '24th Aug - 16th Oct',
        weeks: '7 weeks',
        lessons: 7,
        prices: {
          standard: 40.95,
          sibling: 75.75,
          premium: 77.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SljCBRNABHb9b2ZOTyLqv',
          sibling: 'price_1U1SljCBRNABHb9bYo43vlp4',
          premium: 'price_1U1SlkCBRNABHb9bXwEfDQJJ',
        },
      },
      {
        id: 'autumn-2',
        name: 'Autumn 2',
        dates: '26th Oct - 18th Dec',
        weeks: '8 weeks',
        lessons: 8,
        prices: {
          standard: 46.8,
          sibling: 86.8,
          premium: 88.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SllCBRNABHb9bBYzQZx3I',
          sibling: 'price_1U1SllCBRNABHb9bj17t5Rdp',
          premium: 'price_1U1SlmCBRNABHb9bD0ScZXkN',
        },
      },
      {
        id: 'spring-1',
        name: 'Spring 1',
        dates: '4th Jan - 12th Feb',
        weeks: '6 weeks',
        lessons: 6,
        prices: {
          standard: 35.1,
          sibling: 65.1,
          premium: 66.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SlnCBRNABHb9biPMqf4Hn',
          sibling: 'price_1U1SlnCBRNABHb9bVmC06TVw',
          premium: 'price_1U1SloCBRNABHb9bb0BkfqKV',
        },
      },
      {
        id: 'spring-2',
        name: 'Spring 2',
        dates: '22nd Feb - 19th Mar',
        weeks: '4 weeks',
        lessons: 4,
        prices: {
          standard: 23.4,
          sibling: 43.4,
          premium: 44.0,
        },
        stripePriceIds: {
          standard: 'price_1U1SloCBRNABHb9bLDgM43Yv',
          sibling: 'price_1U1SlpCBRNABHb9bbw3rOtEn',
          premium: 'price_1U1SlqCBRNABHb9blaHa0X1R',
        },
      },
    ],
  },
];

export function formatPrice(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

// The IDs baked into LOCATIONS above are placeholders until `npm run prices:create`
// is run against a real Stripe account (it rewrites this file in place with the
// live/test price IDs it creates). Anything still matching this shape hasn't been
// synced yet, so checkout should be disabled rather than sent to Stripe.
const PLACEHOLDER_PRICE_ID_PATTERN = /^price_(NOTT|DERB|LEIC)_/;

export function isPlaceholderPriceId(priceId: string | undefined | null): boolean {
  return !priceId || PLACEHOLDER_PRICE_ID_PATTERN.test(priceId);
}
