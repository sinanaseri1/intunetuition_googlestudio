import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Music, Mail, ArrowLeft } from 'lucide-react';

export function Login() {
  const { user, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function redirectBasedOnProfile() {
      if (!user || !profile) return;

      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'teacher') {
        navigate('/teacher', { replace: true });
      } else if (profile.role === 'student') {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (!mounted) return;
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          if (!data.childName) {
            navigate('/student-profile', { replace: true });
          } else if (!data.gdprConsentGiven) {
            navigate('/consent', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else {
          navigate('/student-profile', { replace: true });
        }
      }
    }

    if (user && profile && !loading) {
      redirectBasedOnProfile();
    }

    return () => { mounted = false; };
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
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
                    <Label htmlFor="name">Full Name</Label>
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

              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-stone-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={signInWithGoogle} 
                  disabled={loading || isSubmitting}
                  className="w-full bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 h-11 text-base font-medium"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
              </div>
              
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
