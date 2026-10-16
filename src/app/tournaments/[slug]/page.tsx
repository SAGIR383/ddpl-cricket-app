'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Trophy, Calendar, Users, Gavel, Shield, Award, Settings, CheckCircle2, DollarSign, UserPlus, Phone, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function TournamentDetailPage() {
  const params = useParams();
  const slug = (params.slug as string) || 'ddpl';
  const isDDPL = slug === 'ddpl';
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [teams, setTeams] = useState<any[]>([]);
  const [tournamentConfig, setTournamentConfig] = useState<any>({
    status: isDDPL ? 'open' : 'upcoming',
    name: isDDPL ? 'Desk to Dugout Premier League (DDPL)' : 'Game of RUN',
    pursePerTeam: 10000,
    ownerBasePrice: 500,
  });
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState<any>({
    name: '',
    email: '',
    phone: '',
    role: 'All Rounder',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    avatarUrl: '',
  });
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  const [rules, setRules] = useState<any>({
    basePurse: 10000,
    ownerBlockedPrice: 500,
    defaultPlayerBasePrice: 500,
    maxSquadSize: 11,
    minSquadSize: 7,
  });

  // Sync teams, rules and registration state
  useEffect(() => {
    async function loadTournamentData() {
      try {
        const [rulesRes, auctionRes, regRes] = await Promise.all([
          fetch(`/api/admin/rules?tournament=${slug}`),
          fetch(`/api/auction/data?tournament=${slug}`),
          fetch(`/api/tournaments/register?tournament=${slug}`),
        ]);

        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          if (rData.rules) setRules(rData.rules);
        }

        if (regRes.ok) {
          const regData = await regRes.json();
          if (regData.config) setTournamentConfig(regData.config);
          if (regData.registrations) setRegistrations(regData.registrations);
        }

        if (auctionRes.ok) {
          const aData = await auctionRes.json();
          if (aData.data && aData.data.teams) {
            const soldTransactions = aData.data.soldTransactions || [];
            const mappedTeams = aData.data.teams.map((t: any) => {
              const teamSold = soldTransactions.filter((tx: any) => tx.team === t.name);
              const remainingPurse = t.allocated - t.spent;
              const cap = t.captain || (t.owner ? `${t.owner} (C)` : `${t.name} (C)`);
              return {
                name: t.name,
                short: t.short,
                owner: t.owner || 'Franchise Owner',
                captain: cap,
                viceCaptain: t.viceCaptain || 'To be assigned',
                squadCount: teamSold.length || t.playersBought || 1,
                allocated: t.allocated,
                spent: t.spent,
                left: `₹${remainingPurse.toLocaleString('en-IN')}`,
                players: teamSold,
              };
            });
            setTeams(mappedTeams);
          }
        }
      } catch (err) {
        console.error('Failed to load tournament data:', err);
      }
    }

    loadTournamentData();
  }, [slug, selectedSeason]);

  // Load user profile into registration form
  useEffect(() => {
    async function prefillUser() {
      if (!user) return;
      let fetchedProfile: any = null;
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) fetchedProfile = data;
      } catch (err) {
        // Fallback to AuthContext profile
      }

      const activeProfile = fetchedProfile || profile;

      const resolvedName =
        activeProfile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user as any).name ||
        user.email?.split('@')[0] ||
        '';

      const resolvedEmail = activeProfile?.email || user.email || '';
      const resolvedPhone = activeProfile?.phone || '';
      const resolvedRole = activeProfile?.primary_role || 'All Rounder';
      const resolvedBatting = activeProfile?.batting_style || 'Right-hand bat';
      const resolvedBowling = activeProfile?.bowling_style || 'Right-arm medium';
      const resolvedAvatar = activeProfile?.avatar_url || '';

      setRegForm({
        name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        role: resolvedRole,
        battingStyle: resolvedBatting,
        bowlingStyle: resolvedBowling,
        avatarUrl: resolvedAvatar,
      });
    }

    prefillUser();
  }, [user, profile, isRegModalOpen]);

  // Handle Submit Registration
  async function handleSubmitRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!regForm.phone?.trim()) {
      alert('Please enter your Phone / WhatsApp number to complete registration.');
      return;
    }
    setIsSubmittingReg(true);
    setRegSuccessMsg(null);

    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          tournament: slug,
          registration: {
            ...regForm,
            userId: user?.id,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRegSuccessMsg(data.message || 'Registration confirmed!');
        if (data.registrations) setRegistrations(data.registrations);
        if (user?.id && regForm.phone) {
          try {
            await supabase.from('profiles').update({ phone: regForm.phone }).eq('id', user.id);
          } catch (e) {
            // non-blocking
          }
        }
        setTimeout(() => {
          setIsRegModalOpen(false);
          setRegSuccessMsg(null);
        }, 1500);
      } else {
        alert(data.error || 'Failed to submit registration');
      }
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmittingReg(false);
    }
  }

  const isUserRegistered = registrations.some(
    (r) => r.email?.toLowerCase() === user?.email?.toLowerCase()
  );

  const matchOvers = rules.matchOvers || tournamentConfig.overs || (isDDPL ? 10 : 12);

  const tournament = {
    name: tournamentConfig.name || (isDDPL ? 'DDPL' : 'Game of RUN'),
    fullName: tournamentConfig.fullName || (isDDPL ? 'Desk to Dugout Premier League (DDPL)' : 'Game of RUN Corporate Championship'),
    description: tournamentConfig.tagline || tournamentConfig.description || (
      isDDPL
        ? `Desk to Dugout Premier League for corporate cricket enthusiasts, featuring ${matchOvers}-over innings, live player auctions, and ${teams.length} premier franchises.`
        : `The official annual corporate cricket championship, featuring ${matchOvers}-over innings, full team purse allocations, and corporate department rivalry.`
    ),
    seasons: tournamentConfig.season ? [tournamentConfig.season, '2025'] : ['2026', '2025'],
    overs: matchOvers,
    status: selectedSeason === (tournamentConfig.season || '2026') ? (teams.length > 0 ? 'Auction Live / In Progress' : 'Registrations Open') : 'Archive',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-cricket-card to-cricket-dark border border-cricket-border p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cricket-teal border border-blue-500/30 text-xs font-bold uppercase">
              <Trophy className="w-3.5 h-3.5" />
              Tournament Portal
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-[#070d1e]">
                <Image
                  src={tournamentConfig.logo || (slug === 'game-of-run' ? '/images/game-of-run-logo.jpg' : '/images/ddpl-logo.jpg')}
                  alt={`${tournament.name} Logo`}
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-wide">
                {tournament.name}
              </h1>
            </div>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              {tournament.description}
            </p>
          </div>

          {/* Season Selector */}
          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-xs font-semibold text-cricket-muted uppercase tracking-wider">
              Edition / Season
            </span>
            <div className="flex rounded-xl bg-cricket-dark border border-cricket-border p-1">
              {tournament.seasons.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedSeason(year)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSeason === year
                      ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                      : 'text-cricket-muted hover:text-white'
                  }`}
                >
                  Season {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Callout Banner */}
      <div className={`glass-card p-6 sm:p-8 border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 ${
        tournamentConfig.status === 'open'
          ? 'bg-gradient-to-r from-emerald-950/70 via-cricket-card to-blue-950/70 border-emerald-500/50'
          : 'bg-gradient-to-r from-amber-950/50 via-cricket-card to-gray-900/50 border-amber-500/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
            tournamentConfig.status === 'open'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              : 'bg-amber-500/20 text-cricket-gold border-amber-500/30'
          }`}>
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                tournamentConfig.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {tournamentConfig.status === 'open' ? '● Registration Open' : 'Upcoming Tournament'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                • {registrations.length} Players Enrolled
              </span>
            </div>
            <h3 className="font-display font-extrabold text-2xl text-white mt-1">
              {tournamentConfig.status === 'open'
                ? `Join the Official Player Auction Pool for ${tournament.name}`
                : `Upcoming Tournament: ${tournament.name}`}
            </h3>
            <p className="text-xs text-gray-300 mt-0.5 max-w-xl">
              {tournamentConfig.status === 'open'
                ? 'Complete your profile, select your cricket specialism and upload your player photo (max 100 KB) to enter the live auction pool.'
                : 'Player registration will open soon once announced by the Super Admin.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {tournamentConfig.status === 'open' ? (
            isUserRegistered ? (
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-sm shadow">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>You are Registered!</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = `/auth/login?next=/tournaments/${slug}`;
                  } else {
                    setIsRegModalOpen(true);
                  }
                }}
                className="btn-press shimmer-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 hover:brightness-110 text-cricket-dark font-display font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{user ? 'Register for Tournament' : 'Sign In to Register'}</span>
              </button>
            )
          ) : (
            <span className="px-5 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-gray-400 font-bold text-xs">
              Registration Opening Soon
            </span>
          )}
        </div>
      </div>

      {/* Action Navigation Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/auction?tournament=${slug}`}
          className="btn-press shimmer-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-cricket-gold/50 text-sm font-bold text-cricket-gold transition-all shadow-md"
        >
          <Gavel className="w-4 h-4 text-cricket-gold" />
          <span>Live Player Auction Room</span>
        </Link>
        <Link
          href={`/standings?tournament=${slug}`}
          className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-sm font-bold text-white transition-all hover:border-cricket-teal/40"
        >
          <Trophy className="w-4 h-4 text-purple-400" />
          <span>Points Table &amp; Standings</span>
        </Link>
        <Link
          href={`/teams?tournament=${slug}`}
          className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-sm font-bold text-white transition-all hover:border-cricket-teal/40"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Franchises &amp; Squads</span>
        </Link>
        <Link
          href={`/matches?tournament=${slug}`}
          className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-sm font-bold text-white transition-all hover:border-cricket-teal/40"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Fixtures &amp; Schedule</span>
        </Link>
      </div>

      {/* Rules & Playing Conditions Banner */}
      <div className="glass-card p-6 border-l-4 border-l-cricket-teal space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-white">
            <Settings className="w-5 h-5 text-cricket-teal" />
            <span>Tournament Rules &amp; Purse Settings ({selectedSeason})</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
            {tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Overs / Innings</div>
            <div className="font-display font-bold text-lg text-white">{tournament.overs} Overs</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Max Bowler Quota</div>
            <div className="font-display font-bold text-lg text-emerald-400">
              {rules.maxBowlerOvers || Math.max(1, Math.ceil(tournament.overs / 5))} Ov / Bowler
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Franchise Purse</div>
            <div className="font-display font-bold text-lg text-cricket-gold">₹{rules.basePurse?.toLocaleString('en-IN') || '10,000'}</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Owner Blocked</div>
            <div className="font-display font-bold text-lg text-amber-400">₹{rules.ownerBlockedPrice || '500'}</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Squad Limits</div>
            <div className="font-display font-bold text-lg text-white">
              {rules.minSquadSize || 7} - {rules.maxSquadSize || 11}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Base Player Price</div>
            <div className="font-display font-bold text-lg text-white">₹{rules.defaultPlayerBasePrice || '500'}</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Points / Win</div>
            <div className="font-display font-bold text-lg text-cricket-teal">{rules.pointsPerWin || 2} Pts (Tie {Math.max(1, Math.floor((rules.pointsPerWin || 2) / 2))})</div>
          </div>
        </div>
      </div>

      {/* Participating Franchises & Squad Leadership */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-display font-bold text-2xl text-white">
              Auction Franchises &amp; Current Squads ({teams.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-cricket-muted">
            Synced Live with Auction Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teams.map((t) => (
            <div key={t.short} className="glass-card p-5 space-y-4 border border-cricket-border">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 font-display font-bold text-base flex items-center justify-center">
                  {t.short}
                </span>
                <span className="text-xs font-semibold text-cricket-gold px-2 py-0.5 rounded bg-cricket-dark border border-cricket-border">
                  {t.squadCount} Players
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">{t.name}</h3>
                <div className="text-xs text-cricket-muted mt-0.5">Owner: <span className="text-gray-300 font-medium">{t.owner}</span></div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-cricket-border text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cricket-muted">Captain:</span>
                  <span className="font-bold text-white truncate max-w-[140px]">{t.captain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cricket-muted">Spent in Auction:</span>
                  <span className="font-semibold text-rose-300">₹{t.spent?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-cricket-muted">Remaining Purse:</span>
                  <span className="font-bold text-cricket-teal">{t.left}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registered Players Pool */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cricket-teal" />
            <h2 className="font-display font-bold text-2xl text-white">
              Registered Players ({registrations.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-cricket-muted">
            Live Player Pool for Auction
          </span>
        </div>

        {registrations.length === 0 ? (
          <div className="glass-card p-10 text-center space-y-3 border border-cricket-border">
            <UserPlus className="w-8 h-8 text-cricket-muted mx-auto" />
            <div className="text-sm text-gray-300 font-semibold">No players registered yet</div>
            <p className="text-xs text-cricket-muted max-w-sm mx-auto">
              Be the first corporate athlete to register for {tournament.name} and enter the auction!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {registrations.map((p) => (
              <div
                key={p.id}
                className="glass-card p-3 text-center space-y-2 border border-cricket-border hover:border-cricket-teal/50 transition-all shadow-md group"
              >
                <div className="w-16 h-16 rounded-2xl mx-auto overflow-hidden bg-cricket-dark border-2 border-cricket-border group-hover:border-cricket-teal flex items-center justify-center font-display font-bold text-xl text-cricket-teal shadow">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-bold text-white text-sm truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div className="text-[11px] text-cricket-muted">{p.role}</div>
                  {p.isOwner ? (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-cricket-gold text-[9px] font-bold uppercase border border-amber-500/30">
                      Owner ({p.franchiseTeam || 'Franchise'})
                    </span>
                  ) : (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold">
                      Auction Pool
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto border border-emerald-500/40 p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in relative">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-cricket-dark hover:bg-cricket-card text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-cricket-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-2xl text-white">
                  Register for {tournament.name}
                </h3>
                <p className="text-xs text-cricket-muted">
                  Your profile details and photo are linked automatically. Add your phone number to enter the auction pool.
                </p>
              </div>
            </div>

            {regSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="space-y-5 text-sm">
              {/* Prefilled Profile Card with Attached Photo */}
              <div className="p-4 rounded-2xl bg-cricket-dark/90 border border-cricket-border/80 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cricket-border/50">
                  <span className="text-[11px] font-bold text-cricket-teal uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cricket-teal" />
                    <span>Prefilled from Account Profile</span>
                  </span>
                  <Link
                    href="/profile"
                    className="text-[11px] font-semibold text-cricket-gold hover:text-amber-300 underline"
                  >
                    Edit Profile
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  {/* Photo Preview from Profile */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 via-cricket-teal to-amber-400 p-0.5 shadow-md shrink-0">
                    <div className="w-full h-full bg-[#070d1e] rounded-2xl overflow-hidden flex items-center justify-center font-display font-extrabold text-2xl text-cricket-teal">
                      {regForm.avatarUrl ? (
                        <img
                          src={regForm.avatarUrl}
                          alt={regForm.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        regForm.name?.charAt(0)?.toUpperCase() || 'P'
                      )}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-lg text-white truncate">
                      {regForm.name || 'Tournament Player'}
                    </div>
                    <div className="text-xs text-cricket-muted truncate">{regForm.email}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-cricket-card text-emerald-300 border border-cricket-border text-[11px] font-semibold">
                        🏏 {regForm.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cricket-card text-gray-300 border border-cricket-border text-[11px]">
                        {regForm.battingStyle}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cricket-card text-gray-300 border border-cricket-border text-[11px]">
                        {regForm.bowlingStyle}
                      </span>
                    </div>
                  </div>
                </div>

                {!regForm.avatarUrl && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-cricket-gold text-xs flex items-center justify-between">
                    <span>No profile photo attached yet. You can upload one anytime in your profile.</span>
                    <Link href="/profile" className="font-bold underline ml-2 shrink-0">
                      Add Photo
                    </Link>
                  </div>
                )}
              </div>

              {/* ONLY Input Field: Phone / WhatsApp Number */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-cricket-dark/60 border border-cricket-teal/40 shadow-inner">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-cricket-teal" />
                    <span>Phone / WhatsApp Number</span>
                    <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[10px] text-cricket-gold uppercase font-mono tracking-wider">
                    Required for Auction
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  autoFocus
                  placeholder="e.g. +91 98765 43210"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-cricket-dark border border-cricket-border focus:border-cricket-teal focus:ring-1 focus:ring-cricket-teal text-white text-base tracking-wide outline-none transition-all placeholder:text-gray-500 font-medium"
                />
                <p className="text-[11px] text-cricket-muted pt-0.5">
                  Franchise owners and tournament organizers will contact you on this number during auctions and team groupings.
                </p>
              </div>

              <div className="pt-3 border-t border-cricket-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-cricket-dark hover:bg-cricket-card text-gray-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-cricket-dark font-display font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {isSubmittingReg ? 'Confirming…' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
