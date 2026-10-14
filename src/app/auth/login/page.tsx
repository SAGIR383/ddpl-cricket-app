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

type AuthMode = 'signin' | 'register' | 'forgot_password';
type ResetStep = 'send_otp' | 'verify_otp';

export default function LoginPage() {
  const router = useRouter();
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

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

  // Standard Login / Register Handler
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push('/profile');
          router.refresh();
        } else {
          setSuccessMsg('Account created successfully! You can now sign in with your credentials.');
          setAuthMode('signin');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Send OTP to User's Email
  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetEmail = resetEmail.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);

    try {
      // Trigger Supabase password recovery / OTP with dynamic live redirect URL
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ddpl-cricket-app.vercel.app';
      const redirectUrl = `${origin}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        // Fallback to signInWithOtp if resetPasswordForEmail fails
        const fallback = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: redirectUrl,
          },
        });
        if (fallback.error) throw fallback.error;
      }

      setSuccessMsg(`Reset instructions sent to ${targetEmail}! You can tap the "Reset password" button in your email OR enter the 6-digit code below.`);
      setResetStep('verify_otp');
      setResendCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify 6-digit OTP & Set New Password
  async function handleVerifyOtpAndResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const targetEmail = resetEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-type.');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP code
      let verified = false;
      let lastError: any = null;

      const resRecovery = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: cleanOtp,
        type: 'recovery',
      });

      if (!resRecovery.error) {
        verified = true;
      } else {
        lastError = resRecovery.error;
        const resEmail = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: cleanOtp,
          type: 'email',
        });
        if (!resEmail.error) {
          verified = true;
          lastError = null;
        }
      }

      if (!verified) {
        throw new Error(lastError?.message || 'Invalid or expired 6-digit code. Please try again or request a new code.');
      }

      // Update password for the verified authenticated session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccessMsg('Password successfully changed! Logging you in…');

      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-6 sm:p-8 shadow-2xl border border-cricket-border space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cricket-teal items-center justify-center p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-cricket-dark rounded-full flex items-center justify-center font-display font-extrabold text-2xl text-cricket-teal">
              {authMode === 'forgot_password' ? (
                <KeyRound className="w-5 h-5 text-amber-400" />
              ) : (
                'CP'
              )}
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl text-white">
            {authMode === 'forgot_password'
              ? 'Reset Password'
              : authMode === 'register'
              ? 'Join CricPluse'
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-cricket-muted max-w-xs mx-auto">
            {authMode === 'forgot_password'
              ? resetStep === 'send_otp'
                ? 'Enter your registered email to receive a 6-digit verification code.'
                : 'Enter the 6-digit code sent to your email and your new password.'
              : authMode === 'register'
              ? 'Create your player profile for corporate tournaments'
              : 'Sign in to manage teams, enter auction bids, or score matches'}
          </p>
        </div>

        {/* Tab Selector (Hidden during Forgot Password) */}
        {authMode !== 'forgot_password' ? (
          <div className="flex rounded-xl bg-cricket-dark/80 p-1 border border-cricket-border text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'signin' ? 'bg-cricket-card text-cricket-teal shadow' : 'text-cricket-muted hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'register' ? 'bg-cricket-card text-cricket-teal shadow' : 'text-cricket-muted hover:text-white'
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cricket-teal hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {resetStep === 'send_otp' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </span>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {authMode === 'forgot_password' ? (
          resetStep === 'send_otp' ? (
            /* STEP 1: ENTER EMAIL TO RECEIVE OTP */
            <form onSubmit={handleSendOtp} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-cricket-muted absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.cricket@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-cricket-dark font-display font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Sending Verification Code…' : 'Send 6-Digit Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER OTP & NEW PASSWORD */
            <form onSubmit={handleVerifyOtpAndResetPassword} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300">6-Digit Verification Code</label>
                  <span className="text-[11px] text-gray-400">Sent to: <b className="text-white">{resetEmail}</b></span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-amber-300 font-mono tracking-widest text-base font-bold placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cricket-muted absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cricket-muted absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-cricket-dark font-display font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying & Updating…' : 'Verify & Set New Password'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="pt-1 flex items-center justify-between text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => setResetStep('send_otp')}
                  className="hover:text-white hover:underline"
                >
                  Change email address
                </button>

                {resendCountdown > 0 ? (
                  <span className="text-gray-500 font-mono">Resend in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-amber-400 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          )
        ) : (
          /* STANDARD SIGN IN / CREATE ACCOUNT FORM */
          <form onSubmit={handleAuth} className="space-y-4 text-sm">
            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-cricket-muted absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakib Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-cricket-teal text-sm transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cricket-muted absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.cricket@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-cricket-teal text-sm transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300">Password</label>
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
                    className="text-xs font-bold text-cricket-teal hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-cricket-muted absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-cricket-teal text-sm transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Please wait…' : authMode === 'register' ? 'Create My Account' : 'Sign In to CricPluse'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-cricket-muted">
          <span>By continuing, you agree to Corporate Sports Community guidelines.</span>
        </div>
      </div>
    </div>
  );
}
