'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Trophy,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function JoinTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || 'ddpl';
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [tournament, setTournament] = useState<any>(null);
  const [loadingTournament, setLoadingTournament] = useState(true);

  // Form Mode: 'create_account' | 'signin'
  const [mode, setMode] = useState<'create_account' | 'signin'>('create_account');

  // Account Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  // Cricket Role Fields
  const [role, setRole] = useState('All-rounder');
  const [battingStyle, setBattingStyle] = useState('Right-hand bat');
  const [bowlingStyle, setBowlingStyle] = useState('Right-arm medium');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Tournament Details
  useEffect(() => {
    async function fetchTournament() {
      try {
        const res = await fetch(`/api/tournaments/register?tournament=${slug}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setTournament(data.config);
          }
        }
      } catch (err) {
        console.error('Failed to load tournament info:', err);
      } finally {
        setLoadingTournament(false);
      }
    }
    fetchTournament();
  }, [slug]);

  // Pre-fill if already logged in
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      if (profile.primary_role) setRole(profile.primary_role);
      if (profile.batting_style) setBattingStyle(profile.batting_style);
      if (profile.bowling_style) setBowlingStyle(profile.bowling_style);
    }
  }, [user, profile]);

  const handleCreateAccountAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (mode === 'create_account' && (!password || password.length < 6)) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone / WhatsApp number is required for auction coordination.');
      return;
    }

    setIsSubmitting(true);

    try {
      let activeUserId = user?.id;

      // 1. If not authenticated, perform registration or sign in
      if (!user) {
        if (mode === 'create_account') {
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
              fullName: fullName.trim(),
            }),
          });
          const regData = await regRes.json();
          if (!regRes.ok || !regData.success) {
            throw new Error(regData.error || 'Failed to create account.');
          }

          if (regData.session) {
            await supabase.auth.setSession(regData.session);
            activeUserId = regData.user?.id;
          } else {
            // Sign in immediately with newly created credentials
            const loginRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });
            const loginData = await loginRes.json();
            if (loginData.session) {
              await supabase.auth.setSession(loginData.session);
              activeUserId = loginData.user?.id;
            }
          }
        } else {
          // Sign in mode
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
          });
          const loginData = await loginRes.json();
          if (!loginRes.ok || !loginData.success) {
            throw new Error(loginData.error || 'Failed to sign in. Please verify your password.');
          }
          if (loginData.session) {
            await supabase.auth.setSession(loginData.session);
            activeUserId = loginData.user?.id;
          }
        }
      }

      // 2. Register Player into the specific Tournament Pool
      const tourneyRegRes = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          tournament: slug,
          registration: {
            userId: activeUserId,
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            employeeId: employeeId.trim() || undefined,
            role,
            battingStyle,
            bowlingStyle,
          },
        }),
      });

      const tourneyRegData = await tourneyRegRes.json();
      if (!tourneyRegRes.ok || !tourneyRegData.success) {
        throw new Error(tourneyRegData.error || 'Could not complete tournament registration.');
      }

      // Save joined tournament association in localStorage
      try {
        localStorage.setItem('cricplus_my_tournament', slug);
        localStorage.setItem(
          'cricplus_my_tournament_meta',
          JSON.stringify({
            slug,
            name: tournament?.name || slug.toUpperCase(),
            orgName: tournament?.organizationName,
          })
        );
      } catch {}

      await refreshProfile();

      setSuccessMsg(
        `🎉 Welcome to ${tournament?.name || slug.toUpperCase()}! Your player profile is registered.`
      );

      // Redirect directly to their tournament hub
      setTimeout(() => {
        router.push(`/tournaments/${slug}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = tournament?.currencySymbol || '₹';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 relative z-10 animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl p-6 sm:p-10 bg-[#0D1B2A]/95 backdrop-blur-xl border border-[#D8AD55]/40 shadow-2xl space-y-6">
        {/* Tournament Brand Card */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 shadow-xl bg-[#08111F] flex items-center justify-center">
            {tournament?.logo ? (
              <img
                src={tournament.logo}
                alt={tournament?.name || 'Tournament Logo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <Trophy className="w-10 h-10 text-[#D8AD55]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-[#D8AD55]" />
              <span>Official Player Invitation</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
              Join {tournament?.name || slug.toUpperCase()}
            </h1>
            {tournament?.organizationName && (
              <p className="text-xs text-[#8793A5] flex items-center justify-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>Hosted by </span>
                <strong className="text-white">{tournament.organizationName}</strong>
                {tournament.country && <span>• {tournament.country}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Quick Format Highlights */}
        {tournament && (
          <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/20 text-xs">
            <div>
              <span className="text-[10px] text-[#8793A5] block">Format</span>
              <strong className="text-white">{tournament.overs || 10} Overs</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8793A5] block">Season</span>
              <strong className="text-white">{tournament.season || '2026'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8793A5] block">Base Price</span>
              <strong className="text-[#D8AD55]">{currencySymbol}{tournament.ownerBasePrice || 500}</strong>
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        {!user && (
          <div className="flex rounded-2xl bg-[#08111F] border border-[#D8AD55]/20 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('create_account');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'create_account'
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow'
                  : 'text-[#8793A5] hover:text-white'
              }`}
            >
              1. Create Account &amp; Join
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow'
                  : 'text-[#8793A5] hover:text-white'
              }`}
            >
              2. Already Have Account? Sign In
            </button>
          </div>
        )}

        {user && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Signed in as <strong>{user.email}</strong>. Complete your cricket role details below to join this tournament.
            </span>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleCreateAccountAndJoin} className="space-y-4 text-xs">
          {/* Section 1: Account Information */}
          <div className="space-y-3 border-b border-[#D8AD55]/15 pb-4">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Player Identity &amp; Contact</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@company.com"
                  value={email}
                  disabled={Boolean(user)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs focus:outline-none focus:border-[#D8AD55] disabled:opacity-50"
                />
              </div>

              {!user && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-gray-300 font-semibold block">
                    {mode === 'create_account' ? 'Create Password (min 6 chars) *' : 'Account Password *'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">WhatsApp / Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Employee ID / Member ID (Optional)</label>
                <input
                  type="text"
                  placeholder="EMP-10482"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cricket Specialism */}
          <div className="space-y-3 pt-1">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Cricket Specialism &amp; Playing Style</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Playing Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold"
                >
                  <option value="All-rounder">All-rounder</option>
                  <option value="Batter">Batter</option>
                  <option value="Bowler">Bowler</option>
                  <option value="Wicket-keeper">Wicket-keeper</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Batting Style</label>
                <select
                  value={battingStyle}
                  onChange={(e) => setBattingStyle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold"
                >
                  <option value="Right-hand bat">Right-hand bat</option>
                  <option value="Left-hand bat">Left-hand bat</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold block">Bowling Style</label>
                <select
                  value={bowlingStyle}
                  onChange={(e) => setBowlingStyle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold"
                >
                  <option value="Right-arm medium">Right-arm medium</option>
                  <option value="Right-arm fast">Right-arm fast</option>
                  <option value="Right-arm off-spin">Right-arm off-spin</option>
                  <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                  <option value="Left-arm medium">Left-arm medium</option>
                  <option value="Left-arm fast">Left-arm fast</option>
                  <option value="Left-arm orthodox">Left-arm orthodox</option>
                  <option value="None">None (Pure Batter)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#08111F] border border-[#D8AD55]/20 text-[11px] text-[#8793A5] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              By joining, you will be enrolled as a <strong>Spectator / Player</strong> in {tournament?.name || slug.toUpperCase()}. You will automatically enter the live auction pool.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-press shimmer-btn w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-xl shadow-[#D8AD55]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Processing Registration…'
                : mode === 'create_account'
                ? `Create Account & Join ${tournament?.name || slug.toUpperCase()}`
                : `Sign In & Join ${tournament?.name || slug.toUpperCase()}`}
            </span>
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href={`/tournaments/${slug}`}
            className="text-xs font-bold text-[#8793A5] hover:text-[#F2D69A] inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Explore {tournament?.name || slug.toUpperCase()} Hub as Spectator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
