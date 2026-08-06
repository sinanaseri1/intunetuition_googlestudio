import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import guitarImage from '../assets/guitarImage.png';
import { useNavigate } from 'react-router-dom';
import { LOCATIONS, formatPrice, isPlaceholderPriceId } from '../config/terms';
import type { Location } from '../config/terms';

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeLocationId, setActiveLocationId] = useState(LOCATIONS[0].id);
  const [activeTermId, setActiveTermId] = useState(LOCATIONS[0].terms[0].id);
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const activeLocation: Location = LOCATIONS.find(l => l.id === activeLocationId)!;
  const activeTerm = activeLocation.terms.find(t => t.id === activeTermId)
    ?? activeLocation.terms[0];

  const handleLocationChange = (locationId: string) => {
    setActiveLocationId(locationId);
    const loc = LOCATIONS.find(l => l.id === locationId)!;
    setActiveTermId(loc.terms[0].id);
  };

  const handleBuy = async (packageId: string) => {
    const stripePriceId = activeTerm.stripePriceIds[packageId];
    if (isPlaceholderPriceId(stripePriceId)) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    const pkg = activeLocation.packages.find(p => p.id === packageId)!;
    setLoading(packageId);
    setCheckoutError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: stripePriceId,
          studentId: user.uid,
          packageId: `${activeLocation.id}-${activeTerm.id}-${packageId}`,
          credits: activeTerm.lessons,
          location: activeLocation.id,
          planName: `${activeLocation.label} - ${activeTerm.name} - ${pkg.name}`,
        }),
      });

      // Read as text first. A crashed serverless function returns Vercel's
      // plain-text error page, not JSON — calling response.json() on that throws
      // "Unexpected token 'A'", which buries the real server error behind a
      // parse failure and makes the fault look like it's in the client.
      const raw = await response.text();

      let data: { url?: string; error?: string } | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        console.error(
          `Checkout failed: server returned non-JSON (HTTP ${response.status}, ` +
          `content-type: ${response.headers.get('content-type') || 'unknown'}).`,
          '\nRaw response:', raw.slice(0, 500)
        );
        throw new Error(
          response.status >= 500
            ? 'The payment service is temporarily unavailable. Please try again shortly.'
            : `Unexpected response from the payment service (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        console.error(`Checkout failed (HTTP ${response.status}):`, data);
        throw new Error(data?.error || `Checkout failed (HTTP ${response.status}).`);
      }

      if (!data?.url) {
        throw new Error(data?.error || 'The payment service did not return a checkout link.');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-24 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-[#b9d9a1]/25 px-4 py-1.5 text-sm font-semibold text-[#4f6b3c]">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">Term Packages</h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Select your location and term below to view available packages. All packages include high-quality acoustic guitar tuition.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white rounded-lg border border-stone-200 p-1">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleLocationChange(loc.id)}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeLocationId === loc.id
                    ? 'bg-[#b9d9a1] text-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg border border-stone-200 p-1">
            {activeLocation.terms.map((term) => (
              <button
                key={term.id}
                onClick={() => setActiveTermId(term.id)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTermId === term.id
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {term.name}
              </button>
            ))}
          </div>
        </div>

        {checkoutError && (
          <div
            role="alert"
            className="mx-auto mb-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800"
          >
            {checkoutError}
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-stone-500">
            <span className="font-medium text-stone-700">{activeTerm.weeks}</span> — {activeTerm.dates}
          </p>
          <p className="text-sm text-stone-400 mt-1">
            {activeTerm.lessons} lessons per term
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center py-8">
          {activeLocation.packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`flex flex-col relative overflow-visible bg-white transition-all duration-200 hover:-translate-y-1 ${
                pkg.popular
                  ? 'border-2 border-[#b9d9a1] shadow-xl shadow-[#b9d9a1]/25 md:scale-105 z-10 hover:shadow-2xl hover:shadow-[#b9d9a1]/30'
                  : 'border-stone-200 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/5'
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
                <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                  {formatPrice(activeTerm.prices[pkg.id])}
                  <span className="ml-1 text-xl font-medium text-stone-500">/term</span>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-stone-700 font-medium">{activeTerm.lessons} lessons per term</p>
                  <p className="text-stone-600">20 min lessons</p>
                  <p className="text-stone-600">{pkg.groupSize}</p>
                  <p className="text-stone-600">{pkg.guitarsProvided}</p>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <img
                  src={guitarImage}
                  alt="Guitar"
                  className="w-full h-48 object-contain"
                />
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-2">
                <Button
                  className={`w-full ${
                    pkg.popular
                      ? 'bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                  onClick={() => handleBuy(pkg.id)}
                  disabled={loading === pkg.id || isPlaceholderPriceId(activeTerm.stripePriceIds[pkg.id])}
                >
                  {loading === pkg.id
                    ? 'Processing...'
                    : isPlaceholderPriceId(activeTerm.stripePriceIds[pkg.id])
                    ? 'Currently Unavailable'
                    : 'Buy Now'}
                </Button>
                {isPlaceholderPriceId(activeTerm.stripePriceIds[pkg.id]) && (
                  <p className="text-xs text-center text-stone-400">
                    Online booking for this package isn't set up yet — please contact us.
                  </p>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
