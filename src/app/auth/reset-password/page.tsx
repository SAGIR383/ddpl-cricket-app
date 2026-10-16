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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 bg-[#0D1B2A]/95 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] items-center justify-center p-0.5 shadow-xl shadow-[#D8AD55]/20">
            <div className="w-full h-full bg-[#08111F] rounded-[14px] flex items-center justify-center font-display font-black text-2xl text-[#F2D69A]">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-tight">Create New Password</h2>
          <p className="text-xs text-[#8793A5] max-w-xs mx-auto">
            Choose a new strong password to secure your CricPlus account.
          </p>
        </div>

        {/* Loading / Checking session spinner */}
        {checkingSession ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-8 h-8 text-[#D8AD55] animate-spin" />
            <span className="text-xs text-gray-300">Verifying secure recovery link…</span>
          </div>
        ) : !sessionValid ? (
          /* Session expired or missing */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2 text-center">
              <AlertCircle className="w-6 h-6 text-amber-400 mx-auto shrink-0" />
              <p className="font-bold text-sm text-white">Reset Link Expired or Already Used</p>
              <p className="text-gray-300 leading-relaxed">
                For security reasons, password reset links can only be used once and expire quickly.
              </p>
            </div>

            <Link
              href="/auth/login"
              className="btn-press shimmer-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Request a Fresh Reset Link</span>
            </Link>
          </div>
        ) : (
          /* Valid Session: Password Form */
          <>
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 text-sm">
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
                <span>{loading ? 'Updating Password…' : 'Update Password & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <div className="pt-2 text-center text-xs text-[#8793A5]">
          <Link href="/auth/login" className="text-[#F2D69A] hover:underline font-bold cursor-pointer">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
