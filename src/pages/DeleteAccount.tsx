import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

type Mode = 'anonymize' | 'delete';

export function DeleteAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('anonymize');
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!confirmed) {
      setError(
        mode === 'delete'
          ? 'You must confirm you understand your account will be permanently deleted'
          : 'You must confirm you understand the implications of account anonymization'
      );
      return;
    }

    if (!user) {
      setError('You must be logged in to make this request');
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const endpoint = mode === 'delete' ? '/api/delete-account' : '/api/anonymize-account';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } else {
        throw new Error(data.error || `Request failed (HTTP ${response.status})`);
      }
    } catch (err: any) {
      console.error('Error processing account request:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50 py-12 px-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              {mode === 'delete' ? 'Account Deleted' : 'Account Anonymized'}
            </h2>
            <p className="text-stone-600 mb-4">
              {mode === 'delete'
                ? 'Your account and personal data have been permanently removed.'
                : 'Your personal data has been anonymized and can no longer be used to identify you.'}
            </p>
            <p className="text-sm text-stone-500">
              You will be logged out and redirected to the home page…
            </p>
            <p className="mt-4 text-sm text-stone-500">
              If you need written confirmation for your records, email{' '}
              <a href="mailto:info@intunetuition.co.uk" className="text-[#7fa663] hover:underline">
                info@intunetuition.co.uk
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50 py-12 px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-700 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Close Your Account
          </CardTitle>
          <CardDescription>
            Choose how you'd like your data handled. Both options are permanent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-stone-900 mb-2">What would you like to do?</legend>

              {([
                {
                  value: 'anonymize' as Mode,
                  title: 'Anonymize my data (recommended)',
                  body: 'Removes everything that identifies you, but keeps anonymous booking and payment records we are required to retain.',
                },
                {
                  value: 'delete' as Mode,
                  title: 'Permanently delete my account',
                  body: 'Erases your sign-in and all of your records entirely, including bookings and purchase history. Nothing is retained.',
                },
              ]).map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    mode === option.value
                      ? 'border-[#7fa663] bg-[#b9d9a1]/10'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="closure-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => { setMode(option.value); setConfirmed(false); setError(''); }}
                    className="mt-1 h-4 w-4 accent-[#7fa663]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-stone-900">{option.title}</span>
                    <span className="mt-1 block text-sm text-stone-600">{option.body}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {mode === 'delete' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>This cannot be undone.</strong> Your sign-in, profile, bookings and any
                remaining lesson credits will be erased. If you have unused credits, contact us
                before continuing — they cannot be recovered afterwards.
              </div>
            )}

            <div className={mode === 'anonymize' ? 'bg-amber-50 border border-amber-200 rounded-lg p-4' : 'hidden'}>
              <h3 className="font-semibold text-amber-800 mb-3">What happens when your account is anonymized:</h3>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Your name will be replaced with "[DELETED]"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Your email will be changed to an anonymous address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Your child's name, school, and year group will be removed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Your phone number will be removed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>You will be logged out and unable to sign in with this account</span>
                </li>
              </ul>
            </div>

            <div className={mode === 'anonymize' ? 'bg-stone-50 border border-stone-200 rounded-lg p-4' : 'hidden'}>
              <h3 className="font-semibold text-stone-800 mb-3">What will be kept (for our records):</h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>Anonymous booking history (no personal information)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>Anonymized attendance records for lesson planning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>Payment records (for legal/tax purposes)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for leaving (optional)</Label>
              <p className="text-sm text-stone-500">
                Your feedback helps us improve our service. This information is anonymized.
              </p>
              <textarea
                id="reason"
                className="w-full p-3 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#b9d9a1] focus:border-transparent resize-none"
                rows={3}
                placeholder="Tell us why you're leaving (optional)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex items-start space-x-3 p-4 bg-stone-50 rounded-lg">
              <Checkbox 
                id="confirm" 
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="confirm" className="text-sm leading-relaxed">
                {mode === 'delete'
                  ? 'I understand my account and all of my records will be permanently deleted, and that this cannot be undone.'
                  : 'I understand that my personal data will be permanently anonymized and I will lose access to my account. This action cannot be undone.'}
              </Label>
            </div>

            {error && (
              <div className="text-sm text-red-500 font-medium p-3 bg-red-50 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                type="submit" 
                variant="destructive"
                className="flex-1 h-12"
                disabled={loading}
              >
                {loading
                  ? 'Processing…'
                  : mode === 'delete'
                    ? 'Permanently Delete My Account'
                    : 'Anonymize My Account'}
              </Button>
              <Link to="/dashboard" className="flex-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-stone-500">
            Need help? Contact us at{' '}
            <a href="mailto:info@intunetuition.co.uk" className="text-[#b9d9a1] hover:underline">
              info@intunetuition.co.uk
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}