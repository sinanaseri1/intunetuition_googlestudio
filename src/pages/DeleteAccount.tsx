import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export function DeleteAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!confirmed) {
      setError('You must confirm you understand the implications of account anonymization');
      return;
    }

    if (!user) {
      setError('You must be logged in to request account anonymization');
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/anonymize-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.replace('/');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to submit request');
      }
    } catch (err: any) {
      console.error("Error submitting anonymization request:", err);
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
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Request Submitted</h2>
            <p className="text-stone-600 mb-4">
              Your account anonymization request has been received. You'll receive an email 
              at <strong>info@intunetuition.co.uk</strong> with confirmation details.
            </p>
            <p className="text-sm text-stone-500">
              You will be logged out and redirected to the home page...
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
            Request Account Anonymization
          </CardTitle>
          <CardDescription>
            This action will anonymize your personal data while keeping your booking records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
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
                I understand that my personal data will be permanently anonymized and I will 
                lose access to my account. This action cannot be undone.
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
                {loading ? 'Submitting...' : 'Request Account Anonymization'}
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