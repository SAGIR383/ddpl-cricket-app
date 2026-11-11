'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'register' | 'forgot_password';
type ResetStep = 'send_otp' | 'verify_otp';

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [resetStep, setResetStep] = useState<ResetStep>('send_otp');

  // Sign In / Register state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Forgot password OTP state
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Common UI state
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  // Read error param from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlErr = params.get('error') || params.get('error_description');
      if (urlErr) {
        setErrorMsg(decodeURIComponent(urlErr));
      }
    }
  }, []);

  async function handleResendVerification(targetEmail?: string) {
    const emailToUse = (targetEmail || email || resetEmail).trim().toLowerCase();
    if (!emailToUse) {
      setErrorMsg('Please enter your email address to resend the verification link.');
      return;
    }
    setResendingVerification(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend verification email.');
      }
      setSuccessMsg(data.message || 'Verification link sent! Please check your email inbox.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to resend verification email.');
    } finally {
      setResendingVerification(false);
    }
  }

  // Timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Standard Login / Register Handler via Bulletproof Same-Origin Server Route
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            fullName: fullName.trim(),
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Registration failed.');
        }

        if (result.session) {
          try {
            await supabase.auth.setSession(result.session);
          } catch (e) {
            console.warn('Local session sync skipped:', e);
          }
          await refreshProfile();
          router.push('/profile');
          router.refresh();
        } else {
          setSuccessMsg('Account created successfully! You can now sign in with your credentials.');
          setAuthMode('signin');
        }
      } else {
        // Sign In via Same-Origin API Route (immune to Safari ITP, Adblockers, and Corporate Firewalls)
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Authentication failed. Please verify credentials.');
        }

        // Synchronize client-side Supabase auth state if session returned in background
        if (result.session) {
          supabase.auth.setSession(result.session).catch(() => {});
        }

        setSuccessMsg('Signed in successfully! Launching CricPlus24…');

        if (result.tournamentSlug && typeof window !== 'undefined') {
          localStorage.setItem('cricplus_admin_selected_tournament', result.tournamentSlug);
        }

        // Instant redirect with zero delay - cookies are already set by HTTP response
        const targetUrl =
          result.role === 'super_admin' || result.role === 'organizer'
            ? result.tournamentSlug
              ? `/admin?tournament=${result.tournamentSlug}`
              : '/admin'
            : '/';
        window.location.href = targetUrl;
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Load failed') || msg.includes('Failed to fetch')) {
        setErrorMsg('Unable to reach the authentication service. Please check your internet connection or try again.');
      } else {
        setErrorMsg(msg || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Direct Reset Password via Server Route (Neon-backed)
  async function handleDirectResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetEmail = resetEmail.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'direct_reset',
          email: targetEmail,
          newPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update password.');
      }

      setSuccessMsg(result.message || 'Password successfully updated! Redirecting to sign in…');

      setTimeout(() => {
        setAuthMode('signin');
        setEmail(targetEmail);
        setPassword('');
        setSuccessMsg('Your password has been updated in Neon. You can now sign in!');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 bg-[#0D1B2A]/95 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] items-center justify-center p-0.5 shadow-xl shadow-[#D8AD55]/20">
            <div className="w-full h-full bg-[#08111F] rounded-[14px] flex items-center justify-center font-display font-black text-xl text-[#F2D69A]">
              {authMode === 'forgot_password' ? (
                <KeyRound className="w-6 h-6 text-[#F2D69A]" />
              ) : (
                'CP'
              )}
            </div>
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-tight">
            {authMode === 'forgot_password'
              ? 'Reset Password'
              : authMode === 'register'
              ? 'Join CricPlus24'
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#8793A5] max-w-sm mx-auto">
            {authMode === 'forgot_password'
              ? resetStep === 'send_otp'
                ? 'Enter your registered email to receive a secure password reset link.'
                : 'Follow the link sent to your email to reset your password.'
              : authMode === 'register'
              ? 'Create your universal player & spectator profile'
              : 'Sign in to manage teams, enter auction bids, or score matches'}
          </p>
        </div>

        {/* Tournament Participation Safeguard Notice */}
        {authMode === 'register' && (
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 flex items-start gap-2.5 text-left text-xs shadow-inner animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-[#D8AD55] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-[#F2D69A] font-bold text-[11px] block">
                Tournament Participation is Invitation-Only
              </strong>
              <p className="text-[#8793A5] text-[11px] leading-relaxed">
                General account creation provides platform &amp; spectator access. To join a specific company or club tournament as an active athlete, please open the private joining link provided by your tournament organizer.
              </p>
            </div>
          </div>
        )}

        {/* Tab Selector (Hidden during Forgot Password) */}
        {authMode !== 'forgot_password' ? (
          <div className="flex rounded-2xl bg-[#08111F] p-1 border border-[#D8AD55]/20 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'signin' ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md' : 'text-[#8793A5] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md' : 'text-[#8793A5] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F2D69A] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30">
              Account Recovery
            </span>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2 text-xs text-red-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {(errorMsg.toLowerCase().includes('confirm') ||
              errorMsg.toLowerCase().includes('expired') ||
              errorMsg.toLowerCase().includes('invalid')) && (
              <button
                type="button"
                onClick={() => handleResendVerification()}
                disabled={resendingVerification}
                className="self-start mt-1 px-3 py-1.5 rounded-lg bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 border border-[#D8AD55]/40 text-[#F2D69A] font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{resendingVerification ? 'Sending fresh link...' : '✉️ Resend Verification Link'}</span>
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORGOT PASSWORD FORM (DIRECT NEON-POWERED PASSWORD RESET) */}
        {authMode === 'forgot_password' ? (
          <form onSubmit={handleDirectResetPassword} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. mdsagirhossain560@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D8AD55] text-sm transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D8AD55] text-sm transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D8AD55] text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press shimmer-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Updating Password…' : 'Update Password & Return to Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-[#F2D69A] hover:underline font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD SIGN IN / CREATE ACCOUNT FORM */
          <form onSubmit={handleAuth} className="space-y-4 text-sm">
            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakib Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D8AD55] text-sm transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                {authMode === 'register' ? 'Email Address' : 'Email Address / Username'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
                <input
                  type={authMode === 'register' ? 'email' : 'text'}
                  required
                  placeholder={
                    authMode === 'register'
                      ? 'e.g. rahul.cricket@gmail.com'
                      : 'e.g. rahul.cricket@gmail.com or superadmin'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D8AD55] text-sm transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Password</label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email || '');
                      setAuthMode('forgot_password');
                      setResetStep('send_otp');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-bold text-[#F2D69A] hover:underline transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white placeholder-gray-500 focus:outline-none focus:border-[#D8AD55] text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press shimmer-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? 'Please wait…' : authMode === 'register' ? 'Create My Account' : 'Sign In to CricPlus24'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-[#8793A5]">
          <span>By continuing, you agree to Corporate Sports Community guidelines.</span>
        </div>
      </div>
    </div>
  );
}
