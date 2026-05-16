import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function ConsentFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkConsent() {
      if (!user) return;
      
      try {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (!mounted) return;
        if (studentDoc.exists() && studentDoc.data().gdprConsentGiven) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.error("Error checking consent:", err);
      } finally {
        if (mounted) setChecking(false);
      }
    }
    
    checkConsent();
    return () => { mounted = false; };
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consentGiven) {
      setError('You must give consent to continue using the service');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'students', user!.uid), {
        gdprConsentGiven: true,
        gdprConsentDate: new Date().toISOString(),
        gdprConsentVersion: '1.0'
      }, { merge: true });
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error saving consent:", err);
      setError(err.message || 'Failed to save consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50 py-12 px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Update Your Privacy Preferences</CardTitle>
          <CardDescription>
            We need your consent to continue storing your personal data under UK GDPR regulations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              <h3 className="font-semibold text-stone-900 mb-3">Data We Collect</h3>
              <p className="text-sm text-stone-600 mb-4">
                To provide guitar lessons for your child, we collect and store the following information:
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span><strong>Parent/Guardian:</strong> Your name, email address</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span><strong>Student:</strong> Your child's name, year group, school</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span><strong>Contact:</strong> Phone number for lesson communication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span><strong>Usage:</strong> Booking history and lesson attendance</span>
                </li>
              </ul>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
              <h3 className="font-semibold text-stone-900 mb-3">Your Rights</h3>
              <p className="text-sm text-stone-600 mb-3">
                Under UK GDPR, you have the right to:
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span>Access a copy of all data we hold about you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span>Request correction of inaccurate data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span>Request deletion (anonymization) of your data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b9d9a1] mt-0.5">•</span>
                  <span>Withdraw consent at any time</span>
                </li>
              </ul>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-[#b9d9a1]/10 border border-[#b9d9a1]/20 rounded-lg">
              <Checkbox 
                id="consent" 
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed">
                I have read and understood the{' '}
                <Link to="/privacy-policy" className="text-[#b9d9a1] hover:underline font-medium" target="_blank">
                  Privacy Policy
                </Link>
                {' '}and give consent for In Tune Tuition to process my personal data and my child's 
                personal data as described. I understand I can withdraw this consent at any time by 
                contacting <a href="mailto:info@intunetuition.co.uk" className="text-[#b9d9a1] hover:underline">info@intunetuition.co.uk</a>.
              </Label>
            </div>

            {error && (
              <div className="text-sm text-red-500 font-medium p-3 bg-red-50 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d] h-12"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Accept & Continue'}
            </Button>

            <div className="text-center">
              <Link to="/delete-account" className="text-sm text-stone-500 hover:text-stone-700">
                Decline & Delete My Account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}