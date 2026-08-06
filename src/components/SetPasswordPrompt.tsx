import { useState } from 'react';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { KeyRound, CheckCircle2 } from 'lucide-react';

/**
 * One-time migration nudge for accounts that signed up via Google and have no
 * password credential — shown after removing Google Sign-In so those accounts
 * aren't locked out on their next sign-in.
 *
 * Uses linkWithCredential to add a password credential to the EXISTING
 * account (same uid, same Firestore data) rather than creating a new one.
 * Verified against a scratch test account before shipping: same uid before
 * and after linking, and a fresh sign-in with only the new password reaches
 * the same account with its existing data intact.
 *
 * Self-retiring: once linked, this account's providerData includes
 * 'password' on every future sign-in, so the prompt never renders again for
 * that user without any cleanup step required here.
 */
export function SetPasswordPrompt() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [linkedThisSession, setLinkedThisSession] = useState(false);

  if (!user) return null;

  // linkedThisSession must be checked BEFORE hasPasswordProvider: once linking
  // succeeds, user.providerData can already reflect the new 'password' entry
  // (it's the same mutable FirebaseUser object Firebase updates in place), so
  // checking provider state first made the confirmation banner never render —
  // the prompt just silently vanished with no feedback that it had worked.
  if (linkedThisSession) {
    return (
      <div className="border-b border-green-200 bg-green-50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Password set — you can now sign in with your email and password.
        </div>
      </div>
    );
  }

  if (user.providerData.some((p) => p.providerId === 'password')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await linkWithCredential(user, EmailAuthProvider.credential(user.email!, password));
      setLinkedThisSession(true);
    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(
        err.code === 'auth/requires-recent-login'
          ? 'For security, please sign out and back in with Google, then try again.'
          : err.message || 'Failed to set password. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Not dismissible: Google sign-in is being removed, so anyone who skips
    // this and later signs out has no way back in without an admin resetting
    // their account manually. It disappears on its own once linked.
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-4">
      <div className="mx-auto max-w-7xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="flex items-start gap-2 sm:max-w-xs">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Set a password for {user.email}</p>
              <p className="text-amber-800">
                We're moving to email &amp; password sign-in only. Set a password now so you don't get
                locked out next time you sign in.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="set-password" className="sr-only">New password</Label>
            <Input
              id="set-password"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="w-full sm:w-44 bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-set-password" className="sr-only">Confirm password</Label>
            <Input
              id="confirm-set-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
              className="w-full sm:w-44 bg-white"
            />
          </div>
          <Button type="submit" disabled={submitting} className="bg-stone-900 text-white hover:bg-stone-800">
            {submitting ? 'Setting…' : 'Set Password'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
