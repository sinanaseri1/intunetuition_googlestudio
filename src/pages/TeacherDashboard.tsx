import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Fetch teacher's lesson slots
        const slotsQuery = query(
          collection(db, 'lessonSlots'),
          where('teacherId', '==', user.uid)
        );
        const slotsSnapshot = await getDocs(slotsQuery);
        const slots = slotsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const now = new Date().toISOString();
        const upcomingSlots = slots.filter((s: any) => s.startTime > now && !s.isCancelled);
        upcomingSlots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

        // For each slot, fetch bookings
        const slotsWithBookings = await Promise.all(upcomingSlots.map(async (slot: any) => {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('lessonSlotId', '==', slot.id),
            where('status', '==', 'booked')
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          
          const bookings = await Promise.all(bookingsSnapshot.docs.map(async (bDoc) => {
            const bData = bDoc.data();
            const studentDoc = await getDoc(doc(db, 'users', bData.studentId));
            return {
              id: bDoc.id,
              ...bData,
              studentName: studentDoc.exists() ? studentDoc.data().name : 'Unknown Student'
            };
          }));
          
          return { ...slot, bookings };
        }));

        setUpcomingLessons(slotsWithBookings);

        // Fetch all students to see active packages
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const usersSnapshot = await getDocs(usersQuery);
        
        const studentsData = await Promise.all(usersSnapshot.docs.map(async (uDoc) => {
          const studentDoc = await getDoc(doc(db, 'students', uDoc.id));
          return {
            id: uDoc.id,
            ...uDoc.data(),
            studentDetails: studentDoc.exists() ? studentDoc.data() : null
          };
        }));
        
        setStudents(studentsData);

      } catch (error) {
        console.error("Error fetching teacher data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const markCompleted = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error marking completed:", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading teacher portal...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Teacher Portal</h1>
        <p className="text-stone-600 mt-1">Manage your schedule and students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Schedule */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>My Schedule</CardTitle>
              <CardDescription>Upcoming lessons and enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingLessons.length > 0 ? (
                <div className="space-y-6">
                  {upcomingLessons.map(slot => (
                    <div key={slot.id} className="p-5 rounded-lg border border-stone-200 bg-white shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-stone-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-semibold text-lg text-stone-900">
                            <Calendar className="w-5 h-5 text-[#b9d9a1]" />
                            {format(new Date(slot.startTime), 'EEEE, MMMM do')}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-stone-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {slot.location}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="mt-2 sm:mt-0 bg-stone-50">
                          {slot.bookings.length} / {slot.maxStudents} Students
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-stone-500 mb-3 uppercase tracking-wider">Enrolled Students</h4>
                        {slot.bookings.length > 0 ? (
                          <ul className="space-y-3">
                            {slot.bookings.map((booking: any) => (
                              <li key={booking.id} className="flex items-center justify-between bg-stone-50 p-3 rounded-md">
                                <span className="font-medium text-stone-900">{booking.studentName}</span>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-[#b9d9a1] border-[#b9d9a1] hover:bg-[#b9d9a1] hover:text-stone-900"
                                  onClick={() => markCompleted(booking.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Mark Completed
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-stone-500 italic">No students booked yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-stone-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p>No upcoming lessons scheduled.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Student Roster */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Roster
              </CardTitle>
              <CardDescription>All registered students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-md border border-stone-100">
                    <div>
                      <div className="font-medium text-stone-900">{student.name}</div>
                      <div className="text-xs text-stone-500">{student.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-stone-900">
                        {student.studentDetails?.creditsRemaining || 0}
                      </div>
                      <div className="text-xs text-stone-500 uppercase">Credits</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
