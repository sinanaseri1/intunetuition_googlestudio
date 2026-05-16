import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    childName: '',
    yearGroup: '',
    school: '',
    phone: '',
    gdprConsent: false
  });
  const [originalData, setOriginalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          setOriginalData(data);
          setFormData({
            childName: data.childName || '',
            yearGroup: data.yearGroup || '',
            school: data.school || '',
            phone: data.phone || '',
            gdprConsent: data.gdprConsentGiven || false
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return (
      formData.childName !== (originalData.childName || '') ||
      formData.yearGroup !== (originalData.yearGroup || '') ||
      formData.school !== (originalData.school || '') ||
      formData.phone !== (originalData.phone || '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.childName.trim()) {
      setError("Child's name is required");
      return;
    }
    if (!formData.yearGroup.trim()) {
      setError("Year group is required");
      return;
    }
    if (!formData.school.trim()) {
      setError("School name is required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'students', user!.uid), {
        childName: formData.childName.trim(),
        yearGroup: formData.yearGroup.trim(),
        school: formData.school.trim(),
        phone: formData.phone.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      window.location.replace('/dashboard');
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          <CardTitle className="text-2xl">Edit Student Information</CardTitle>
          <CardDescription>
            Update your child's details below. Changes will be saved immediately.
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

            {error && (
              <div className="text-sm text-red-500 font-medium p-3 bg-red-50 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 font-medium p-3 bg-green-50 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Profile updated successfully!
              </div>
            )}

            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1 bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d] h-12"
                disabled={saving || (!hasChanges() && !error)}
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
            Need to update your consent?{' '}
            <Link to="/privacy-policy" className="text-[#b9d9a1] hover:underline">
              View Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}