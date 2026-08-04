import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, Copy, CheckCircle2, User, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function MyData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exportPayload, setExportPayload] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const profile = exportPayload?.account ?? null;
  const studentData = exportPayload?.student ?? null;
  const bookings: any[] = exportPayload?.bookings ?? [];

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetches from the same /api/export-data endpoint used for the JSON
        // export below, so the page always shows exactly what gets exported
        // (including bookings, which a separate client-side read used to omit).
        const token = await user.getIdToken();
        const response = await fetch('/api/export-data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setExportPayload(await response.json());
        } else {
          console.error('Error fetching user data:', await response.text());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const exportData = () => {
    if (!exportPayload) return;
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intunetuition-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!exportPayload) return;
    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50">
        <p className="text-stone-600">Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Your Personal Data</h1>
          <p className="text-stone-600">
            Under UK GDPR, you have the right to access your personal data. Below is a complete record of all data we hold about you.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#b9d9a1]" />
                Account Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500">Full Name</p>
                  <p className="font-medium text-stone-900">{profile?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Email Address</p>
                  <p className="font-medium text-stone-900 flex items-center gap-1">
                    <Mail className="h-4 w-4 text-stone-400" />
                    {profile?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Account Type</p>
                  <p className="font-medium text-stone-900 capitalize">{profile?.role || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Member Since</p>
                  <p className="font-medium text-stone-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-stone-400" />
                    {profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#b9d9a1]" />
                Student Information
              </CardTitle>
              <CardDescription>Your child's details on file</CardDescription>
            </CardHeader>
            <CardContent>
              {studentData?.childName ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Child's Name</p>
                    <p className="font-medium text-stone-900">{studentData.childName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Year Group</p>
                    <p className="font-medium text-stone-900">{studentData.yearGroup}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">School</p>
                    <p className="font-medium text-stone-900">{studentData.school}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Phone Number</p>
                    <p className="font-medium text-stone-900 flex items-center gap-1">
                      <Phone className="h-4 w-4 text-stone-400" />
                      {studentData.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-stone-500">No student information on file.</p>
              )}
            </CardContent>
            <CardFooter>
              <Link to="/edit-profile">
                <Button variant="outline" size="sm">Edit Student Information</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#b9d9a1]" />
                GDPR Consent Record
              </CardTitle>
              <CardDescription>Your data protection consent status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-stone-500">Consent Status</p>
                  <p className="font-medium text-stone-900">
                    {studentData?.gdprConsentGiven ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Given
                      </span>
                    ) : (
                      <span className="text-red-600">Not Given</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Consent Date</p>
                  <p className="font-medium text-stone-900">
                    {studentData?.gdprConsentDate 
                      ? format(new Date(studentData.gdprConsentDate), 'MMMM d, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Consent Version</p>
                  <p className="font-medium text-stone-900">{studentData?.gdprConsentVersion || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#b9d9a1]" />
                Booking History
              </CardTitle>
              <CardDescription>Lessons you've booked, and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <ul className="divide-y divide-stone-100">
                  {bookings.map((b: any) => (
                    <li key={b.id} className="py-2 flex items-center justify-between text-sm">
                      <span className="text-stone-600">
                        Booked {b.bookedAt ? format(new Date(b.bookedAt), 'MMMM d, yyyy') : 'N/A'}
                      </span>
                      <span className="font-medium text-stone-900 capitalize">{b.status?.replace('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-500">No bookings on file.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                Download a copy of your personal data in JSON format. This includes all data listed above.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-4">
              <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button onClick={exportData} className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d] flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            </CardFooter>
          </Card>

          <div className="text-center">
            <p className="text-sm text-stone-500 mb-4">
              To exercise any of your data protection rights, contact us at{' '}
              <a href="mailto:info@intunetuition.co.uk" className="text-[#b9d9a1] hover:underline">
                info@intunetuition.co.uk
              </a>
            </p>
            <Link to="/dashboard" className="text-[#b9d9a1] hover:underline text-sm">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}