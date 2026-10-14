'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check if session or recovery token exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        // Also listen for auth state change from URL hash
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (event === 'PASSWORD_RECOVERY' || currentSession) {
              setReady(true);
            }
          }
        );
        return () => {
          authListener.subscription.unsubscribe();
        };
      }
    });
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
      setErrorMsg('Passwords do not match. Please re-type.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMsg('Your password has been successfully reset! Redirecting to your profile…');

      setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please try requesting a new reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-6 sm:p-8 shadow-2xl border border-cricket-border space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-cricket-teal items-center justify-center p-0.5 shadow-lg shadow-teal-500/20">
            <div className="w-full h-full bg-cricket-dark rounded-full flex items-center justify-center font-display font-extrabold text-2xl text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl text-white">Create New Password</h2>
          <p className="text-xs text-cricket-muted max-w-xs mx-auto">
            Choose a strong password to secure your CricPluse account.
          </p>
        </div>

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

        <div className="pt-2 text-center text-xs text-cricket-muted">
          <Link href="/auth/login" className="text-cricket-teal hover:underline font-bold">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
