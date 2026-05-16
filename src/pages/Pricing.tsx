import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type LocationId = 'nottingham-derby' | 'leicester';

interface Package {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  priceId: string;
  credits: number;
}

const LOCATION_DATA: Record<LocationId, { label: string; dates: string; weeks: string; packages: Package[] }> = {
  'nottingham-derby': {
    label: 'Nottingham & Derby',
    dates: 'June 1st - July 24th',
    weeks: '7 weeks',
    packages: [
      {
        id: 'standard',
        name: 'Standard',
        price: '£40.95',
        description: '6 lessons - Groups of 4-6 children',
        features: [
          '6 lessons per term',
          'Groups of 4-6 children',
          'Access to basic sheet music',
          'Email support',
        ],
        popular: false,
        priceId: 'price_1TXj8jDEUlJgtpZgNDKXHama',
        credits: 6,
      },
      {
        id: 'sibling',
        name: 'Sibling',
        price: '£75.95',
        description: '12 lessons - Groups of 4-6 children',
        features: [
          '12 lessons per term',
          'Groups of 4-6 children',
          'Sibling sign up',
          'Access to all sheet music & tabs',
          'Priority booking',
        ],
        popular: true,
        priceId: 'price_1TXjCqDEUlJgtpZg4wTVeXWo',
        credits: 12,
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '£77.00',
        description: '6 lessons - Groups of only 2 children',
        features: [
          '6 lessons per term',
          'Groups of only 2 children',
          'Full library access',
          'Direct messaging with teacher',
          'Monthly progress review',
        ],
        popular: false,
        priceId: 'price_1TXjD7DEUlJgtpZgoLdKoJfw',
        credits: 6,
      },
    ],
  },
  leicester: {
    label: 'Leicester',
    dates: 'June 1st - July 10th',
    weeks: '5 weeks',
    packages: [
      {
        id: 'standard',
        name: 'Standard',
        price: '£29.25',
        description: '6 lessons - Groups of 4-6 children',
        features: [
          '6 lessons per term',
          'Groups of 4-6 children',
          'Access to basic sheet music',
          'Email support',
        ],
        popular: false,
        priceId: 'price_1TXjDSDEUlJgtpZgVOtCZzbR',
        credits: 6,
      },
      {
        id: 'sibling',
        name: 'Sibling',
        price: '£54.25',
        description: '12 lessons - Groups of 4-6 children',
        features: [
          '12 lessons per term',
          'Groups of 4-6 children',
          'Sibling sign up',
          'Access to all sheet music & tabs',
          'Priority booking',
        ],
        popular: true,
        priceId: 'price_1TXjF8DEUlJgtpZge3QFhAfT',
        credits: 12,
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '£55.00',
        description: '6 lessons - Groups of only 2 children',
        features: [
          '6 lessons per term',
          'Groups of only 2 children',
          'Full library access',
          'Direct messaging with teacher',
          'Monthly progress review',
        ],
        popular: false,
        priceId: 'price_1TXjFKDEUlJgtpZgndgUJLFC',
        credits: 6,
      },
    ],
  },
};

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeLocation, setActiveLocation] = useState<LocationId>('nottingham-derby');
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (pkg: Package) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(pkg.id);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: pkg.priceId,
          studentId: user.uid,
          packageId: `${activeLocation}-${pkg.id}`,
          credits: pkg.credits,
          location: activeLocation,
          planName: `${LOCATION_DATA[activeLocation].label} - ${pkg.name}`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const location = LOCATION_DATA[activeLocation];

  return (
    <div className="py-24 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Summer Term 2 Packages</h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Select your location below to view available packages. All packages include high-quality acoustic guitar tuition.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-lg border border-stone-200 p-1">
            {(Object.keys(LOCATION_DATA) as LocationId[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveLocation(key)}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeLocation === key
                    ? 'bg-[#b9d9a1] text-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {LOCATION_DATA[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-stone-500">
            <span className="font-medium text-stone-700">{location.weeks}</span> — {location.dates}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center py-8">
          {location.packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`flex flex-col relative overflow-visible bg-white ${
                pkg.popular
                  ? 'border-2 border-[#b9d9a1] shadow-xl shadow-[#b9d9a1]/20 md:scale-105 z-10'
                  : 'border-stone-200'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center">
                  <span className="bg-[#b9d9a1] text-stone-900 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className={pkg.popular ? 'pt-8' : ''}>
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{pkg.description}</CardDescription>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                  {pkg.price}
                  <span className="ml-1 text-xl font-medium text-stone-500">/term</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#b9d9a1] shrink-0 mr-2" />
                      <span className="text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                  onClick={() => handleBuy(pkg)}
                  disabled={loading === pkg.id}
                >
                  {loading === pkg.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
