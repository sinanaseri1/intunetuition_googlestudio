import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { Logo } from './Logo';

export function Layout() {
  const { user, profile, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center">
              <Logo className="h-14 w-auto" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-stone-600 hover:text-stone-900">Home</Link>
              <Link to="/pricing" className="text-sm font-medium text-stone-600 hover:text-stone-900">Pricing</Link>
              <Link to="/testimonials" className="text-sm font-medium text-stone-600 hover:text-stone-900">Testimonials</Link>
              <Link to="/contact" className="text-sm font-medium text-stone-600 hover:text-stone-900">Contact</Link>
              {profile?.role === 'student' && (
                <Link to="/dashboard" className="text-sm font-medium text-stone-600 hover:text-stone-900">Dashboard</Link>
              )}
              {profile?.role === 'teacher' && (
                <Link to="/teacher" className="text-sm font-medium text-stone-600 hover:text-stone-900">Teacher Portal</Link>
              )}
              {profile?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-medium text-stone-600 hover:text-stone-900">Admin</Link>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-stone-500 hidden sm:inline-block">{profile?.name}</span>
                  <Button variant="outline" size="sm" onClick={logout}>Sign Out</Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4 bg-white/5 p-2 rounded-lg inline-block">
              <Logo className="h-12 w-auto filter grayscale brightness-200" />
            </div>
            <p className="text-sm mt-2">Providing high-quality acoustic guitar lessons in primary schools.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/testimonials" className="hover:text-white">Testimonials</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/login" className="hover:text-white">Student Login</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: Info@intunetuition.co.uk</li>
              <li>Phone: 01234 567890</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-800 text-sm text-center">
          &copy; {new Date().getFullYear()} In Tune Tuition. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
