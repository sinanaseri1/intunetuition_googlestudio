import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Users, BookOpen, Calendar, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function AdminDashboard() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newPackage, setNewPackage] = useState({ name: '', priceGbp: 0, lessons: 0, groupSize: '', description: '', isActive: true });
  const [newSlot, setNewSlot] = useState({ startTime: '', endTime: '', teacherId: '', location: '', maxStudents: 6 });

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    try {
      // Fetch packages
      const pkgsSnapshot = await getDocs(collection(db, 'packages'));
      setPackages(pkgsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsersData = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(allUsersData);
      
      const st = allUsersData.filter((u: any) => u.role === 'student');
      const te = allUsersData.filter((u: any) => u.role === 'teacher');
      
      // Fetch student details
      const studentsWithDetails = await Promise.all(st.map(async (s: any) => {
        const sDoc = await getDocs(query(collection(db, 'students')));
        const sData = sDoc.docs.find(d => d.id === s.id)?.data();
        return { ...s, details: sData };
      }));
      setStudents(studentsWithDetails);
      setTeachers(te);

      // Fetch slots
      const slotsSnapshot = await getDocs(collection(db, 'lessonSlots'));
      setSlots(slotsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        role: newRole, 
        updatedAt: new Date().toISOString() 
      });
      
      // If changing to teacher, ensure they have a teacher record
      if (newRole === 'teacher') {
        const teacherDoc = await getDocs(query(collection(db, 'teachers')));
        const exists = teacherDoc.docs.some(d => d.id === userId);
        if (!exists) {
          await setDoc(doc(db, 'teachers', userId), {
            userId: userId,
            bio: '',
            instrumentSpecialties: []
          });
        }
      }
      
      fetchData();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update role. Check console for details.");
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'packages'), {
        ...newPackage,
        priceGbp: Number(newPackage.priceGbp),
        lessons: Number(newPackage.lessons),
        createdAt: new Date().toISOString()
      });
      setNewPackage({ name: '', priceGbp: 0, lessons: 0, groupSize: '', description: '', isActive: true });
      fetchData();
    } catch (error) {
      console.error("Error creating package:", error);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'lessonSlots'), {
        ...newSlot,
        startTime: new Date(newSlot.startTime).toISOString(),
        endTime: new Date(newSlot.endTime).toISOString(),
        maxStudents: Number(newSlot.maxStudents),
        isCancelled: false,
        createdAt: new Date().toISOString()
      });
      setNewSlot({ startTime: '', endTime: '', teacherId: '', location: '', maxStudents: 6 });
      fetchData();
    } catch (error) {
      console.error("Error creating slot:", error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading admin portal...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Admin Dashboard</h1>
        <p className="text-stone-600 mt-1">Manage platform settings, users, and schedules</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-stone-100 p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="packages" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Packages</TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Schedule</TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Students</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Users & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-500">Total Students</CardTitle>
                <Users className="w-4 h-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{students.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-500">Active Packages</CardTitle>
                <BookOpen className="w-4 h-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{packages.filter(p => p.isActive).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-500">Upcoming Slots</CardTitle>
                <Calendar className="w-4 h-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{slots.filter(s => new Date(s.startTime) > new Date()).length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Packages</CardTitle>
                  <CardDescription>Manage available packages for purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price (£)</TableHead>
                        <TableHead>Lessons</TableHead>
                        <TableHead>Group Size</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map(pkg => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell>£{pkg.priceGbp}</TableCell>
                          <TableCell>{pkg.lessons}</TableCell>
                          <TableCell>{pkg.groupSize}</TableCell>
                          <TableCell>{pkg.isActive ? 'Active' : 'Inactive'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Add New Package</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePackage} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Package Name</Label>
                      <Input id="name" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (£)</Label>
                        <Input id="price" type="number" value={newPackage.priceGbp} onChange={e => setNewPackage({...newPackage, priceGbp: Number(e.target.value)})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lessons">Credits</Label>
                        <Input id="lessons" type="number" value={newPackage.lessons} onChange={e => setNewPackage({...newPackage, lessons: Number(e.target.value)})} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupSize">Group Size</Label>
                      <Input id="groupSize" placeholder="e.g. 4-6 children" value={newPackage.groupSize} onChange={e => setNewPackage({...newPackage, groupSize: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Input id="desc" value={newPackage.description} onChange={e => setNewPackage({...newPackage, description: e.target.value})} required />
                    </div>
                    <Button type="submit" className="w-full bg-stone-900 text-white hover:bg-stone-800">
                      <Plus className="w-4 h-4 mr-2" /> Add Package
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Slots</CardTitle>
                  <CardDescription>Manage the school schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Capacity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map(slot => (
                        <TableRow key={slot.id}>
                          <TableCell>
                            <div className="font-medium">{format(new Date(slot.startTime), 'MMM do, yyyy')}</div>
                            <div className="text-sm text-stone-500">{format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}</div>
                          </TableCell>
                          <TableCell>{teachers.find(t => t.id === slot.teacherId)?.name || 'Unknown'}</TableCell>
                          <TableCell>{slot.location}</TableCell>
                          <TableCell>{slot.maxStudents}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Create Slot</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSlot} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" type="datetime-local" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" type="datetime-local" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher">Teacher</Label>
                      <select 
                        id="teacher" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newSlot.teacherId} 
                        onChange={e => setNewSlot({...newSlot, teacherId: e.target.value})} 
                        required
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" placeholder="e.g. Room 4" value={newSlot.location} onChange={e => setNewSlot({...newSlot, location: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStudents">Max Students</Label>
                      <Input id="maxStudents" type="number" value={newSlot.maxStudents} onChange={e => setNewSlot({...newSlot, maxStudents: Number(e.target.value)})} required />
                    </div>
                    <Button type="submit" className="w-full bg-stone-900 text-white hover:bg-stone-800">
                      <Plus className="w-4 h-4 mr-2" /> Create Slot
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>Manage student accounts and credits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{format(new Date(student.createdAt), 'MMM do, yyyy')}</TableCell>
                      <TableCell>
                        {(student.details?.creditsRemaining || 0) > 0 ? (
                          <span className="inline-flex items-center justify-center bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            Active Plan
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            No Active Plan
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center bg-stone-100 px-2.5 py-0.5 rounded-full text-sm font-medium text-stone-800">
                          {student.details?.creditsRemaining || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="text-stone-600">
                          <Edit className="w-4 h-4 mr-1" /> Adjust Credits
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage roles and permissions for all users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            u.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 
                            'bg-stone-100 text-stone-800'}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <select 
                          className="flex h-8 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.email === 'naseri.sina007@gmail.com'} // Protect the super admin
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
