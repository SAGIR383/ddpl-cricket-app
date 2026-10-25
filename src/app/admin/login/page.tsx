'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSuperAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setSuccessMsg(`Authenticated as ${data.user?.name || 'Super Admin'}! Launching Command Center…`);
      await refreshProfile();

      setTimeout(() => {
        if (data.tournamentSlug) {
          router.push(`/admin?tournament=${data.tournamentSlug}`);
        } else {
          router.push('/admin');
        }
        router.refresh();
      }, 700);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Load failed') || msg.includes('Failed to fetch')) {
        setErrorMsg('Unable to connect to the authentication server. Please check your internet connection.');
      } else {
        setErrorMsg(msg || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md rounded-3xl p-8 sm:p-10 bg-[#0D1B2A]/95 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl space-y-7">
        {/* Header with Golden Master Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#D8AD55]/20 via-[#F2D69A]/15 to-[#D8AD55]/10 items-center justify-center border border-[#D8AD55]/40 shadow-xl shadow-[#D8AD55]/10">
            <ShieldCheck className="w-9 h-9 text-[#D8AD55]" />
          </div>
          <div className="space-y-1">
            <span className="px-3.5 py-1 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] font-mono text-[10px] font-extrabold tracking-widest uppercase">
              Super Admin &amp; League Governance
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight pt-1">
              Super Admin Portal
            </h1>
            <p className="text-xs text-[#8793A5] leading-relaxed max-w-xs mx-auto">
              Master administration gateway for Master Super Admins and Organization Tournament Super Admins.
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSuperAdminLogin} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Master Super Admin Username / Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-press shimmer-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-xl shadow-[#D8AD55]/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Authenticating Master Access…' : 'Log In as Super Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs font-bold text-[#F2D69A] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            ← Return to Tournament Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
