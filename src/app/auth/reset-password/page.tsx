'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
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
          email: cleanEmail,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setSuccessMsg(data.message || 'Your password has been successfully reset! Redirecting to sign in…');

      setTimeout(() => {
        router.push('/auth/login');
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
            <div className="w-full h-full bg-[#08111F] rounded-[14px] flex items-center justify-center font-display font-black text-2xl text-[#F2D69A]">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-tight">Create New Password</h2>
          <p className="text-xs text-[#8793A5] max-w-xs mx-auto">
            Reset and update your password securely in the database.
          </p>
        </div>

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
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Registered Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="e.g. mdsagirhossain560@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <span>{loading ? 'Updating Password…' : 'Update Password & Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[#8793A5]">
          <Link href="/auth/login" className="text-[#F2D69A] hover:underline font-bold cursor-pointer">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
