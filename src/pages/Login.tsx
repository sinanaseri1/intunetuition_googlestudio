import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Music, Mail, ArrowLeft } from 'lucide-react';

export function Login() {
  const { user, profile, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [school, setSchool] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Redirect purely on `profile.role` — never wait on a further async fetch
  // (e.g. the student document) before navigating, so a slow or failing
  // Firestore read can never leave a signed-in user stuck on this page.
  // auth.tsx guarantees `profile` resolves to a usable value (falling back to
  // role: 'student' on error) once `loading` goes false, so this is a hard
  // guarantee, not a best-effort one. Any further onboarding gaps (missing
  // child info, missing GDPR consent — relevant to Google sign-in, which
  // can't collect either at sign-up) are handled by the destination pages
  // themselves (Dashboard.tsx bounces to /student-profile or /consent).
  useEffect(() => {
    if (!user || !profile || loading) return;

    if (profile.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (profile.role === 'teacher') {
      navigate('/teacher', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  // Belt-and-suspenders: if something upstream still hangs (e.g. `loading`
  // itself never resolves), never leave the user stranded on the login page.
  useEffect(() => {
    if (!user || loading) return;
    const timeoutId = window.setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 6000);
    return () => window.clearTimeout(timeoutId);
  }, [user, loading, navigate]);

  const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!phone.trim() || !PHONE_PATTERN.test(phone.trim())) {
        setError('Please enter a valid phone number.');
        return;
      }
      if (!childName.trim()) {
        setError("Please enter your child's name.");
        return;
      }
      if (!yearGroup.trim()) {
        setError('Please enter your child\'s year group.');
        return;
      }
      if (!school.trim()) {
        setError("Please enter your child's school.");
        return;
      }
      if (!gdprConsent) {
        setError('You must give consent to process your data to sign up.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name, {
          phone: phone.trim(),
          childName: childName.trim(),
          yearGroup: yearGroup.trim(),
          school: school.trim(),
        });
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-stone-200">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-[#b9d9a1] w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Music className="h-6 w-6 text-stone-900" />
          </div>
          {showResetPassword && !resetSent ? (
            <>
              <CardTitle className="text-2xl font-bold text-stone-900">Reset your password</CardTitle>
              <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
            </>
          ) : resetSent ? (
            <>
              <CardTitle className="text-2xl font-bold text-stone-900">Check your email</CardTitle>
              <CardDescription>We've sent a password reset link to <strong>{resetEmail}</strong>. Click the link in the email to set a new password.</CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold text-stone-900">
                {isSignUp ? 'Create an account' : 'Sign in to your account'}
              </CardTitle>
              <CardDescription>
                Access your lesson schedule, book new slots, and manage packages.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {showResetPassword && !resetSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input 
                  id="reset-email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-500 font-medium p-2 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-stone-900 text-white hover:bg-stone-800 h-11"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <button 
                type="button"
                onClick={() => {
                  setShowResetPassword(false);
                  setError('');
                  setResetEmail('');
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-stone-600 hover:text-stone-900 focus:outline-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
            </form>
          ) : resetSent ? (
            <div className="space-y-4">
              <div className="text-center">
                <Mail className="h-12 w-12 text-[#b9d9a1] mx-auto mb-4" />
                <p className="text-sm text-stone-600">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setResetSent(false);
                  setError('');
                }}
                className="w-full bg-stone-900 text-white hover:bg-stone-800 h-11"
              >
                Resend Email
              </Button>
              <button 
                type="button"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetSent(false);
                  setResetEmail('');
                  setError('');
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-stone-600 hover:text-stone-900 focus:outline-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name (Parent/Guardian)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 07123 456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="pt-2 border-t border-stone-200">
                      <p className="text-sm font-medium text-stone-700 mb-3">Your Child's Details</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="childName">Child's Name</Label>
                          <Input
                            id="childName"
                            type="text"
                            placeholder="Enter your child's full name"
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yearGroup">Year Group</Label>
                          <Input
                            id="yearGroup"
                            type="text"
                            placeholder="e.g. Year 3, Year 4"
                            value={yearGroup}
                            onChange={(e) => setYearGroup(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="school">School</Label>
                          <Input
                            id="school"
                            type="text"
                            placeholder="Enter your child's school name"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-stone-50 rounded-lg">
                      <Checkbox
                        id="gdprConsent"
                        checked={gdprConsent}
                        onCheckedChange={(checked) => setGdprConsent(checked as boolean)}
                        className="mt-1"
                      />
                      <Label htmlFor="gdprConsent" className="text-sm leading-relaxed font-normal">
                        I give consent for In Tune Tuition to process my and my child's personal data as described in the{' '}
                        <Link to="/privacy-policy" className="text-[#b9d9a1] hover:underline font-medium" target="_blank">
                          Privacy Policy
                        </Link>
                        . I can withdraw this consent at any time by contacting info@intunetuition.co.uk.
                      </Label>
                    </div>
                  </>
                )}

                {error && (
                  <div className="text-sm text-red-500 font-medium p-2 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-stone-900 text-white hover:bg-stone-800 h-11"
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
              </form>

              {!isSignUp && (
                <div className="text-center mt-2">
                  <button 
                    onClick={() => {
                      setShowResetPassword(true);
                      setResetEmail(email);
                      setError('');
                    }}
                    className="text-sm text-stone-600 hover:text-stone-900 focus:outline-none"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-stone-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="font-medium text-stone-900 hover:underline focus:outline-none"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
