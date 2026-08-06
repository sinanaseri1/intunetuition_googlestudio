import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, CheckCircle2, Music, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
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
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Live subscription to the student record, so a purchase confirmed by the
  // Stripe webhook appears in the history below the moment it lands — including
  // while this page is already open. Post-checkout confirmation itself now lives
  // on /checkout/success; this page just needs to stay current.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      doc(db, 'students', user.uid),
      (snapshot) => {
        if (snapshot.exists()) setStudentData(snapshot.data());
      },
      (error) => console.error('Error watching student record:', error)
    );
    return unsubscribe;
  }, [user]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        {/* Left Column: Account actions */}
        <div className="space-y-8">
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

        {/* Right Column: Purchase history */}
        <div className="md:col-span-2 space-y-8">
          <Card id="purchase-history" className="scroll-mt-28">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#b9d9a1]" />
                Purchase History
              </CardTitle>
              <CardDescription>
                {sortedHistory.length > 0
                  ? `${sortedHistory.length} ${sortedHistory.length === 1 ? 'purchase' : 'purchases'} on your account`
                  : 'Your lesson package purchases will appear here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedHistory.length > 0 ? (
                <div className="space-y-4">
                  {sortedHistory.map((entry, index) => {
                    const termInfo = findTermInfo(entry.packageId);
                    return (
                      <div
                        key={entry.sessionId || index}
                        className="rounded-xl border border-stone-200 p-5 transition-colors hover:border-stone-300"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold text-stone-900">
                              {entry.planName || entry.packageId}
                            </div>
                            {termInfo && (
                              <div className="text-sm text-stone-500">
                                {termInfo.termName} &middot; {termInfo.weeks} &middot; {termInfo.dates}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-stone-500">
                              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                              {entry.purchasedAt
                                ? format(new Date(entry.purchasedAt), 'd MMMM yyyy')
                                : 'Date unavailable'}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                            <span className="text-lg font-bold text-stone-900">
                              {entry.amountTotal != null ? formatPrice(entry.amountTotal) : '—'}
                            </span>
                            {/* Entries are only ever written by the Stripe webhook
                                after checkout.session.completed, so anything
                                present here is a settled payment. */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Paid
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-stone-100 pt-3 text-sm">
                          <span className="text-stone-600">
                            <span className="font-medium text-stone-900">{entry.credits ?? '—'}</span> lessons
                          </span>
                          {entry.sessionId && (
                            <span className="font-mono text-xs text-stone-400 break-all">
                              Ref: {entry.sessionId.slice(0, 24)}…
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-stone-500">
                  <Music className="mx-auto mb-3 h-12 w-12 text-stone-300" aria-hidden="true" />
                  <p className="mb-1 font-medium text-stone-700">No purchases yet</p>
                  <p className="mb-5 text-sm">
                    Once you book a lesson package it will show up here with your receipt details.
                  </p>
                  <Button
                    className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]"
                    onClick={() => navigate('/pricing')}
                  >
                    View Packages
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
