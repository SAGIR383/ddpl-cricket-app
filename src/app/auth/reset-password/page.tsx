'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // 1. Check if URL contains query params (?code=... or ?token_hash=...)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const tokenHash = urlParams.get('token_hash');
          const type = urlParams.get('type') || 'recovery';

          if (code) {
            const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!codeErr && isMounted) {
              setSessionValid(true);
              setCheckingSession(false);
              return;
            }
          }

          if (tokenHash) {
            const { error: otpErr } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as any,
            });
            if (!otpErr && isMounted) {
              setSessionValid(true);
              setCheckingSession(false);
              return;
            }
          }

          // 2. Check if URL contains hash params (#access_token=...&refresh_token=...)
          if (window.location.hash && window.location.hash.includes('access_token')) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');

            if (access_token && refresh_token) {
              const { error: sessErr } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (!sessErr && isMounted) {
                setSessionValid(true);
                setCheckingSession(false);
                return;
              }
            }
          }
        }

        // 3. Check existing Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          setSessionValid(true);
          setCheckingSession(false);
          return;
        }

        // 4. Wait briefly for onAuthStateChange
        const { data: authSub } = supabase.auth.onAuthStateChange((event, currentSession) => {
          if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || currentSession) && isMounted) {
            setSessionValid(true);
            setCheckingSession(false);
          }
        });

        // Timeout fallback after 3 seconds
        setTimeout(() => {
          if (isMounted) {
            setCheckingSession(false);
          }
        }, 2500);

        return () => {
          authSub.subscription.unsubscribe();
        };
      } catch (err) {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Your password has been successfully reset! Redirecting to your profile…');

      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please request a fresh reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-6 sm:p-8 shadow-2xl border border-cricket-border space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-cricket-teal items-center justify-center p-0.5 shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-cricket-dark rounded-full flex items-center justify-center font-display font-extrabold text-2xl text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl text-white">Create New Password</h2>
          <p className="text-xs text-cricket-muted max-w-xs mx-auto">
            Choose a new strong password to secure your CricPlus account.
          </p>
        </div>

        {/* Loading / Checking session spinner */}
        {checkingSession ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-8 h-8 text-cricket-teal animate-spin" />
            <span className="text-xs text-gray-300">Verifying secure recovery link…</span>
          </div>
        ) : !sessionValid ? (
          /* Session expired or missing */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2 text-center">
              <AlertCircle className="w-6 h-6 text-amber-400 mx-auto shrink-0" />
              <p className="font-bold text-sm text-white">Reset Link Expired or Already Used</p>
              <p className="text-gray-300 leading-relaxed">
                For security reasons, password reset links can only be used once and expire quickly.
              </p>
            </div>

            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-400 text-cricket-dark font-display font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Request a Fresh Reset Link</span>
            </Link>
          </div>
        ) : (
          /* Valid Session: Password Form */
          <>
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

            <form onSubmit={handleResetPassword} className="space-y-4 text-sm">
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-cricket-teal text-sm transition-colors"
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white placeholder-gray-500 focus:outline-none focus:border-cricket-teal text-sm transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-cricket-dark font-display font-extrabold text-sm shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Updating Password…' : 'Update Password & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <div className="pt-2 text-center text-xs text-cricket-muted">
          <Link href="/auth/login" className="text-cricket-teal hover:underline font-bold">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
