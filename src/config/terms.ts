export interface PackageDef {
  id: string;
  name: string;
  pricePerLesson: number;
  groupSize: string;
  guitarsProvided: string;
  popular?: boolean;
}

export interface TermPackages {
  [packageId: string]: string; // packageId -> stripePriceId
}

export interface Term {
  id: string;
  name: string;
  dates: string;
  weeks: string;
  lessons: number;
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
      { id: 'standard', name: 'Standard', pricePerLesson: 5.85, groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided' },
      { id: 'sibling', name: 'Sibling', pricePerLesson: 10.85, groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided', popular: true },
      { id: 'premium', name: 'Premium', pricePerLesson: 11.00, groupSize: 'Groups of 2 children', guitarsProvided: 'Guitars provided' },
    ],
    terms: [
      {
        id: 'autumn-1',
        name: 'Autumn 1',
        dates: '7th Sept - 16th Oct',
        weeks: '6 weeks',
        lessons: 6,
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
      { id: 'standard', name: 'Standard', pricePerLesson: 5.85, groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided' },
      { id: 'sibling', name: 'Sibling', pricePerLesson: 10.85, groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided', popular: true },
      { id: 'premium', name: 'Premium', pricePerLesson: 11.00, groupSize: 'Groups of 2 children', guitarsProvided: 'Guitars provided' },
    ],
    terms: [
      {
        id: 'autumn-1',
        name: 'Autumn 1',
        dates: '7th Sept - 23rd Oct',
        weeks: '7 weeks',
        lessons: 7,
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
      { id: 'standard', name: 'Standard', pricePerLesson: 4.875, groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided' },
      { id: 'sibling', name: 'Sibling', pricePerLesson: 9.042, groupSize: 'Groups of 4-6 children', guitarsProvided: 'Guitars provided', popular: true },
      { id: 'premium', name: 'Premium', pricePerLesson: 9.167, groupSize: 'Groups of 2 children', guitarsProvided: 'Guitars provided' },
    ],
    terms: [
      {
        id: 'autumn-1',
        name: 'Autumn 1',
        dates: '24th Aug - 16th Oct',
        weeks: '7 weeks 4 days',
        lessons: 8,
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
        stripePriceIds: {
          standard: 'price_LEIC_SP2_STD',
          sibling: 'price_LEIC_SP2_SIB',
          premium: 'price_LEIC_SP2_PRE',
        },
      },
    ],
  },
];

export function formatPrice(pricePerLesson: number, lessons: number): string {
  const total = pricePerLesson * lessons;
  return `£${total.toFixed(2)}`;
}
