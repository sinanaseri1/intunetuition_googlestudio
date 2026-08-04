import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';
import { Logo } from './Logo';
import { CookieConsent } from './CookieConsent';

export function Layout() {
  const { user, profile, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Single source of truth for both the desktop bar and the mobile drawer, so
  // a link can never be added to one and forgotten in the other.
  const navLinks: { to: string; label: string }[] = [
    { to: '/', label: 'Home' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/testimonials', label: 'Testimonials' },
    { to: '/contact', label: 'Contact' },
    ...(profile?.role === 'student'
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/my-data', label: 'My Data' },
        ]
      : []),
    ...(profile?.role === 'teacher' ? [{ to: '/teacher', label: 'Teacher Portal' }] : []),
    ...(profile?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 md:h-32 items-center gap-4">
            <Link to="/" className="flex items-center shrink-0">
              <Logo className="h-20 md:h-28 w-auto" />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4">
                {user ? (
                  <>
                    <span className="text-sm text-stone-500 hidden lg:inline-block">{profile?.name}</span>
                    <Button variant="outline" size="sm" onClick={logout}>Sign Out</Button>
                  </>
                ) : (
                  <Link to="/login">
                    <Button className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]">Sign In</Button>
                  </Link>
                )}
              </div>

              {/* Mobile: the nav and auth actions above are hidden below md, so
                  everything moves into this drawer rather than disappearing. */}
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu" />
                  }
                >
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] max-w-xs">
                  <SheetHeader className="border-b border-stone-200">
                    <SheetTitle>{user ? profile?.name || 'Menu' : 'Menu'}</SheetTitle>
                  </SheetHeader>

                  <nav className="flex flex-col px-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileNavOpen(false)}
                        className="rounded-md px-3 py-3 text-base font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto border-t border-stone-200 p-4">
                    {user ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setMobileNavOpen(false);
                          logout();
                        }}
                      >
                        Sign Out
                      </Button>
                    ) : (
                      <Link to="/login" onClick={() => setMobileNavOpen(false)} className="block">
                        <Button className="w-full bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]">
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
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
              <Logo className="h-24 w-auto" />
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
               <li><Link to="/login" className="hover:text-white">Login</Link></li>
               <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
               <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
               <li><Link to="/delete-account" className="hover:text-white">Delete Account</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: Info@intunetuition.co.uk</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-800 text-sm text-center">
          &copy; {new Date().getFullYear()} In Tune Tuition. All rights reserved.
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
