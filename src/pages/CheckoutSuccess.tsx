import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onSnapshot, doc } from 'firebase/firestore';
import { CheckCircle2, Loader2, AlertTriangle, Receipt, Calendar, Music } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { formatPrice } from '../config/terms';

/** How long to wait for the webhook before telling the user it's running late. */
const FULFILMENT_TIMEOUT_MS = 30_000;

interface PurchaseEntry {
  packageId?: string;
  planName?: string;
  location?: string;
  credits?: number;
  purchasedAt?: string;
  sessionId?: string;
  amountTotal?: number | null;
}

/**
 * Post-checkout confirmation page (/checkout/success).
 *
 * Stripe redirects here with the session id. Fulfilment is asynchronous — the
 * webhook credits the account server-side — so this page subscribes to the
 * student document with onSnapshot and updates the instant that write lands,
 * rather than polling or making the user refresh.
 */
export function CheckoutSuccess() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Captured once: the params are stripped from the address bar below, so a
  // refresh or back-navigation can't replay a stale confirmation.
  const [sessionId] = useState(() => new URLSearchParams(window.location.search).get('session_id'));
  const [purchase, setPurchase] = useState<PurchaseEntry | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('session_id') && !url.searchParams.has('success')) return;
    for (const param of ['session_id', 'success', 'subscription_success']) {
      url.searchParams.delete(param);
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    if (!user || !sessionId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'students', user.uid),
      (snapshot) => {
        const history = (snapshot.data()?.packageHistory as PurchaseEntry[]) || [];
        const match = history.find((entry) => entry.sessionId === sessionId);
        if (match) setPurchase(match);
      },
      (error) => console.error('Error watching purchase status:', error)
    );

    const timer = window.setTimeout(() => setTimedOut(true), FULFILMENT_TIMEOUT_MS);
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [user, sessionId]);

  // Someone opened this page directly, without coming back from Stripe.
  if (!sessionId && !authLoading) {
    return (
      <Shell>
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Nothing to confirm here</CardTitle>
            <CardDescription>
              This page shows your confirmation after a purchase. It looks like you arrived directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]" onClick={() => navigate('/pricing')}>
              View Packages
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (purchase) {
    return (
      <Shell>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-[#b9d9a1]/30 to-transparent px-8 pt-10 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#b9d9a1]">
              <CheckCircle2 className="h-9 w-9 text-stone-900" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">Payment Successful</h1>
            <p className="mt-2 text-stone-600">
              Thank you — your lessons are booked and your account has been updated.
            </p>
          </div>

          <CardContent className="pt-8">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Receipt className="h-4 w-4 text-stone-400" aria-hidden="true" />
              Order details
            </h2>

            <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200">
              <Row label="Package" value={purchase.planName || purchase.packageId || '—'} />
              <Row
                label="Lessons"
                value={purchase.credits != null ? `${purchase.credits} lessons` : '—'}
              />
              <Row
                label="Amount paid"
                value={purchase.amountTotal != null ? formatPrice(purchase.amountTotal) : '—'}
              />
              <Row
                label="Date"
                value={
                  purchase.purchasedAt
                    ? format(new Date(purchase.purchasedAt), "d MMMM yyyy 'at' HH:mm")
                    : '—'
                }
              />
              <Row
                label="Status"
                value={
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Confirmed
                  </span>
                }
              />
              {purchase.sessionId && (
                <Row
                  label="Reference"
                  value={<span className="font-mono text-xs break-all">{purchase.sessionId}</span>}
                />
              )}
            </dl>

            <p className="mt-4 text-center text-sm text-stone-500">
              A receipt has been sent to your email address by Stripe.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]"
                onClick={() => navigate('/dashboard#purchase-history')}
              >
                View Purchase History
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // Payment taken, fulfilment not yet observed.
  return (
    <Shell>
      <Card className="text-center">
        <CardContent className="pt-10 pb-8">
          {timedOut ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-stone-900">Still confirming your payment</h1>
              <p className="mx-auto mt-3 max-w-md text-stone-600">
                Your payment went through, but confirmation is taking longer than usual. Your
                lessons will appear in your purchase history shortly — there's no need to pay again.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-stone-500">
                If it hasn't appeared within a few minutes, contact us at{' '}
                <a href="mailto:info@intunetuition.co.uk" className="text-[#7fa663] hover:underline">
                  info@intunetuition.co.uk
                </a>{' '}
                and we'll sort it out.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Loader2 className="h-8 w-8 animate-spin text-stone-500" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-stone-900">Confirming your payment…</h1>
              <p className="mx-auto mt-3 max-w-md text-stone-600">
                Your payment was received. We're just confirming it with our payment provider —
                this usually takes a few seconds. Please don't close this page.
              </p>
            </>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard#purchase-history')}>
              Go to Purchase History
            </Button>
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-stone-50 py-16 px-4">
      <div className="mx-auto max-w-2xl">
        {children}
        <p className="mt-6 text-center text-sm text-stone-500">
          <Music className="mr-1.5 inline h-4 w-4 text-[#b9d9a1]" aria-hidden="true" />
          <Link to="/pricing" className="hover:text-stone-800 hover:underline">
            Browse more lesson packages
          </Link>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-stone-900">{value}</dd>
    </div>
  );
}
