import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Menu, Instagram } from 'lucide-react';
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
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
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
                  className="relative text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[var(--brand-strong)] after:transition-all hover:after:w-full"
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

      <footer className="relative bg-stone-900 text-stone-400 py-16">
        {/* Brand hairline to lift the footer off the page. */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand)]/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center mb-4 bg-white/5 p-2 rounded-lg inline-block">
              <Logo className="h-24 w-auto" />
            </div>
            <p className="text-sm mt-2">Providing high-quality acoustic guitar lessons in primary schools.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="transition-colors hover:text-white">Home</Link></li>
              <li><Link to="/pricing" className="transition-colors hover:text-white">Pricing</Link></li>
              <li><Link to="/testimonials" className="transition-colors hover:text-white">Testimonials</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-white">Contact</Link></li>
               <li><Link to="/login" className="transition-colors hover:text-white">Login</Link></li>
               <li><Link to="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</Link></li>
               <li><Link to="/terms" className="transition-colors hover:text-white">Terms & Conditions</Link></li>
               <li><Link to="/delete-account" className="transition-colors hover:text-white">Delete Account</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: Info@intunetuition.co.uk</li>
            </ul>

            <h3 className="text-white font-semibold mt-6 mb-3">Follow Us</h3>
            <a
              href="https://www.instagram.com/joelwebbmusic/"
              target="_blank"
              // noopener stops the new tab reaching back via window.opener;
              // noreferrer also withholds the referring URL.
              rel="noopener noreferrer"
              aria-label="Follow In Tune Tuition on Instagram (opens in a new tab)"
              className="inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9d9a1] rounded-md"
            >
              <Instagram className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm">@joelwebbmusic</span>
            </a>
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
