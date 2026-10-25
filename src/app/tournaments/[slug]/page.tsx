'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Trophy,
  Calendar,
  Users,
  Gavel,
  Shield,
  Award,
  Settings,
  CheckCircle2,
  DollarSign,
  UserPlus,
  Phone,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Activity,
} from 'lucide-react';
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

  // Sync teams, rules and registration state with live auto-refresh
  useEffect(() => {
    let isMounted = true;

    async function loadTournamentData() {
      try {
        const timestamp = Date.now();
        const [rulesRes, auctionRes, regRes] = await Promise.all([
          fetch(`/api/admin/rules?tournament=${slug}&_t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/auction/data?tournament=${slug}&_t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/tournaments/register?tournament=${slug}&_t=${timestamp}`, { cache: 'no-store' }),
        ]);

        if (!isMounted) return;

        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          if (rData.rules) setRules(rData.rules);
        }

        if (regRes.ok) {
          const regData = await regRes.json();
          if (regData.config) {
            setTournamentConfig(regData.config);
            if (regData.config.season) {
              setSelectedSeason(regData.config.season);
            }
          }
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

    // Live real-time polling every 5s & re-sync upon window focus
    const interval = setInterval(loadTournamentData, 5000);
    const handleFocus = () => loadTournamentData();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
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
        setRegSuccessMsg(data.message || 'Registration confirmed! Added to live auction pool.');
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

  // Derive live status faithfully from tournamentConfig set by Super Admin
  const currentStatus: string = tournamentConfig.status || 'open';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: '● Registration Open',
          text: 'Registrations Open',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-emerald-500/10 animate-pulse',
          rulesBadgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 shadow-sm animate-pulse',
        };
      case 'upcoming':
        return {
          label: 'Upcoming Tournament',
          text: 'Upcoming Tournament',
          badgeClass: 'bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40',
          rulesBadgeClass: 'bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/40 shadow-sm',
        };
      case 'auction':
        return {
          label: '● Auction Live',
          text: 'Auction Live / In Progress',
          badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-400/40 animate-pulse',
          rulesBadgeClass: 'bg-blue-500/15 text-blue-300 border border-blue-400/30 animate-pulse',
        };
      case 'ongoing':
        return {
          label: '● Tournament Ongoing',
          text: 'Tournament Ongoing',
          badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-400/40 animate-pulse',
          rulesBadgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-400/30 animate-pulse',
        };
      case 'closed':
        return {
          label: 'Registration Closed',
          text: 'Registrations Closed',
          badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-400/40',
          rulesBadgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-400/30',
        };
      case 'completed':
        return {
          label: 'Tournament Completed',
          text: 'Tournament Completed',
          badgeClass: 'bg-gray-500/20 text-gray-300 border border-gray-400/30',
          rulesBadgeClass: 'bg-gray-500/15 text-gray-300 border border-gray-400/30',
        };
      default:
        return {
          label: 'Upcoming Tournament',
          text: 'Upcoming Tournament',
          badgeClass: 'bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40',
          rulesBadgeClass: 'bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/40',
        };
    }
  };

  const statusInfo = getStatusBadge(currentStatus);

  const tournament = {
    name: tournamentConfig.name || (isDDPL ? 'DDPL' : 'Game of RUN'),
    fullName: tournamentConfig.fullName || (isDDPL ? 'Desk to Dugout Premier League (DDPL)' : 'Game of RUN Corporate Championship'),
    description: tournamentConfig.tagline || tournamentConfig.description || (
      isDDPL
        ? `Desk to Dugout Premier League for corporate cricket enthusiasts, featuring ${matchOvers}-over innings, live player auctions, and ${teams.length} premier franchises.`
        : `The official annual corporate cricket championship, featuring ${matchOvers}-over innings, full team purse allocations, and corporate department rivalry.`
    ),
    seasons: [tournamentConfig.season || selectedSeason || '2027'],
    overs: matchOvers,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* 1. EDITORIAL HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Official Tournament Hub</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 shadow-2xl shrink-0 bg-[#08111F] flex items-center justify-center">
                <img
                  src={tournamentConfig.logo || '/images/default-tournament.svg'}
                  alt={`${tournament.name} Logo`}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div>
                <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                  {tournament.name}
                </h1>
                <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-wider mt-0.5">
                  {tournament.fullName}
                </div>
              </div>
            </div>

            {tournamentConfig.organizationName && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[#8793A5]">Host Organization:</span>
                {tournamentConfig.organizationSlug ? (
                  <Link
                    href={`/org/${tournamentConfig.organizationSlug}`}
                    className="inline-flex items-center gap-1 text-[#F2D69A] hover:underline font-bold"
                  >
                    <span>{tournamentConfig.organizationName}</span>
                    <ExternalLink className="w-3 h-3 text-[#D8AD55]" />
                  </Link>
                ) : (
                  <span className="text-white font-bold">{tournamentConfig.organizationName}</span>
                )}
                {tournamentConfig.country && (
                  <span className="text-[#8793A5] font-normal">• {tournamentConfig.country}</span>
                )}
                {tournamentConfig.currency && (
                  <span className="px-2 py-0.5 rounded-md bg-[#08111F] border border-[#D8AD55]/30 text-[#D8AD55] text-[10px] font-bold">
                    {tournamentConfig.currency} ({tournamentConfig.currencySymbol || '₹'})
                  </span>
                )}
              </div>
            )}

            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              {tournament.description}
            </p>
          </div>

          {/* Season / Edition Badge */}
          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
              Tournament Edition
            </span>
            {tournament.seasons.length > 1 ? (
              <div className="flex rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 p-1 shadow-md">
                {tournament.seasons.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedSeason(year)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedSeason === year
                        ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow'
                        : 'text-[#8793A5] hover:text-white'
                    }`}
                  >
                    Season {year}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white font-bold text-xs shadow-md">
                Season {tournamentConfig.season || selectedSeason || '2027'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. REGISTRATION CALLOUT BANNER (SYNCED TO AUCTION POOL & ADMIN STATUS) */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md ${
        currentStatus === 'open'
          ? 'bg-[#0D1B2A]/90 border-emerald-500/40 shadow-emerald-500/5'
          : currentStatus === 'auction'
          ? 'bg-[#0D1B2A]/90 border-blue-500/40 shadow-blue-500/5'
          : 'bg-[#0D1B2A]/90 border-[#D8AD55]/30 shadow-black/80'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
            currentStatus === 'open'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
              : currentStatus === 'auction'
              ? 'bg-blue-500/15 text-blue-400 border-blue-400/40'
              : 'bg-[#D8AD55]/15 text-[#D8AD55] border-[#D8AD55]/30'
          }`}>
            {currentStatus === 'auction' ? <Gavel className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs text-[#8793A5] font-mono">
                • {registrations.length} Players Enrolled
              </span>
            </div>
            <h3 className="font-display font-extrabold text-2xl text-white mt-1">
              {currentStatus === 'open'
                ? `Join the Official Player Auction Pool for ${tournament.name}`
                : currentStatus === 'auction'
                ? `Live Player Auction in Progress for ${tournament.name}`
                : currentStatus === 'ongoing'
                ? `Tournament in Progress: ${tournament.name}`
                : currentStatus === 'completed'
                ? `Tournament Completed: ${tournament.name}`
                : currentStatus === 'closed'
                ? `Registrations Closed: ${tournament.name}`
                : `Upcoming Tournament: ${tournament.name}`}
            </h3>
            <p className="text-xs text-[#8793A5] mt-0.5 max-w-xl">
              {currentStatus === 'open'
                ? 'Register your profile and cricket specialism. Upon confirmation, you will automatically enter the live auction pool for franchises to bid on.'
                : currentStatus === 'auction'
                ? 'The franchise player bidding room is now live. Follow real-time bids and team purse updates in the Live Player Auction Room.'
                : currentStatus === 'ongoing'
                ? 'Matches and fixtures are currently underway. Track live scorecards, standings, and player performances.'
                : currentStatus === 'closed'
                ? 'Player registrations for this tournament edition are now closed. Rosters are being finalized for the upcoming auction.'
                : currentStatus === 'completed'
                ? 'This tournament season has concluded. Standings, awards, and historical statistics are finalized.'
                : 'Player registration will open soon once announced by the Super Admin.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {currentStatus === 'open' ? (
            isUserRegistered ? (
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-sm shadow">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>You are in the Auction Pool!</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = `/join/${slug}`;
                  } else {
                    setIsRegModalOpen(true);
                  }
                }}
                className="btn-press shimmer-btn px-7 py-4 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-[#D8AD55]/20 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{user ? 'Register for Tournament' : 'Create Account & Join'}</span>
              </button>
            )
          ) : currentStatus === 'auction' ? (
            <Link
              href={`/auction?tournament=${slug}`}
              className="btn-press shimmer-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-white font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              <span>Enter Live Auction</span>
            </Link>
          ) : currentStatus === 'completed' ? (
            <span className="px-5 py-3 rounded-xl bg-[#08111F] border border-gray-500/30 text-gray-300 font-bold text-xs">
              Tournament Completed
            </span>
          ) : currentStatus === 'ongoing' ? (
            <Link
              href="/matches"
              className="btn-press shimmer-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>View Live Matches</span>
            </Link>
          ) : currentStatus === 'closed' ? (
            <span className="px-5 py-3 rounded-xl bg-[#08111F] border border-rose-500/30 text-rose-300 font-bold text-xs">
              Registrations Closed
            </span>
          ) : (
            <span className="px-5 py-3 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-[#F2D69A] font-bold text-xs">
              Registration Opening Soon
            </span>
          )}
        </div>
      </div>

      {/* Super Admin Share Invite Box */}
      <div className="p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#D8AD55] shrink-0" />
          <div className="text-xs">
            <strong className="text-white block">Official Player Onboarding Invite Link</strong>
            <span className="text-[#8793A5]">Share this link with your organization — players can create an account and enroll in this tournament</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            readOnly
            value={typeof window !== 'undefined' ? `${window.location.origin}/join/${slug}` : `/join/${slug}`}
            className="px-3 py-2 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/20 text-xs text-[#F2D69A] font-mono truncate w-full sm:w-64 select-all"
          />
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/join/${slug}`;
              navigator.clipboard.writeText(url);
              alert('Copied player invite link:\n' + url);
            }}
            className="btn-press px-4 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] text-xs font-bold shrink-0 cursor-pointer"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* 3. ACTION QUICK-NAV BAR */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/auction?tournament=${slug}`}
          className="btn-press shimmer-btn flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:brightness-110"
        >
          <Gavel className="w-4 h-4" />
          <span>Live Player Auction Room</span>
        </Link>
        <Link
          href={`/standings?tournament=${slug}`}
          className="btn-press flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-xs font-bold text-white transition-all"
        >
          <Trophy className="w-4 h-4 text-[#D8AD55]" />
          <span>Points Table &amp; Standings</span>
        </Link>
        <Link
          href={`/teams?tournament=${slug}`}
          className="btn-press flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-xs font-bold text-white transition-all"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Franchises &amp; Squads</span>
        </Link>
        <Link
          href={`/matches?tournament=${slug}`}
          className="btn-press flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-xs font-bold text-white transition-all"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Fixtures &amp; Schedule</span>
        </Link>
      </div>

      {/* 4. RULES & PLAYING CONDITIONS BANNER */}
      <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#D8AD55]/30 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-white">
            <Settings className="w-5 h-5 text-[#D8AD55]" />
            <span>Tournament Rules &amp; Purse Settings ({tournamentConfig.season || selectedSeason})</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${statusInfo.rulesBadgeClass}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5">
            <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Overs / Innings</div>
            <div className="font-display font-bold text-base sm:text-lg text-white">{tournament.overs} Overs</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5">
            <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Max Bowler Quota</div>
            <div className="font-display font-bold text-base sm:text-lg text-emerald-400">
              {rules.maxBowlerOvers || Math.max(1, Math.ceil(tournament.overs / 5))} Ov / Bowler
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5">
            <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Franchise Purse</div>
            <div className="font-display font-bold text-base sm:text-lg text-[#D8AD55]">₹{rules.basePurse?.toLocaleString('en-IN') || '10,000'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5">
            <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Owner Blocked</div>
            <div className="font-display font-bold text-base sm:text-lg text-[#F2D69A]">₹{rules.ownerBlockedPrice || '500'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5">
            <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Squad Limits</div>
            <div className="font-display font-bold text-base sm:text-lg text-white">
              {rules.minSquadSize || 7} - {rules.maxSquadSize || 11}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5">
            <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Base Price</div>
            <div className="font-display font-bold text-base sm:text-lg text-white">₹{rules.defaultPlayerBasePrice || '500'}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5">
            <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Points / Win</div>
            <div className="font-display font-bold text-base sm:text-lg text-cyan-400">{rules.pointsPerWin || 2} Pts</div>
          </div>
        </div>
      </div>

      {/* 5. PARTICIPATING FRANCHISES & SQUAD LEADERSHIP */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D8AD55]" />
            <h2 className="font-display font-black text-2xl text-white tracking-tight">
              Auction Franchises &amp; Current Squads ({teams.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-[#8793A5]">
            Synced Live with Auction Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => (
            <div key={t.short} className="bg-[#0D1B2A]/90 backdrop-blur-md p-6 rounded-3xl border border-[#D8AD55]/30 space-y-4 shadow-xl hover:border-[#D8AD55]/60 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#D8AD55] font-display font-black text-base flex items-center justify-center">
                  {t.short}
                </span>
                <span className="text-xs font-bold text-[#F2D69A] px-2.5 py-1 rounded-full bg-[#08111F] border border-[#D8AD55]/30">
                  {t.squadCount} Players
                </span>
              </div>

              <div>
                <h3 className="font-display font-black text-xl text-white">{t.name}</h3>
                <div className="text-xs text-[#8793A5] mt-0.5">
                  Owner: <span className="text-gray-200 font-semibold">{t.owner}</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8793A5]">Captain:</span>
                  <span className="font-bold text-white truncate max-w-[150px]">{t.captain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8793A5]">Spent in Auction:</span>
                  <span className="font-semibold text-rose-300">₹{t.spent?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#8793A5]">Remaining Purse:</span>
                  <span className="font-black text-[#D8AD55] text-sm">{t.left}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. REGISTERED PLAYERS POOL */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display font-black text-2xl text-white tracking-tight">
              Registered Players ({registrations.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-[#8793A5]">
            Live Player Pool for Auction
          </span>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-[#0D1B2A]/80 backdrop-blur-md p-12 text-center space-y-3 rounded-3xl border border-[#D8AD55]/20">
            <UserPlus className="w-10 h-10 text-[#8793A5] mx-auto opacity-40" />
            <div className="text-sm text-gray-200 font-semibold">No players registered yet</div>
            <p className="text-xs text-[#8793A5] max-w-sm mx-auto">
              Be the first corporate athlete to register for {tournament.name} and enter the auction pool!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {registrations.map((p) => (
              <div
                key={p.id}
                className="bg-[#0D1B2A]/90 backdrop-blur-md p-4 text-center space-y-2 rounded-2xl border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 transition-all shadow-md group"
              >
                <div className="w-16 h-16 rounded-2xl mx-auto overflow-hidden bg-[#08111F] border-2 border-[#D8AD55]/40 group-hover:border-[#D8AD55] flex items-center justify-center font-display font-black text-xl text-[#F2D69A] shadow">
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
                  <div className="text-[11px] text-[#8793A5]">{p.role}</div>
                  {p.isOwner ? (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-[#D8AD55] text-[9px] font-bold uppercase border border-amber-500/30">
                      Owner ({p.franchiseTeam || 'Franchise'})
                    </span>
                  ) : (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                      Auction Pool
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. REGISTRATION MODAL */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1B2A] w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#D8AD55]/40 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsRegModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#08111F] hover:bg-[#111D2D] text-gray-400 hover:text-white transition-colors border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#D8AD55]/15 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#D8AD55] flex items-center justify-center shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-white">
                  Register for {tournament.name}
                </h3>
                <p className="text-xs text-[#8793A5] mt-0.5">
                  Your profile and photo link automatically. Add your contact number to be drafted into the auction pool.
                </p>
              </div>
            </div>

            {regSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="space-y-5 text-sm">
              {/* Profile Card Preview */}
              <div className="p-5 rounded-2xl bg-[#08111F] border border-[#D8AD55]/20 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prefilled from Player Profile</span>
                  </span>
                  <Link
                    href="/profile"
                    className="text-[11px] font-bold text-[#F2D69A] hover:underline"
                  >
                    Edit Profile
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#D8AD55] to-[#F2D69A] p-0.5 shadow-md shrink-0">
                    <div className="w-full h-full bg-[#08111F] rounded-2xl overflow-hidden flex items-center justify-center font-display font-black text-2xl text-[#F2D69A]">
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

                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-lg text-white truncate">
                      {regForm.name || 'Tournament Player'}
                    </div>
                    <div className="text-xs text-[#8793A5] truncate">{regForm.email}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#111D2D] text-[#F2D69A] border border-[#D8AD55]/20 text-[11px] font-semibold">
                        🏏 {regForm.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#111D2D] text-gray-300 border border-white/5 text-[11px]">
                        {regForm.battingStyle}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#111D2D] text-gray-300 border border-white/5 text-[11px]">
                        {regForm.bowlingStyle}
                      </span>
                    </div>
                  </div>
                </div>

                {!regForm.avatarUrl && (
                  <div className="p-3 rounded-xl bg-[#D8AD55]/10 border border-[#D8AD55]/20 text-[#F2D69A] text-xs flex items-center justify-between">
                    <span>No profile photo attached yet. You can upload one anytime in your profile.</span>
                    <Link href="/profile" className="font-bold underline ml-2 shrink-0">
                      Add Photo
                    </Link>
                  </div>
                )}
              </div>

              {/* Phone / WhatsApp Input */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#D8AD55]" />
                    <span>Phone / WhatsApp Number</span>
                    <span className="text-rose-400">*</span>
                  </span>
                  <span className="text-[10px] text-[#F2D69A] uppercase font-mono tracking-wider">
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
                  className="w-full px-4 py-3 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 focus:border-[#D8AD55] text-white text-base tracking-wide outline-none transition-all placeholder:text-gray-500 font-medium"
                />
                <p className="text-[11px] text-[#8793A5] pt-0.5">
                  Franchise owners and tournament organizers will contact you on this number during auctions and team groupings.
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] text-gray-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="btn-press shimmer-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 hover:brightness-110 active:scale-95 transition-all"
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
