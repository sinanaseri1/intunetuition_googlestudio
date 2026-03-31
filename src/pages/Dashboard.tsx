import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, MapPin, Music, Star, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [studentData, setStudentData] = useState<any>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [pastLessons, setPastLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Fetch student data
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          setStudentData(studentDoc.data());
        }

        // Fetch bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('studentId', '==', user.uid)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookings = await Promise.all(bookingsSnapshot.docs.map(async (bookingDoc) => {
          const bookingData = bookingDoc.data() as any;
          // Fetch associated lesson slot
          const slotDoc = await getDoc(doc(db, 'lessonSlots', bookingData.lessonSlotId));
          const slotData = slotDoc.exists() ? slotDoc.data() : null;
          
          return {
            id: bookingDoc.id,
            ...bookingData,
            slot: slotData
          };
        }));

        const now = new Date().toISOString();
        
        const upcoming = bookings.filter(b => b.slot && b.slot.startTime > now && b.status === 'booked');
        const past = bookings.filter(b => b.slot && b.slot.startTime <= now || b.status !== 'booked');

        // Sort
        upcoming.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
        past.sort((a, b) => b.slot.startTime.localeCompare(a.slot.startTime));

        setUpcomingLessons(upcoming);
        setPastLessons(past);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center">Loading your dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {searchParams.get('subscription_success') === 'true' && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-3 shrink-0" />
          <div>
            <h3 className="text-green-800 font-medium">Subscription Successful!</h3>
            <p className="text-green-700 text-sm mt-1">
              Welcome to your new learning path. Your account has been updated and you can now start booking your lessons.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Welcome back, {profile?.name}</h1>
          <p className="text-stone-600 mt-1">Manage your lessons and bookings</p>
        </div>
        <Button className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]">
          Book a Lesson
        </Button>
      </div>

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
        </div>

        {/* Right Column: Schedule */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingLessons.length > 0 ? (
                <div className="space-y-4">
                  {upcomingLessons.map(lesson => (
                    <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-stone-200 bg-stone-50">
                      <div className="space-y-1 mb-4 sm:mb-0">
                        <div className="flex items-center gap-2 font-medium text-stone-900">
                          <Calendar className="w-4 h-4 text-[#b9d9a1]" />
                          {format(new Date(lesson.slot.startTime), 'EEEE, MMMM do, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Clock className="w-4 h-4" />
                          {format(new Date(lesson.slot.startTime), 'h:mm a')} - {format(new Date(lesson.slot.endTime), 'h:mm a')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <MapPin className="w-4 h-4" />
                          {lesson.slot.location}
                        </div>
                      </div>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <Music className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p>No upcoming lessons scheduled.</p>
                  <Button variant="link" className="text-[#b9d9a1] hover:text-[#a5c58d] mt-2">
                    Book your first lesson
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Past Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {pastLessons.length > 0 ? (
                <div className="space-y-4">
                  {pastLessons.map(lesson => (
                    <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-stone-100">
                      <div className="space-y-1">
                        <div className="font-medium text-stone-900">
                          {format(new Date(lesson.slot.startTime), 'MMM do, yyyy')}
                        </div>
                        <div className="text-sm text-stone-500">
                          {format(new Date(lesson.slot.startTime), 'h:mm a')}
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center gap-2">
                        <Badge variant={lesson.status === 'completed' ? 'default' : 'secondary'} 
                               className={lesson.status === 'completed' ? 'bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]' : ''}>
                          {lesson.status}
                        </Badge>
                        {lesson.status === 'completed' && !lesson.feedbackRating && (
                          <Button size="sm" variant="ghost" className="text-stone-600">
                            <Star className="w-4 h-4 mr-1" /> Rate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-stone-500 text-sm">
                  No past lessons yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
