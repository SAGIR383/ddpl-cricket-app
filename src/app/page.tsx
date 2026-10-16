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
} from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';

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
  const [stats, setStats] = useState<LiveStats>({
    tournamentsCount: 2,
    teamsCount: 6,
    playersCount: 18,
    seasonsCount: 2,
    ddplTeamsCount: 6,
    ddplOvers: 8,
    gorOvers: 12,
    matchesCount: 0,
    liveMatches: [],
  });

  const [tournaments, setTournaments] = useState<TournamentCardItem[]>([
    {
      slug: 'ddpl',
      name: 'DDPL',
      shortName: 'DDPL',
      fullName: 'Desk to Dugout Premier League (DDPL)',
      tagline: 'High-intensity 10-over matches, powerplay restrictions, and intra-department corporate pride.',
      status: 'upcoming',
      overs: 10,
      teamsCount: 6,
      pursePerTeam: 10000,
      logo: '/images/ddpl-logo.jpg',
    },
    {
      slug: 'game-of-run',
      name: 'Game of RUN',
      shortName: 'GOR',
      fullName: 'Game of RUN Championship',
      tagline: 'The flagship corporate championship. Features 12-over matches, group stage showdowns, and playoffs.',
      status: 'upcoming',
      overs: 12,
      teamsCount: 6,
      pursePerTeam: 10000,
      logo: '/images/game-of-run-logo.jpg',
    },
  ]);

  const [auctionStatus, setAuctionStatus] = useState<'live' | 'paused' | 'stopped'>('stopped');
  const [liveMatch, setLiveMatch] = useState<any | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      try {
        const [regData, aData, rulesData, matchesData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>('/api/auction/data?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>('/api/admin/rules?tournament=ddpl', { ttlMs: 5000 }),
          fetchWithCache<any>('/api/matches?tournament=ddpl', { ttlMs: 3000 }),
        ]);

        if (!isMounted) return;

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

        // Tournaments dynamic list sync
        const rawTourneys = regData?.tournamentsList || [];
        const allConfigs = regData?.allConfigs || {};
        const allAuctionTourneys = aData?.allTournaments || {};
        const allRulesTourneys = rulesData?.tournaments || {};

        const baseList = rawTourneys.length > 0 ? rawTourneys : [
          {
            slug: 'ddpl',
            name: 'DDPL',
            shortName: 'DDPL',
            fullName: 'Desk to Dugout Premier League (DDPL)',
            tagline: 'High-intensity 10-over matches, powerplay restrictions, and intra-department corporate pride.',
            status: 'upcoming',
            overs: 10,
            pursePerTeam: 10000,
            logo: '/images/ddpl-logo.jpg',
          },
          {
            slug: 'game-of-run',
            name: 'Game of RUN',
            shortName: 'GOR',
            fullName: 'Game of RUN Championship',
            tagline: 'The flagship corporate championship. Features 12-over matches, group stage showdowns, and playoffs.',
            status: 'upcoming',
            overs: 12,
            pursePerTeam: 10000,
            logo: '/images/game-of-run-logo.jpg',
          },
        ];

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
            teamsCount: teamsCount > 0 ? teamsCount : (slug === 'ddpl' ? 6 : 6),
            pursePerTeam: cfg.pursePerTeam || t.pursePerTeam || 10000,
            logo: t.logo || cfg.logo || (slug === 'game-of-run' ? '/images/game-of-run-logo.jpg' : '/images/ddpl-logo.jpg'),
            bannerColor: t.bannerColor || cfg.bannerColor,
          };
        });

        setTournaments(resolvedTourneys);

        setStats({
          tournamentsCount: resolvedTourneys.length,
          teamsCount: totalTeams > 0 ? totalTeams : 6,
          playersCount: totalPlayers > 0 ? totalPlayers : 18,
          seasonsCount: 2,
          ddplTeamsCount: ddplTeams.length > 0 ? ddplTeams.length : 6,
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
    if (auctionStatus === 'live') {
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
      label: 'Pre-Season',
      subtext: 'Live Engine',
      badgeColor: 'text-[#D8AD55]',
      pulse: false,
    };
  };

  const engineIndicator = getLiveEngineIndicator();

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 relative z-10">
      
      {/* 1. CINEMATIC HERO (Storyboard Panel 1) */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D8AD55]/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] min-h-[500px] sm:min-h-[580px] flex items-center bg-[#08111F]">
        
        {/* Immersive Stadium Photography Background (4K High Quality Sporty Hero) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/cricket-hero.jpg"
            alt="Cricket Stadium Stadium Lights"
            fill
            priority
            className="object-cover object-right sm:object-center filter brightness-[0.92] contrast-[1.06] saturate-[1.10] scale-105 transition-transform duration-1000"
          />
          {/* Balanced directional vignette protecting text legibility on the left while leaving batsman, sparks & CricPlus jumbotron clearly visible on the right */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-4/5 md:w-3/5 bg-gradient-to-r from-[#08111F]/90 via-[#08111F]/60 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#08111F] via-[#08111F]/50 to-transparent z-10" />
          <div className="absolute inset-0 bg-[#08111F]/15 z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#D8AD55]/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none z-10" />
        </div>

        {/* Content Over Stadium */}
        <div className="relative z-20 max-w-3xl p-6 sm:p-12 lg:p-16 space-y-6">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111D2D]/90 border border-[#D8AD55]/40 text-[#F2D69A] text-[11px] sm:text-xs font-black tracking-widest uppercase backdrop-blur-md shadow-lg shadow-[#D8AD55]/10">
            <span className="w-2 h-2 rounded-full bg-[#D8AD55] animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Corporate Cricket • Compete • Connect</span>
          </div>

          {/* Master Headline - Style D Editorial */}
          <div className="space-y-3">
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[0.98] drop-shadow-2xl">
              Every Match.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F2D69A] to-[#D8AD55]">
                Every Moment.
              </span>
              <br />
              <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                Every Legend.
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-[#F7F5F0]/85 font-medium leading-relaxed drop-shadow max-w-xl pt-1">
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
              href="/auction"
              className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-[#111D2D]/90 hover:bg-[#111D2D] border border-[#D8AD55]/40 hover:border-[#D8AD55] text-white font-display font-bold text-sm sm:text-base tracking-wide backdrop-blur-md transition-all shadow-lg"
            >
              <Gavel className="w-4 h-4 text-[#D8AD55]" />
              <span>Live Auction Room</span>
            </Link>

            <Link
              href="/matches"
              className="btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-200 font-bold text-sm tracking-wide backdrop-blur-md transition-all"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Match Center</span>
            </Link>
          </div>
        </div>

        {/* Live Broadcast Badge (Desktop Float - Dynamically Synced) */}
        <div className="hidden lg:block absolute right-12 bottom-12 z-20 max-w-xs">
          <div className="bg-[#0D1B2A]/75 backdrop-blur-md p-5 rounded-2xl border border-[#D8AD55]/30 shadow-2xl space-y-3">
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
            ) : auctionStatus === 'live' ? (
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
                  <div className="font-display font-extrabold text-lg text-white">DDPL &amp; Game of RUN</div>
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
              {stats.playersCount}+ <span className="text-xs font-bold text-[#D8AD55]">Athletes</span>
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
          <Link
            href="/tournaments"
            className="text-xs sm:text-sm font-bold text-[#F2D69A] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Tournaments Directory</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dynamic Tournament Cards Synced to Database & Admin Changes */}
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
                    <span className="px-3 py-1 rounded-full bg-[#111D2D] border border-white/10 text-white text-xs font-black uppercase tracking-wider">
                      {tourney.name} 2026 Edition
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 shadow-xl shadow-[#D8AD55]/10 shrink-0 bg-[#08111F]">
                      <Image
                        src={tourney.logo}
                        alt={`${tourney.name} Logo`}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform"
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
      </section>

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

    </div>
  );
}
