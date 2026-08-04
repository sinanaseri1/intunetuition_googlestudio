import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, CheckCircle2, Music, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LOCATIONS, formatPrice } from '../config/terms';

function findTermInfo(packageId: string) {
  for (const location of LOCATIONS) {
    for (const term of location.terms) {
      if (packageId.startsWith(`${location.id}-${term.id}-`)) {
        return { locationLabel: location.label, termName: term.name, weeks: term.weeks, dates: term.dates };
      }
    }
  }
  return null;
}

export function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentReceived, setPaymentReceived] = useState(false);

  const sessionId = searchParams.get('session_id');
  const subscriptionSuccess = searchParams.get('subscription_success') === 'true';

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const docSnap = await getDoc(doc(db, 'students', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const history: any[] = data.packageHistory || [];
          const found = history.some((h: any) => h.sessionId === sessionId);
          if (found) {
            setStudentData(data);
            setPaymentReceived(true);
            return;
          }
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
      if (!cancelled && attempts < 8) {
        setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [user, sessionId]);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!user || !profile) {
        // Auth state isn't ready yet — wait briefly then check again
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mounted) return;
        // If still not ready, stop loading to avoid infinite spinner
        if (!user || !profile) {
          setLoading(false);
          return;
        }
      }
      
      // Check if student profile is complete. Login.tsx no longer pre-checks this
      // itself (to avoid hanging the login redirect on an extra Firestore read),
      // so this is the actual enforcement point for both onboarding steps —
      // relevant mainly to Google sign-in, which can't collect child details or
      // GDPR consent at account creation the way the email/password form now does.
      if (profile?.role === 'student') {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          if (!data.childName) {
            navigate('/student-profile');
            return;
          }
          if (!data.gdprConsentGiven) {
            navigate('/consent');
            return;
          }
        } else {
          navigate('/student-profile');
          return;
        }
      }
      
      try {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          setStudentData(studentDoc.data());
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [user, profile, navigate]);

  if (loading) {
    return <div className="p-8 text-center">Loading your dashboard...</div>;
  }

  const history: any[] = studentData?.packageHistory || [];
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );
  const latest = sortedHistory[0];
  const latestTermInfo = latest ? findTermInfo(latest.packageId) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {subscriptionSuccess || (sessionId && paymentReceived) ? (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-3 shrink-0" />
          <div>
            <h3 className="text-green-800 font-medium">Payment Successful!</h3>
            <p className="text-green-700 text-sm mt-1">
              Your purchase has been confirmed and your lesson credits have been added.
            </p>
          </div>
        </div>
      ) : (sessionId && !paymentReceived && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 mr-3 shrink-0" />
          <div>
            <h3 className="text-blue-800 font-medium">Confirming your payment…</h3>
            <p className="text-blue-700 text-sm mt-1">
              We're processing your payment. Your credits will appear here shortly.
            </p>
          </div>
        </div>
      ))}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Welcome back, {profile?.name}</h1>
          <p className="text-stone-600 mt-1">Manage your lessons and payments</p>
        </div>
        <Button className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]" onClick={() => navigate('/pricing')}>
          Book a Lesson
        </Button>
      </div>

      {studentData?.childName && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Your child's details on file</CardDescription>
          </CardHeader>
          <CardContent>
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
                <p className="text-sm text-stone-500">Phone</p>
                <p className="font-medium text-stone-900">{studentData.phone}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/edit-profile')}>
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/my-data')}>
              View My Data
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Stats & Packages */}
        <div className="space-y-8">
          <Card className="bg-stone-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-xl">Your Credits</CardTitle>
              <CardDescription className="text-stone-400">Available lesson credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold">{studentData?.creditsRemaining || 0}</span>
                <span className="text-stone-400 font-medium">lessons</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-6 border-stone-700 text-stone-900 hover:bg-stone-100"
                onClick={() => navigate('/pricing')}
              >
                Get a Subscription
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Account Management</CardTitle>
              <CardDescription className="text-stone-500">Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/my-data')}
              >
                View & Export My Data
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/edit-profile')}
              >
                Edit Student Information
              </Button>
              <div className="pt-2 border-t border-stone-700">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => navigate('/delete-account')}
                >
                  Request Account Anonymization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Lessons & Purchases */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#b9d9a1]" />
                Your Lessons
              </CardTitle>
              <CardDescription>Your current term package and remaining lessons</CardDescription>
            </CardHeader>
            <CardContent>
              {latest ? (
                <div className="p-5 rounded-lg border border-stone-200 bg-stone-50">
                  <div className="font-semibold text-stone-900">{latest.planName}</div>
                  {latestTermInfo && (
                    <div className="text-sm text-stone-600 mt-1">
                      {latestTermInfo.termName} &middot; {latestTermInfo.weeks} &middot; {latestTermInfo.dates}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                    <Calendar className="w-4 h-4" />
                    Purchased {format(new Date(latest.purchasedAt), 'MMMM do, yyyy')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                    <div>
                      <div className="text-sm text-stone-500">Lessons Purchased</div>
                      <div className="text-2xl font-bold text-stone-900">{latest.credits}</div>
                    </div>
                    <div>
                      <div className="text-sm text-stone-500">Lessons Remaining</div>
                      <div className="text-2xl font-bold text-stone-900">{studentData?.creditsRemaining || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-stone-500">Amount Paid</div>
                      <div className="text-2xl font-bold text-stone-900">
                        {latest.amountTotal != null ? formatPrice(latest.amountTotal) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-stone-500">
                  <Music className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p className="mb-4">You haven't purchased any lessons yet.</p>
                  <Button className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]" onClick={() => navigate('/pricing')}>
                    View Pricing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>Your previous lesson purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedHistory.length > 0 ? (
                <div className="space-y-4">
                  {sortedHistory.map((entry, index) => {
                    const termInfo = findTermInfo(entry.packageId);
                    return (
                      <div key={entry.sessionId || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-stone-100">
                        <div className="space-y-1">
                          <div className="font-medium text-stone-900">{entry.planName}</div>
                          {termInfo && (
                            <div className="text-sm text-stone-500">
                              {termInfo.termName} &middot; {termInfo.weeks} &middot; {termInfo.dates}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center gap-4 text-sm">
                          <span className="text-stone-500">{format(new Date(entry.purchasedAt), 'MMM do, yyyy')}</span>
                          <span className="text-stone-700 font-medium">{entry.credits} lessons</span>
                          <span className="font-semibold text-stone-900">
                            {entry.amountTotal != null ? formatPrice(entry.amountTotal) : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-stone-500 text-sm">
                  No purchases yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
