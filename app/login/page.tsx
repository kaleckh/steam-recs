'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/profile';
  const supabase = createClient();

  // Use localhost in development, production URL in production
  const siteUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://steam-recs.vercel.app';

  // Check for pending search and redirect appropriately
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const pendingSearch = sessionStorage.getItem('pendingSearch');
      if (pendingSearch) {
        sessionStorage.removeItem('pendingSearch');
        return `/search?q=${encodeURIComponent(pendingSearch)}`;
      }
    }
    return redirect;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(getRedirectUrl());
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?redirect=${redirect}`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a confirmation link!');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    // Store redirect destination before OAuth (query params may cause issues)
    sessionStorage.setItem('authRedirect', redirect);

    // Use exact URL without query params - must match Supabase Redirect URLs exactly
    const redirectUrl = `${window.location.origin}/auth/callback`;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // Note: If successful, the page will redirect, so we don't need to handle success here
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a password reset link!');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Terminal Window */}
        <div className="terminal-box rounded-lg overflow-hidden">
          {/* Terminal Header */}
          <div className="terminal-header">
            <span className="text-gray-400 text-sm font-mono ml-16">AUTH_PORTAL.exe</span>
          </div>

          {/* Terminal Body */}
          <div className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <h1 className="orbitron text-2xl font-bold text-neon-cyan">STEAM RECS</h1>
              </Link>
              <p className="text-gray-500 font-mono text-sm mt-2">
                {activeTab === 'login' ? 'Welcome back, player' : 'Create your account'}
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex mb-6 bg-terminal-light rounded-lg p-1">
              <button
                onClick={() => { setActiveTab('login'); setError(null); setMessage(null); }}
                className={`flex-1 py-2 rounded font-mono text-sm transition-all ${
                  activeTab === 'login'
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(null); setMessage(null); }}
                className={`flex-1 py-2 rounded font-mono text-sm transition-all ${
                  activeTab === 'signup'
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                SIGN UP
              </button>
            </div>

            {/* Error/Message Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-mono text-sm">{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-4 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <p className="text-neon-green font-mono text-sm">{message}</p>
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-mono text-sm text-white group-hover:text-gray-300 transition-colors">
                  Continue with Google
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-terminal-border"></div>
              <span className="text-gray-600 font-mono text-xs">OR</span>
              <div className="flex-1 h-px bg-terminal-border"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={activeTab === 'login' ? handleEmailLogin : handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-gray-500 font-mono text-xs mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@example.com"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-terminal-dark border border-terminal-border rounded-lg text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-mono text-xs mb-2 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-terminal-dark border border-terminal-border rounded-lg text-white font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan transition-colors disabled:opacity-50"
                />
              </div>

              {activeTab === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-neon-cyan font-mono text-xs hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full btn-arcade btn-arcade-cyan rounded-lg py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {activeTab === 'login' ? 'LOGGING IN...' : 'CREATING ACCOUNT...'}
                  </span>
                ) : (
                  activeTab === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'
                )}
              </button>
            </form>

            {/* Footer Note */}
            <p className="text-center text-gray-600 font-mono text-xs mt-6">
              {activeTab === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => setActiveTab('signup')} className="text-neon-cyan hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setActiveTab('login')} className="text-neon-cyan hover:underline">
                    Login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-500 font-mono text-sm hover:text-neon-cyan transition-colors">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="terminal-box rounded-lg overflow-hidden p-8">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
