import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-stone-900 text-white p-4 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          We use cookies to improve your experience on our site. By continuing to use this site, you agree to our{' '}
          <Link to="/privacy-policy" className="text-[#b9d9a1] hover:underline ml-1" target="_blank">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-3">
          <Button 
            onClick={handleReject} 
            variant="outline" 
            size="sm"
            className="text-white border-white hover:bg-white hover:text-stone-900"
          >
            Reject
          </Button>
          <Button 
            onClick={handleAccept} 
            size="sm"
            className="bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
