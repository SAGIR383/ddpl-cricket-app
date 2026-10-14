'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push('/profile');
          router.refresh();
        } else {
          setSuccessMsg('Account created successfully! Please check your email to verify your account or proceed to sign in.');
          setIsRegister(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-card p-8 shadow-2xl border border-cricket-border space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cricket-teal items-center justify-center p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-cricket-dark rounded-full flex items-center justify-center font-display font-extrabold text-2xl text-cricket-teal">
              CP
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl text-white">
            {isRegister ? 'Join CricPluse' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-cricket-muted">
            {isRegister
              ? 'Create your player profile for corporate tournaments'
              : 'Sign in to manage teams, enter auction bids, or score matches'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-cricket-dark/80 p-1 border border-cricket-border text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              !isRegister ? 'bg-cricket-card text-cricket-teal shadow' : 'text-cricket-muted hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              isRegister ? 'bg-cricket-card text-cricket-teal shadow' : 'text-cricket-muted hover:text-white'
            }`}
          >
            Create Account
          </button>
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

        <form onSubmit={handleAuth} className="space-y-4 text-sm">
          {isRegister && (
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
            <label className="text-xs font-semibold text-gray-300">Password</label>
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : isRegister ? 'Create My Account' : 'Sign In to CricPluse'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-cricket-muted">
          <span>By signing in, you agree to Corporate Sports Community guidelines.</span>
        </div>
      </div>
    </div>
  );
}
