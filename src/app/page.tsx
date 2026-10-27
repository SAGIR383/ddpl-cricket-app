'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Gavel,
  Calendar,
  ArrowRight,
  Activity,
  Flame,
  Award,
  Users,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  MapPin,
  TrendingUp,
  Trash2,
  PlusCircle,
  X,
} from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';
import { useAuth } from '@/contexts/AuthContext';
import { LiveAnnouncementTicker } from '@/components/home/LiveAnnouncementTicker';
import { InteractiveFeatureShowcase } from '@/components/home/InteractiveFeatureShowcase';
import { GlobalMatchRadarMap } from '@/components/home/GlobalMatchRadarMap';
import { GlobalLiveScoresTicker } from '@/components/home/GlobalLiveScoresTicker';
import type { LiveAnnouncementData } from '@/app/api/announcement/route';

interface TournamentCardItem {
  id?: string;
  slug: string;
  name: string;
  shortName?: string;
  fullName: string;
  tagline?: string;
  status: string;
  overs: number;
  teamsCount: number;
  pursePerTeam: number;
  logo: string;
  bannerColor?: string;
}

interface LiveStats {
  tournamentsCount: number;
  teamsCount: number;
  playersCount: number;
  seasonsCount: number;
  ddplTeamsCount: number;
  ddplOvers: number;
  gorOvers: number;
  matchesCount: number;
  liveMatches: any[];
}

export default function HomePage() {
  const { user, isSuperAdmin } = useAuth();
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [newTournamentForm, setNewTournamentForm] = useState({
    name: '',
    shortName: '',
    fullName: '',
    tagline: '',
    season: '2026',
    format: 'ddpl',
    overs: 10,
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 7,
    startDate: '',
    endDate: '',
    status: 'open',
  });

  const [stats, setStats] = useState<LiveStats>({
    tournamentsCount: 0,
    teamsCount: 0,
    playersCount: 0,
    seasonsCount: 0,
    ddplTeamsCount: 0,
    ddplOvers: 10,
    gorOvers: 12,
    matchesCount: 0,
    liveMatches: [],
  });

  const [tournaments, setTournaments] = useState<TournamentCardItem[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<'live' | 'paused' | 'stopped'>('stopped');
  const [liveMatch, setLiveMatch] = useState<any | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState<LiveAnnouncementData | null>(null);
  const [announcements, setAnnouncements] = useState<LiveAnnouncementData[]>([]);
  const [myTournamentMeta, setMyTournamentMeta] = useState<{
    slug: string;
    tournamentName?: string;
    organizationName?: string;
  } | null>(null);

  const handleDeleteTournament = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete tournament "${name}"? This will delete all its matches, auction data, and registrations.`)) {
      return;
    }
    setDeletingSlug(slug);
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_tournament',
          slug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTournaments((prev) => prev.filter((t) => t.slug !== slug));
        setStats((prev) => ({
          ...prev,
          tournamentsCount: Math.max(0, prev.tournamentsCount - 1),
        }));
        setNotification(`Tournament "${name}" permanently deleted.`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to delete tournament');
      }
    } catch (err: any) {
      alert(`Error deleting tournament: ${err.message}`);
    } finally {
      setDeletingSlug(null);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentForm.name.trim()) {
      alert('Please enter a tournament name (e.g. DDPL 2027, Corporate League).');
      return;
    }
    setIsCreatingTournament(true);
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_tournament',
          ...newTournamentForm,
        }),
      });
      const data = await res.json();
      if (data.success && data.tournament) {
        const created: TournamentCardItem = {
          id: data.tournament.slug,
          slug: data.tournament.slug,
          name: data.tournament.name,
          shortName: data.tournament.shortName || data.tournament.name.slice(0, 4),
          fullName: data.tournament.fullName || `${data.tournament.name} Championship`,
          tagline: data.tournament.tagline || 'Official corporate cricket tournament',
          status: data.tournament.status || 'open',
          overs: data.tournament.overs || 10,
          teamsCount: 0,
          pursePerTeam: data.tournament.pursePerTeam || 10000,
          logo: data.tournament.logo || '/images/default-tournament.svg',
        };
        setTournaments((prev) => [...prev, created]);
        setStats((prev) => ({
          ...prev,
          tournamentsCount: prev.tournamentsCount + 1,
        }));
        setIsCreateModalOpen(false);
        setNotification(`Tournament "${data.tournament.name}" created successfully!`);
        setTimeout(() => setNotification(null), 4000);
        setNewTournamentForm({
          name: '',
          shortName: '',
          fullName: '',
          tagline: '',
          season: '2026',
          format: 'ddpl',
          overs: 10,
          pursePerTeam: 10000,
          ownerBasePrice: 500,
          maxSquad: 11,
          minSquad: 7,
          startDate: '',
          endDate: '',
          status: 'open',
        });
      } else {
        alert(data.error || 'Failed to create tournament');
      }
    } catch (err: any) {
      alert(`Error creating tournament: ${err.message}`);
    } finally {
      setIsCreatingTournament(false);
    }
  };

  const refreshAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement');
      if (res.ok) {
        const d = await res.json();
        if (d.announcement) setAnnouncement(d.announcement);
        if (d.announcements && Array.isArray(d.announcements)) setAnnouncements(d.announcements);
      }
    } catch (e) {
      console.warn('Failed to refresh announcement:', e);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cricplus_my_tournament_meta');
        if (stored) {
          setMyTournamentMeta(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      try {
        const [regData, aData, rulesData, matchesData, annData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>('/api/auction/data?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>('/api/admin/rules?tournament=ddpl', { ttlMs: 5000 }),
          fetchWithCache<any>('/api/matches?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>('/api/announcement', { ttlMs: 3000 }),
        ]);

        if (!isMounted) return;

        if (annData?.announcements && Array.isArray(annData.announcements)) {
          setAnnouncements(annData.announcements);
        }
        if (annData?.announcement) {
          setAnnouncement(annData.announcement);
        }

        // Dynamic teams calculation across all tournaments
        const ddplTeams = aData?.data?.teams || [];
        const allTourneys = aData?.allTournaments || {};
        let totalTeams = ddplTeams.length;
        Object.keys(allTourneys).forEach((slug) => {
          if (slug !== 'ddpl' && allTourneys[slug]?.teams) {
            totalTeams += allTourneys[slug].teams.length;
          }
        });

        // Dynamic registered players calculation
        const poolPlayers = aData?.data?.players || [];
        const soldPlayers = aData?.data?.soldPlayers || [];
        const totalPlayers = poolPlayers.length + soldPlayers.length;

        // Dynamic rules overs
        const ddplRules = rulesData?.rules || rulesData?.tournaments?.ddpl;
        const ddplOvers = ddplRules?.matchOvers || 10;
        const gorRules = rulesData?.tournaments?.['game-of-run'];
        const gorOvers = gorRules?.matchOvers || 12;

        // Auction status sync
        const currentAuctionStatus = aData?.data?.auctionStatus || aData?.auctionStatus || 'stopped';
        setAuctionStatus(currentAuctionStatus);

        // Matches sync
        const allMatches: any[] = matchesData?.schedule?.matches || [];
        const live = allMatches.filter((m: any) => m.status === 'live');
        const upcoming = allMatches.filter((m: any) => m.status === 'upcoming' || !m.status);
        setLiveMatch(live.length > 0 ? live[0] : null);
        setUpcomingMatches(upcoming);

        // Tournaments dynamic list sync - Only show tournaments that actually exist in the database
        let baseList: any[] = [];
        if (regData?.tournamentsList !== undefined && Array.isArray(regData.tournamentsList)) {
          baseList = regData.tournamentsList;
        }

        const allConfigs = regData?.allConfigs || {};
        const allAuctionTourneys = aData?.allTournaments || {};
        const allRulesTourneys = rulesData?.tournaments || {};

        const resolvedTourneys: TournamentCardItem[] = baseList.map((t: any) => {
          const slug = t.slug || 'ddpl';
          const cfg = allConfigs[slug] || t;
          const tAuction = allAuctionTourneys[slug] || (slug === 'ddpl' ? aData?.data : null);
          const tRules = allRulesTourneys[slug] || (slug === 'ddpl' ? rulesData?.rules : null);
          const overs = tRules?.matchOvers || cfg.overs || t.overs || (slug === 'game-of-run' ? 12 : 10);
          const tTeams = tAuction?.teams || [];
          const teamsCount = tTeams.length;
          const status = cfg.status || t.status || 'upcoming';

          return {
            id: slug,
            slug,
            name: t.name || cfg.name || slug.toUpperCase(),
            shortName: t.shortName || cfg.shortName || slug.toUpperCase(),
            fullName: t.fullName || cfg.fullName || `${t.name || slug} Cricket Tournament`,
            tagline: t.tagline || cfg.tagline || (slug === 'ddpl' ? 'High-intensity 10-over matches, powerplay restrictions, and intra-department corporate pride.' : 'The flagship corporate championship. Features 12-over matches, group stage showdowns, and playoffs.'),
            status,
            overs,
            teamsCount: teamsCount > 0 ? teamsCount : 0,
            pursePerTeam: cfg.pursePerTeam || t.pursePerTeam || 10000,
            logo: t.logo || cfg.logo || '/images/default-tournament.svg',
            bannerColor: t.bannerColor || cfg.bannerColor,
          };
        });

        setTournaments(resolvedTourneys);

        setStats({
          tournamentsCount: resolvedTourneys.length,
          teamsCount: totalTeams,
          playersCount: totalPlayers,
          seasonsCount: resolvedTourneys.length > 0 ? 1 : 0,
          ddplTeamsCount: ddplTeams.length,
          ddplOvers,
          gorOvers,
          matchesCount: allMatches.length,
          liveMatches: live,
        });
      } catch (err) {
        console.error('Failed to load homepage live stats:', err);
      }
    }

    loadLiveData();

    // Live real-time sync with admin console: poll every 5s & re-sync on focus
    const interval = setInterval(loadLiveData, 5000);
    const handleFocus = () => loadLiveData();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const getTournamentStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: '● Registrations Open',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-500/20 animate-pulse',
        };
      case 'auction':
        return {
          label: '● Auction Live',
          badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20 animate-pulse',
        };
      case 'ongoing':
        return {
          label: '● Tournament Active',
          badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/20 animate-pulse',
        };
      case 'closed':
        return {
          label: 'Registration Closed',
          badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        };
      case 'completed':
        return {
          label: 'Completed',
          badgeClass: 'bg-gray-500/20 text-gray-300 border border-gray-500/40',
        };
      case 'upcoming':
      default:
        return {
          label: 'Upcoming Tournament',
          badgeClass: 'bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40',
        };
    }
  };

  const getLiveEngineIndicator = () => {
    if (liveMatch) {
      return {
        label: 'Match Live',
        subtext: 'Ball-by-Ball',
        badgeColor: 'text-emerald-400',
        pulse: true,
      };
    }
    if (auctionStatus === 'live' && stats.teamsCount > 0 && tournaments.length > 0) {
      return {
        label: 'Auction Live',
        subtext: 'Real-Time',
        badgeColor: 'text-blue-400',
        pulse: true,
      };
    }
    const hasOpen = tournaments.some((t) => t.status === 'open');
    if (hasOpen) {
      return {
        label: 'Reg. Open',
        subtext: 'Live Entry',
        badgeColor: 'text-emerald-400',
        pulse: true,
      };
    }
    return {
      label: 'Standby',
      subtext: 'Platform Engine',
      badgeColor: 'text-[#D8AD55]',
      pulse: false,
    };
  };

  const engineIndicator = getLiveEngineIndicator();

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 relative z-10">
      
      {/* 1. CINEMATIC HERO (Storyboard Panel 1) */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D8AD55]/35 shadow-[0_25px_60px_rgba(0,0,0,0.85)] min-h-[500px] sm:min-h-[560px] lg:min-h-[600px] flex items-center bg-[#08111F]">
        
        {/* Immersive Stadium Photography Background (4K HD Crystal-Clear Sporty Hero) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/cricplus-stadium-4k.jpg"
            alt="CricPlus 4K Cricket Stadium Lights"
            fill
            priority
            unoptimized
            quality={100}
            className="object-cover object-[88%_top] sm:object-[85%_top] md:object-[center_top] filter brightness-[1.06] contrast-[1.16] saturate-[1.20]"
          />
          {/* Cinema Poster Editorial Gradient Scrim: Solid high-contrast deep midnight navy behind text on left, fading smoothly to 100% clear transparency past the pitch */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 md:w-3/5 lg:w-[54%] bg-gradient-to-r from-[#08111F] via-[#08111F]/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-full sm:w-1/2 bg-gradient-to-r from-[#08111F]/60 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08111F] via-[#08111F]/40 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#D8AD55]/25 via-amber-500/10 to-transparent blur-3xl pointer-events-none z-10" />
        </div>

        {/* Content Over Stadium */}
        <div className="relative z-20 max-w-3xl p-6 sm:p-12 lg:p-16 space-y-6">
          
          {/* Eyebrow - Matching Image 1 (Clean Gold Editorial Spaced Text) */}
          <div className="flex items-center gap-2.5 text-[#E5B358] text-[11px] sm:text-xs font-black tracking-[0.22em] uppercase">
            <span>CORPORATE CRICKET</span>
            <span className="w-1 h-1 rounded-full bg-[#E5B358]" />
            <span>COMPETE</span>
            <span className="w-1 h-1 rounded-full bg-[#E5B358]" />
            <span>CONNECT</span>
          </div>

          {/* Master Headline - Progressive Escalating Hierarchy Matching Image 1 */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-editorial tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              <span className="text-white block font-bold text-3xl sm:text-5xl lg:text-[56px] xl:text-[60px] leading-[1.08] sm:leading-[1.04]">
                Every Match.
              </span>
              <span className="text-white block font-bold text-4xl sm:text-6xl lg:text-[72px] xl:text-[76px] leading-[1.05] sm:leading-[1.02]">
                Every Moment.
              </span>
              <span className="text-[#E5A93C] block font-extrabold text-5xl sm:text-7xl lg:text-[90px] xl:text-[96px] leading-[1.0] drop-shadow-[0_0_24px_rgba(229,169,60,0.35)]">
                Every Legend.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-gray-200 font-medium leading-relaxed drop-shadow-md max-w-xl pt-2">
              The premier digital home for corporate cricket leagues. Real-time ball-by-ball scorecards, high-stakes franchise live auctions, verified statistics, and championship archives.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/tournaments"
              className="btn-press shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-[#D8AD55]/25 transition-all"
            >
              <span>Explore Tournaments</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Link>

            <Link
              href="/tournaments/create"
              className="btn-press shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-[#08111F] font-display font-black text-sm sm:text-base tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#08111F]" />
              <span>Host a Tournament</span>
            </Link>

            <Link
              href="/auction"
              className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#111D2D]/90 hover:bg-[#111D2D] border border-[#D8AD55]/40 hover:border-[#D8AD55] text-white font-display font-bold text-sm sm:text-base tracking-wide backdrop-blur-md transition-all shadow-lg"
            >
              <Gavel className="w-4 h-4 text-[#D8AD55]" />
              <span>Live Auction</span>
            </Link>

            <Link
              href="/matches"
              className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-200 font-bold text-sm tracking-wide backdrop-blur-md transition-all"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Matches</span>
            </Link>
          </div>
        </div>

        {/* Live Broadcast Badge (Desktop Float - Dynamically Synced) */}
        <div className="hidden lg:block absolute right-6 bottom-6 z-20 max-w-[280px]">
          <div className="bg-[#0D1B2A]/85 backdrop-blur-md p-4 rounded-2xl border border-[#D8AD55]/30 shadow-2xl space-y-2.5">
            {liveMatch ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live-radar" />
                    Live Match in Progress
                  </span>
                  <span className="text-[10px] font-bold text-[#8793A5]">{liveMatch.stage || 'Live'}</span>
                </div>
                <div>
                  <div className="font-display font-extrabold text-lg text-white">
                    {liveMatch.teamA?.short || liveMatch.teamA?.name || 'Team A'} vs {liveMatch.teamB?.short || liveMatch.teamB?.name || 'Team B'}
                  </div>
                  <p className="text-xs text-[#F2D69A] mt-0.5 font-bold">
                    {liveMatch.teamA?.score || '0/0'} • {liveMatch.teamB?.score || 'Yet to Bat'}
                  </p>
                </div>
                <Link
                  href={`/matches/${liveMatch.id}`}
                  className="block w-full text-center py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-400/40 transition-all"
                >
                  Watch Live Scorecard →
                </Link>
              </>
            ) : (auctionStatus === 'live' && stats.teamsCount > 0 && tournaments.length > 0) ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-black text-blue-400 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Live Auction in Progress
                  </span>
                  <span className="text-[10px] font-bold text-[#8793A5]">Season 2026</span>
                </div>
                <div>
                  <div className="font-display font-extrabold text-lg text-white">Franchise Auction Live</div>
                  <p className="text-xs text-[#8793A5] mt-0.5">
                    {stats.teamsCount} Franchises active. Real-time player bidding arena is live.
                  </p>
                </div>
                <Link
                  href="/auction"
                  className="block w-full text-center py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs border border-blue-400/40 transition-all"
                >
                  Enter Live Auction Arena →
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-black text-[#D8AD55] uppercase tracking-wider">
                    <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
                    Upcoming Season
                  </span>
                  <span className="text-[10px] font-bold text-[#8793A5]">Season 2026</span>
                </div>
                <div>
                  <div className="font-display font-extrabold text-lg text-white">
                    {tournaments.length > 0 ? tournaments.map((t) => t.name).join(' & ') : 'Official Leagues'}
                  </div>
                  <p className="text-xs text-[#8793A5] mt-0.5">
                    {stats.teamsCount > 0 ? `${stats.teamsCount} Franchises confirmed.` : 'Franchise rosters being finalized.'} Official tournaments upcoming.
                  </p>
                </div>
                <Link
                  href="/tournaments"
                  className="block w-full text-center py-2 rounded-xl bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 text-[#F2D69A] font-bold text-xs border border-[#D8AD55]/30 transition-all"
                >
                  Explore Tournaments &amp; Rosters →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* LIVE ANNOUNCEMENT BROADCAST TICKER (Sequential multi-league updates) */}
      <LiveAnnouncementTicker
        announcement={announcement}
        announcements={announcements}
        isSuperAdmin={isSuperAdmin}
        onRefresh={refreshAnnouncement}
      />

      {/* PERSONALIZED USER TOURNAMENT PORTAL BANNER (If logged in employee/player registered for a tournament) */}
      {myTournamentMeta && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#D8AD55]/20 via-[#0D1B2A] to-[#122339] border border-[#D8AD55]/50 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 flex items-center justify-center text-[#D8AD55] shrink-0 shadow-md">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D8AD55] bg-[#D8AD55]/15 px-2 py-0.5 rounded-md border border-[#D8AD55]/30">
                  Your Organization Tournament
                </span>
                {myTournamentMeta.organizationName && (
                  <span className="text-xs text-gray-300 font-semibold hidden xs:inline">
                    • {myTournamentMeta.organizationName}
                  </span>
                )}
              </div>
              <h3 className="font-display font-black text-base sm:text-lg text-white mt-0.5">
                {myTournamentMeta.tournamentName || myTournamentMeta.slug.toUpperCase()}
              </h3>
            </div>
          </div>
          <Link
            href={`/tournaments/${myTournamentMeta.slug}`}
            className="btn-press shimmer-btn shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 flex items-center justify-center gap-2"
          >
            <span>Open Tournament Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* GOOGLE-STYLE GLOBAL LIVE CRICKET SCORES TICKER (BBL, ICC, County, Franchise & Domestic) */}
      <GlobalLiveScoresTicker />

      {/* 2. DYNAMIC LIVE STATS BANNER (Panel 1 Bottom) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#D8AD55]/15 border border-[#D8AD55]/30 flex items-center justify-center text-[#D8AD55] shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8793A5]">
              Official Leagues
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-0.5">
              {stats.tournamentsCount} <span className="text-xs font-bold text-[#D8AD55]">Tournaments</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8793A5]">
              Active Franchises
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-0.5">
              {stats.teamsCount} <span className="text-xs font-bold text-blue-400">Teams</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#D8AD55] shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8793A5]">
              Registered Pool
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-0.5">
              {stats.playersCount} <span className="text-xs font-bold text-[#D8AD55]">Athletes</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 shadow-xl flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            engineIndicator.pulse ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-[#D8AD55]/15 border-[#D8AD55]/30 text-[#D8AD55]'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8793A5]">
              {engineIndicator.subtext}
            </div>
            <div className={`font-display font-black text-xl sm:text-2xl tracking-tight mt-0.5 ${engineIndicator.badgeColor}`}>
              {engineIndicator.label}
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/60 text-white shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-[#D8AD55]" />
          <span>{notification}</span>
        </div>
      )}

      {/* 3. FLAGSHIP TOURNAMENTS SHOWCASE (Storyboard Panel 2) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D8AD55]/15 pb-4">
          <div>
            <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-widest flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Marquee Competitions</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight mt-1">
              Official Tournaments
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link
                href="/tournaments/create"
                className="btn-press shimmer-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs tracking-wider uppercase shadow-md shadow-[#D8AD55]/20 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create Tournament</span>
              </Link>
            )}
            <Link
              href="/tournaments"
              className="text-xs sm:text-sm font-bold text-[#F2D69A] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Tournaments Directory</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Dynamic Tournament Cards Synced to Database & Admin Changes */}
        {tournaments.length === 0 ? (
          <div className="rounded-3xl p-10 bg-[#0D1B2A]/90 border border-[#D8AD55]/30 text-center space-y-4 shadow-xl">
            <Trophy className="w-12 h-12 text-[#D8AD55]/60 mx-auto" />
            <h3 className="font-display font-black text-2xl text-white">No Tournaments Configured</h3>
            <p className="text-xs sm:text-sm text-[#8793A5] max-w-md mx-auto">
              All previous tournaments have been removed. Use the Create Tournament option to initialize a new competition.
            </p>
            {isSuperAdmin && (
              <Link
                href="/tournaments/create"
                className="btn-press shimmer-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Tournament</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {tournaments.map((tourney) => {
              const badge = getTournamentStatusBadge(tourney.status);
              return (
                <div
                  key={tourney.slug}
                  className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/30 shadow-2xl flex flex-col justify-between group hover:border-[#D8AD55]/60 transition-all relative"
                >
                  <div className="p-6 sm:p-8 space-y-5 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#111D2D] border border-white/10 text-white text-xs font-black uppercase tracking-wider">
                          {tourney.name}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Super Admin Delete Option */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteTournament(tourney.slug, tourney.name);
                          }}
                          disabled={deletingSlug === tourney.slug}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                          title={`Permanently delete tournament "${tourney.name}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 shadow-xl shadow-[#D8AD55]/10 shrink-0 bg-[#08111F] flex items-center justify-center">
                        <img
                          src={tourney.logo || '/images/default-tournament.svg'}
                          alt={`${tourney.name} Logo`}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                          {tourney.name}
                        </h3>
                        <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-wider mt-0.5">
                          {tourney.fullName}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {tourney.tagline}
                    </p>

                    {/* Dynamic Metrics */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
                      <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                        <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Match Overs</div>
                        <div className="font-display font-bold text-base sm:text-lg text-white">{tourney.overs} Overs</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                        <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Franchises</div>
                        <div className="font-display font-bold text-base sm:text-lg text-white">{tourney.teamsCount} Teams</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                        <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Auction Purse</div>
                        <div className="font-display font-bold text-base sm:text-lg text-[#D8AD55]">
                          ₹{(tourney.pursePerTeam || 10000).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 relative z-10">
                    <Link
                      href={`/tournaments/${tourney.slug}`}
                      className="btn-press shimmer-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-sm tracking-wider uppercase shadow-lg transition-all"
                    >
                      <span>Enter {tourney.name} Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* INTERACTIVE DEVICE FEATURE SHOWCASE (Matching Visual Reference 1) */}
      <InteractiveFeatureShowcase />

      {/* 4. UPCOMING & LIVE MATCHES SHOWCASE (Storyboard Panel 3) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D8AD55]/15 pb-4">
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${
              liveMatch ? 'text-emerald-400' : 'text-[#D8AD55]'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              <span>{liveMatch ? 'Live Arena Broadcast' : 'Match Schedule & Center'}</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight mt-1">
              {liveMatch ? 'Matches In Progress' : 'Match Center & Fixtures'}
            </h2>
          </div>
          <Link
            href="/matches"
            className="text-xs sm:text-sm font-bold text-[#F2D69A] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Full Schedule &amp; Results</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {stats.liveMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.liveMatches.map((match, idx) => (
              <div
                key={match.id || idx}
                className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-2xl p-5 border border-emerald-500/40 shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#8793A5] uppercase tracking-wider">
                    {match.stage || 'League Stage'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 animate-pulse">
                    ● LIVE
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-base text-white">
                      {match.teamA?.short || match.teamA?.name || 'Team A'}
                    </span>
                    <span className="font-display font-bold text-sm text-[#F2D69A]">
                      {match.teamA?.score || '0/0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-base text-white">
                      {match.teamB?.short || match.teamB?.name || 'Team B'}
                    </span>
                    <span className="font-display font-bold text-sm text-[#F2D69A]">
                      {match.teamB?.score || 'Yet to Bat'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#8793A5]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D8AD55]" />
                    <span>{match.venue || 'Arena Ground'}</span>
                  </span>
                  <Link
                    href={`/matches/${match.id}`}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Match Center →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : upcomingMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {upcomingMatches.slice(0, 3).map((match, idx) => (
              <div
                key={match.id || idx}
                className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-2xl p-5 border border-[#D8AD55]/20 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#D8AD55]/50 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#8793A5] uppercase tracking-wider">
                    {match.stage || `Match ${match.matchNumber || idx + 1}`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30">
                    {match.matchDate ? `${match.matchDate} • ${match.matchTime || '10:00 AM'}` : 'Scheduled'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-base text-white">
                      {match.teamA?.short || match.teamA?.name || match.teamA || 'Team A'}
                    </span>
                    <span className="text-xs font-semibold text-[#8793A5]">
                      Scheduled
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-base text-white">
                      {match.teamB?.short || match.teamB?.name || match.teamB || 'Team B'}
                    </span>
                    <span className="text-xs font-semibold text-[#8793A5]">
                      Scheduled
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#8793A5]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D8AD55]" />
                    <span>{match.venue || 'Arena Ground'}</span>
                  </span>
                  <Link
                    href={`/matches/${match.id}`}
                    className="text-[#D8AD55] font-bold hover:underline"
                  >
                    Match Center →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0D1B2A]/80 backdrop-blur-md rounded-2xl p-8 border border-[#D8AD55]/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#D8AD55] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-white">No Fixtures Currently in Progress</h3>
              <p className="text-xs sm:text-sm text-[#8793A5] max-w-md mx-auto">
                Official tournament match schedules and fixtures are being prepared. Check out tournament rosters and team compositions in the meantime.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/tournaments"
                className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 border border-[#D8AD55]/40 text-[#F2D69A] font-bold text-xs"
              >
                <span>View Tournament Portals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* GLOBAL LIVE MATCH RADAR WORLD MAP (Matching Visual Reference 2) */}
      <GlobalMatchRadarMap />

      {/* 5. EDITORIAL STORYBOARD CALLOUT (Style D Sports Broadcast) */}
      <section className="bg-gradient-to-r from-[#0D1B2A] via-[#111D2D] to-[#0D1B2A] rounded-3xl p-8 sm:p-12 border border-[#D8AD55]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D8AD55]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] text-xs font-bold uppercase tracking-wider border border-[#D8AD55]/30">
            <Flame className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Championship Pedigree</span>
          </div>
          
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Where Corporate Cricket Meets Broadcaster Quality
          </h2>

          <p className="text-sm sm:text-base text-[#8793A5] leading-relaxed">
            Built for passionate athletes, franchise managers, and supporters. CricPlus bridges professional tournament administration with high-octane fan engagement.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href="/archive"
              className="btn-press px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-display font-bold text-sm tracking-wide transition-all"
            >
              Browse 2025 Archive →
            </Link>
            <Link
              href="/standings"
              className="btn-press px-6 py-3 rounded-xl bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 border border-[#D8AD55]/30 text-[#F2D69A] font-display font-bold text-sm tracking-wide transition-all"
            >
              League Standings &amp; Points Table →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CREATE TOURNAMENT MODAL (Super Admin) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border border-[#D8AD55]/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D8AD55]/20 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#D8AD55]" />
                <h3 className="font-display font-black text-2xl text-white">Create New Tournament</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Tournament Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DDPL 2027 or Corporate Championship 2026"
                  value={newTournamentForm.name}
                  onChange={(e) => setNewTournamentForm({ ...newTournamentForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Short Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DDPL or GOR"
                    value={newTournamentForm.shortName}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, shortName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Match Overs</label>
                  <input
                    type="number"
                    min={4}
                    max={50}
                    value={newTournamentForm.overs}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, overs: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Tagline / Description</label>
                <input
                  type="text"
                  placeholder="e.g. High-intensity 10-over matches with powerplay restrictions"
                  value={newTournamentForm.tagline}
                  onChange={(e) => setNewTournamentForm({ ...newTournamentForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Format</label>
                  <select
                    value={newTournamentForm.format}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, format: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  >
                    <option value="ddpl">Round-Robin + Playoffs</option>
                    <option value="game-of-run">Group Stage + Playoffs</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Status</label>
                  <select
                    value={newTournamentForm.status}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  >
                    <option value="open">Registrations Open</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="auction">Auction Stage</option>
                    <option value="ongoing">Tournament Ongoing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Auction Purse (₹)</label>
                  <input
                    type="number"
                    step={500}
                    value={newTournamentForm.pursePerTeam}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, pursePerTeam: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">Base Price (₹)</label>
                  <input
                    type="number"
                    step={100}
                    value={newTournamentForm.ownerBasePrice}
                    onChange={(e) => setNewTournamentForm({ ...newTournamentForm, ownerBasePrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8AD55]/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#08111F] border border-white/10 text-gray-300 font-bold hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTournament}
                  className="btn-press shimmer-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingTournament ? 'Creating Tournament…' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
