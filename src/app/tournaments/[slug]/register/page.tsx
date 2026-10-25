'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Trophy,
  UserPlus,
  Phone,
  Mail,
  User,
  Shield,
  Briefcase,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Gavel,
  Check,
  Copy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithCache } from '@/lib/clientCache';

export default function PlayerTournamentRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) || 'ddpl';
  const { user, profile } = useAuth();

  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('All-rounder');
  const [battingStyle, setBattingStyle] = useState('Right-hand bat');
  const [bowlingStyle, setBowlingStyle] = useState('Right-arm medium');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Prefill from profile/user if authenticated
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
      if (profile.primary_role) setRole(profile.primary_role);
      if (profile.batting_style) setBattingStyle(profile.batting_style);
      if (profile.bowling_style) setBowlingStyle(profile.bowling_style);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
    }
  }, [user, profile]);

  // Fetch tournament config
  useEffect(() => {
    async function loadConfig() {
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
        setLoading(false);
      }
    }

    loadConfig();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      alert('Please provide your phone / WhatsApp number for auction coordination.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_player',
          slug,
          player: {
            name: name.trim(),
            email: email.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@player.local`,
            phone: phone.trim(),
            role,
            battingStyle,
            bowlingStyle,
            employeeId: employeeId.trim() || undefined,
            avatarUrl: avatarUrl.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsRegistered(true);
      } else {
        alert(data.error || 'Failed to submit registration. Please try again.');
      }
    } catch (err: any) {
      alert(`Registration error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = tournament?.currencySymbol || (slug === 'game-of-run' ? 'د.إ' : '₹');
  const basePrice = tournament?.ownerBasePrice || 500;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/tournaments/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#8793A5] hover:text-[#F2D69A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {tournament?.name || slug.toUpperCase()}</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Player Onboarding Portal</span>
        </span>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0D1B2A] via-[#111D2D] to-[#0D1B2A] border-2 border-[#D8AD55]/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-[#08111F] border-2 border-[#D8AD55]/40 p-2 shadow-xl shrink-0 flex items-center justify-center font-display font-black text-2xl text-[#F2D69A]">
            {tournament?.logo ? (
              <img
                src={tournament.logo}
                alt={tournament?.name || 'Tournament Logo'}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Trophy className="w-10 h-10 text-[#D8AD55]" />
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D8AD55]">
              {tournament?.organizationName || 'Corporate League'}
            </span>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
              Register for {tournament?.name || slug.toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              Join the official player auction pool. Complete your cricket bio and contact details to get drafted by corporate franchises.
            </p>
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION SCREEN */}
      {isRegistered ? (
        <div className="rounded-3xl p-8 sm:p-12 bg-[#0D1B2A]/90 border-2 border-emerald-500/50 shadow-2xl text-center space-y-6 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-black text-3xl text-white">
              Registration Confirmed!
            </h2>
            <p className="text-sm text-gray-300 max-w-md mx-auto">
              Welcome aboard, <strong className="text-white">{name}</strong>! Your player profile is successfully registered for{' '}
              <strong className="text-[#F2D69A]">{tournament?.name || slug.toUpperCase()}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#08111F] border border-white/10 max-w-sm mx-auto text-xs space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-gray-400">Player Name:</span>
              <span className="font-bold text-white">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role:</span>
              <span className="font-bold text-[#F2D69A]">{role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Base Price:</span>
              <span className="font-bold text-emerald-400">{currencySymbol}{basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Auction Status:</span>
              <span className="font-bold text-blue-400">Queued for Live Auction</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href={`/auction?tournament=${slug}`}
              className="btn-press shimmer-btn px-6 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              <span>Watch Live Auction Room</span>
            </Link>
            <Link
              href={`/tournaments/${slug}`}
              className="px-6 py-3 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-white/10 text-white text-xs font-bold transition-colors"
            >
              Back to Tournament Hub
            </Link>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <form onSubmit={handleSubmit} className="rounded-3xl p-6 sm:p-8 bg-[#0D1B2A]/90 border border-[#D8AD55]/30 shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-white">Player Information</h2>
              <p className="text-xs text-[#8793A5]">All fields marked with * are required for auction drafting</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold">
              Base: {currencySymbol}{basePrice}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-200 block">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#D8AD55] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shakil Anowar"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-200 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#D8AD55] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. employee@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-200 block">
                Phone / WhatsApp Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#D8AD55] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>

            {/* Employee ID / Department */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-200 block">
                Corporate Employee ID / Department
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-[#D8AD55] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-1049 (Finance) or Senior Consultant"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-200 block">Primary Cricket Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
              >
                <option value="Top-order Batter">Top-order Batter</option>
                <option value="Middle-order Batter">Middle-order Batter</option>
                <option value="Wicket-Keeper Batter">Wicket-Keeper Batter</option>
                <option value="All-rounder">All-rounder</option>
                <option value="Fast Bowler">Fast Bowler</option>
                <option value="Spin Bowler">Spin Bowler</option>
              </select>
            </div>

            {/* Batting Style */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-200 block">Batting Hand</label>
              <select
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
              >
                <option value="Right-hand bat">Right-hand bat</option>
                <option value="Left-hand bat">Left-hand bat</option>
              </select>
            </div>

            {/* Bowling Style */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-200 block">Bowling Style</label>
              <select
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
              >
                <option value="Right-arm fast">Right-arm fast</option>
                <option value="Right-arm medium">Right-arm medium</option>
                <option value="Right-arm off-spin">Right-arm off-spin</option>
                <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                <option value="Left-arm fast">Left-arm fast</option>
                <option value="Left-arm orthodox">Left-arm orthodox</option>
                <option value="Does not bowl">Does not bowl</option>
              </select>
            </div>

            {/* Avatar Photo URL */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-200 block">
                Profile Photo URL (Optional)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-3 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              By submitting, your player profile will be queued into the official auction draft.
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-press shimmer-btn px-6 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Submitting Registration...' : 'Submit Player Registration'}
            </button>
          </div>
        </form>
      )}

      {/* Shareable Invite Card */}
      <div className="rounded-2xl p-4 bg-[#08111F] border border-[#D8AD55]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-300">
          <Sparkles className="w-4 h-4 text-[#D8AD55]" />
          <span>Share this registration link with your corporate colleagues and teammates!</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const url = typeof window !== 'undefined' ? window.location.href : '';
            navigator.clipboard.writeText(url);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 border border-[#D8AD55]/40 text-[#F2D69A] font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copied Link' : 'Copy Registration Link'}</span>
        </button>
      </div>
    </div>
  );
}
