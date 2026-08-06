import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XCircle, ShieldCheck, Music } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

/**
 * Post-checkout cancellation page (/checkout/cancel).
 *
 * Stripe redirects here when someone backs out of the hosted checkout page.
 * Nothing was charged and no session was completed, so this page has no state
 * to fetch — its only job is to say so clearly and offer a way back in.
 */
export function CheckoutCancel() {
  const navigate = useNavigate();

  // Stripe appends ?canceled=true; drop it so a refresh doesn't look like a
  // second failed attempt.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('canceled')) return;
    url.searchParams.delete('canceled');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-stone-50 py-16 px-4">
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-stone-200/60 to-transparent px-8 pt-10 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-200">
              <XCircle className="h-9 w-9 text-stone-600" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">Payment Cancelled</h1>
            <p className="mt-2 text-stone-600">
              Your checkout was cancelled before it completed.
            </p>
          </div>

          <CardContent className="pt-8">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
              <div>
                <p className="font-medium text-green-900">You have not been charged</p>
                <p className="mt-1 text-sm text-green-800">
                  No payment was taken and no lessons have been booked. Your card details were
                  never shared with us — payments are handled entirely by Stripe.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-stone-600">
              Changed your mind, or ran into a problem? You can pick up where you left off.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]"
                onClick={() => navigate('/pricing')}
              >
                Try Again
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>

            <p className="mt-6 text-center text-sm text-stone-500">
              Need a hand? Email{' '}
              <a href="mailto:info@intunetuition.co.uk" className="text-[#7fa663] hover:underline">
                info@intunetuition.co.uk
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-stone-500">
          <Music className="mr-1.5 inline h-4 w-4 text-[#b9d9a1]" aria-hidden="true" />
          <Link to="/dashboard" className="hover:text-stone-800 hover:underline">
            Go to your dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
