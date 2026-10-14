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

      setSuccessMsg('Master Super Admin verified! Launching Command Center…');
      await refreshProfile();

      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md glass-card p-8 sm:p-10 shadow-2xl border border-cricket-border/80 space-y-7 backdrop-blur-2xl">
        {/* Header with Golden Master Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-cricket-teal/20 to-blue-600/20 items-center justify-center p-0.5 border border-amber-400/40 shadow-xl shadow-amber-500/10">
            <ShieldCheck className="w-9 h-9 text-amber-400" />
          </div>
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-extrabold tracking-widest uppercase">
              Master System Control
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight pt-1">
              Super Admin Portal
            </h1>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
              Exclusive governance gateway to assign user roles, manage tournament committees, and administer live fixtures.
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
            <label className="text-xs font-bold text-gray-300">Master Super Admin Username / Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-cricket-dark font-display font-extrabold text-sm tracking-wide shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'Authenticating Master Access…' : 'Log In as Super Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs font-bold text-cricket-teal hover:underline inline-flex items-center gap-1"
          >
            ← Return to Tournament Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
