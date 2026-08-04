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
          standard: 'price_NOTT_AUT1_STD',
          sibling: 'price_NOTT_AUT1_SIB',
          premium: 'price_NOTT_AUT1_PRE',
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
          standard: 'price_NOTT_AUT2_STD',
          sibling: 'price_NOTT_AUT2_SIB',
          premium: 'price_NOTT_AUT2_PRE',
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
          standard: 'price_NOTT_SP1_STD',
          sibling: 'price_NOTT_SP1_SIB',
          premium: 'price_NOTT_SP1_PRE',
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
          standard: 'price_NOTT_SP2_STD',
          sibling: 'price_NOTT_SP2_SIB',
          premium: 'price_NOTT_SP2_PRE',
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
          standard: 'price_DERB_AUT1_STD',
          sibling: 'price_DERB_AUT1_SIB',
          premium: 'price_DERB_AUT1_PRE',
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
          standard: 'price_DERB_AUT2_STD',
          sibling: 'price_DERB_AUT2_SIB',
          premium: 'price_DERB_AUT2_PRE',
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
          standard: 'price_DERB_SP1_STD',
          sibling: 'price_DERB_SP1_SIB',
          premium: 'price_DERB_SP1_PRE',
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
          standard: 'price_DERB_SP2_STD',
          sibling: 'price_DERB_SP2_SIB',
          premium: 'price_DERB_SP2_PRE',
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
          standard: 'price_LEIC_AUT1_STD',
          sibling: 'price_LEIC_AUT1_SIB',
          premium: 'price_LEIC_AUT1_PRE',
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
          standard: 'price_LEIC_AUT2_STD',
          sibling: 'price_LEIC_AUT2_SIB',
          premium: 'price_LEIC_AUT2_PRE',
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
          standard: 'price_LEIC_SP1_STD',
          sibling: 'price_LEIC_SP1_SIB',
          premium: 'price_LEIC_SP1_PRE',
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
          standard: 'price_LEIC_SP2_STD',
          sibling: 'price_LEIC_SP2_SIB',
          premium: 'price_LEIC_SP2_PRE',
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
