/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Button } from './components/ui/button';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Testimonials } from './pages/Testimonials';
import { Contact } from './pages/Contact';
import { Pricing } from './pages/Pricing';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';
import { StudentProfile } from './pages/StudentProfile';
import { MyData } from './pages/MyData';
import { EditProfile } from './pages/EditProfile';
import { DeleteAccount } from './pages/DeleteAccount';
import { ConsentFlow } from './pages/ConsentFlow';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, profile, loading, profileError, reloadProfile } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-stone-500">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // When the profile couldn't be read, `profile.role` is a least-privilege
    // placeholder rather than the user's real role. Bouncing them to the home
    // page here would look exactly like a permission change — so explain what
    // happened and offer a retry instead of hiding a transient failure.
    if (profileError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h1 className="text-lg font-semibold text-amber-900">Couldn’t load your account</h1>
            <p className="mt-2 text-sm text-amber-800">{profileError}</p>
            <p className="mt-2 text-sm text-amber-800">
              This is usually temporary. Your account has not been changed.
            </p>
            <Button className="mt-5" variant="outline" onClick={() => { void reloadProfile(); }}>
              Try again
            </Button>
          </div>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="contact" element={<Contact />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="student-profile" element={<StudentProfile />} />
            <Route path="my-data" element={<MyData />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="delete-account" element={<DeleteAccount />} />
            <Route path="consent" element={<ConsentFlow />} />
            
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="teacher" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
