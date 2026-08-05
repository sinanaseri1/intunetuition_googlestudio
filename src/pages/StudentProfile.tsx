import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

export function StudentProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    childName: '',
    yearGroup: '',
    school: '',
    phone: '',
    gdprConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkProfile() {
      if (!user) return;
      
      try {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (!mounted) return;
        if (studentDoc.exists() && studentDoc.data().childName) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      } finally {
        if (mounted) setChecking(false);
      }
    }
    
    checkProfile();
    return () => { mounted = false; };
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.childName.trim()) {
      setError('Child\'s name is required');
      return;
    }
    if (!formData.yearGroup.trim()) {
      setError('Year group is required');
      return;
    }
    if (!formData.school.trim()) {
      setError('School name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.gdprConsent) {
      setError('You must give consent to proceed');
      return;
    }

    setLoading(true);
    try {
      const studentDocRef = doc(db, 'students', user!.uid);

      // creditsRemaining/packageHistory are only safe to write when creating the
      // document. { merge: true } does NOT protect them — it overwrites — so
      // including them unconditionally wipes out purchased credits and the whole
      // purchase history for anyone who reaches this form after buying (which
      // Dashboard.tsx does automatically whenever childName is missing). Read
      // first and only seed them when there's nothing there yet.
      const existing = await getDoc(studentDocRef);

      await setDoc(studentDocRef, {
        userId: user!.uid,
        childName: formData.childName.trim(),
        yearGroup: formData.yearGroup.trim(),
        school: formData.school.trim(),
        phone: formData.phone.trim(),
        gdprConsentGiven: true,
        gdprConsentDate: new Date().toISOString(),
        gdprConsentVersion: '1.0',
        ...(existing.exists() ? {} : { creditsRemaining: 0, packageHistory: [] }),
      }, { merge: true });

      // Wait for Firestore to propagate the write before navigating
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || 'Failed to save profile. Please try again.');
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
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide the following information to complete your registration. 
            This is required before you can access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="childName">Child's Name *</Label>
              <Input 
                id="childName" 
                type="text" 
                placeholder="Enter your child's full name"
                value={formData.childName}
                onChange={(e) => handleInputChange('childName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearGroup">Year Group *</Label>
              <Input 
                id="yearGroup" 
                type="text" 
                placeholder="e.g., Year 3, Year 4"
                value={formData.yearGroup}
                onChange={(e) => handleInputChange('yearGroup', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">School *</Label>
              <Input 
                id="school" 
                type="text" 
                placeholder="Enter your child's school name"
                value={formData.school}
                onChange={(e) => handleInputChange('school', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Enter your contact number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>

            <div className="flex items-start space-x-3 p-4 bg-stone-50 rounded-lg">
              <Checkbox
                id="gdpr"
                checked={formData.gdprConsent}
                // Must stay a real boolean. Routing this through
                // handleInputChange (which is typed for strings) stored the
                // string 'false' when unchecked — and 'false' is truthy, so the
                // `if (!formData.gdprConsent)` guard below passed and the app
                // recorded gdprConsentGiven: true for someone who had not
                // consented.
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, gdprConsent: checked === true }))
                }
                className="mt-1"
              />
              <Label htmlFor="gdpr" className="text-sm leading-relaxed">
                I give consent for In Tune Tuition to process my child's personal data (name, year group, school, and contact details) as described in the{' '}
                <Link to="/privacy-policy" className="text-[#b9d9a1] hover:underline font-medium" target="_blank">
                  Privacy Policy
                </Link>
                . I understand that I can withdraw this consent at any time by contacting info@intunetuition.co.uk.
              </Label>
            </div>

            {error && (
              <div className="text-sm text-red-500 font-medium p-3 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-stone-900 text-white hover:bg-stone-800 h-12"
              disabled={loading}
            >
              {loading ? 'Saving Profile...' : 'Complete Profile & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
