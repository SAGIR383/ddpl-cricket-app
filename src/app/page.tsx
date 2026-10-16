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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      try {
        const [regData, aData, rulesData, matchesData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 15000 }),
          fetchWithCache<any>('/api/auction/data?tournament=ddpl', { ttlMs: 10000 }),
          fetchWithCache<any>('/api/admin/rules?tournament=ddpl', { ttlMs: 20000 }),
          fetchWithCache<any>('/api/matches?tournament=ddpl', { ttlMs: 15000 }),
        ]);

        if (!isMounted) return;

        // Dynamic teams calculation
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
        const ddplOvers = ddplRules?.matchOvers || 8;
        const gorRules = rulesData?.tournaments?.['game-of-run'];
        const gorOvers = gorRules?.matchOvers || 12;

        // Tournaments count
        const tourneysList = regData?.tournamentsList || [];
        const tournamentsCount = tourneysList.length > 0 ? tourneysList.length : 2;

        // Matches
        const fixtures = matchesData?.schedule?.matches || [];
        const liveOrUpcoming = fixtures.slice(0, 3);

        setStats({
          tournamentsCount,
          teamsCount: totalTeams > 0 ? totalTeams : 6,
          playersCount: totalPlayers > 0 ? totalPlayers : 18,
          seasonsCount: 2,
          ddplTeamsCount: ddplTeams.length > 0 ? ddplTeams.length : 6,
          ddplOvers,
          gorOvers,
          matchesCount: fixtures.length,
          liveMatches: liveOrUpcoming,
        });
      } catch (err) {
        console.error('Failed to load homepage live stats:', err);
      }
    }

    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 relative z-10">
      
      {/* 1. CINEMATIC HERO (Storyboard Panel 1) */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D8AD55]/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] min-h-[500px] sm:min-h-[580px] flex items-center bg-[#08111F]">
        
        {/* Immersive Stadium Photography Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/cricket-hero.jpg"
            alt="Cricket Stadium Stadium Lights"
            fill
            priority
            className="object-cover object-center filter brightness-[0.72] contrast-[1.2] scale-105 transition-transform duration-1000"
          />
          {/* Style D Midnight Vignette & Gold Atmospheric Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08111F] via-[#08111F]/85 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08111F] via-transparent to-[#08111F]/70 z-10" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#08111F]/30 to-[#08111F] z-10" />
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
              <span>Live Matches</span>
            </Link>
          </div>
        </div>

        {/* Live Broadcast Badge (Desktop Float) */}
        <div className="hidden lg:block absolute right-12 bottom-12 z-20 max-w-xs">
          <div className="bg-[#0D1B2A]/90 backdrop-blur-xl p-5 rounded-2xl border border-[#D8AD55]/40 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-black text-[#D8AD55] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live-radar" />
                Live League Hub
              </span>
              <span className="text-[10px] font-bold text-[#8793A5]">Season 2026</span>
            </div>
            <div>
              <div className="font-display font-extrabold text-lg text-white">DDPL &amp; Game of RUN</div>
              <p className="text-xs text-[#8793A5] mt-0.5">
                {stats.teamsCount} Franchises confirmed. Live auction engine active with automated purse tracking.
              </p>
            </div>
            <Link
              href="/auction"
              className="block w-full text-center py-2 rounded-xl bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 text-[#F2D69A] font-bold text-xs border border-[#D8AD55]/30 transition-all"
            >
              Enter Live Auction →
            </Link>
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
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8793A5]">
              Live Engine
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-0.5">
              100% <span className="text-xs font-bold text-emerald-400">Real-Time</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* DDPL Card */}
          <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/30 shadow-2xl flex flex-col justify-between group hover:border-[#D8AD55]/60 transition-all relative">
            <div className="p-6 sm:p-8 space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300 text-xs font-black uppercase tracking-wider">
                  DDPL 2026 Edition
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live-radar" />
                  Active Tournament
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-xl shadow-blue-500/10 shrink-0 bg-[#08111F]">
                  <Image
                    src="/images/ddpl-logo.jpg"
                    alt="DDPL Logo"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                    DDPL
                  </h3>
                  <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-wider mt-0.5">
                    Desk to Dugout Premier League (DDPL)
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                High-intensity {stats.ddplOvers}-over matches, powerplay restrictions, and intra-department corporate pride. Features {stats.ddplTeamsCount} premier franchises battling for the championship trophy.
              </p>

              {/* Dynamic Metrics */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                  <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Match Overs</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">{stats.ddplOvers} Overs</div>
                </div>
                <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                  <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Franchises</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">{stats.ddplTeamsCount} Teams</div>
                </div>
                <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                  <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Auction Purse</div>
                  <div className="font-display font-bold text-base sm:text-lg text-[#D8AD55]">10,000 Pts</div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 relative z-10">
              <Link
                href="/tournaments/ddpl"
                className="btn-press shimmer-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 hover:brightness-110 text-white font-display font-black text-sm tracking-wider uppercase shadow-lg transition-all"
              >
                <span>Enter DDPL Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Game of RUN Card */}
          <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/30 shadow-2xl flex flex-col justify-between group hover:border-[#D8AD55]/60 transition-all relative">
            <div className="p-6 sm:p-8 space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-[#D8AD55]/40 text-[#F2D69A] text-xs font-black uppercase tracking-wider">
                  Game of RUN 2026
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#D8AD55]">
                  <span className="w-2 h-2 rounded-full bg-[#D8AD55] animate-pulse" />
                  Registrations Open
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 shadow-xl shadow-[#D8AD55]/10 shrink-0 bg-[#08111F]">
                  <Image
                    src="/images/game-of-run-logo.jpg"
                    alt="Game of RUN Logo"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                    Game of RUN
                  </h3>
                  <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-wider mt-0.5">
                    Official Corporate Championship
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                The flagship corporate championship. Features {stats.gorOvers}-over matches, group stage showdowns, playoffs, and the crowning of the ultimate corporate cricket champion.
              </p>

              {/* Dynamic Metrics */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                  <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Match Overs</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">{stats.gorOvers} Overs</div>
                </div>
                <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                  <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Format</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">Group + Finals</div>
                </div>
                <div className="p-3 rounded-xl bg-[#08111F] border border-white/5">
                  <div className="text-[10px] sm:text-[11px] text-[#8793A5] font-semibold">Auction Purse</div>
                  <div className="font-display font-bold text-base sm:text-lg text-[#D8AD55]">₹10K / Team</div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 relative z-10">
              <Link
                href="/tournaments/game-of-run"
                className="btn-press shimmer-btn w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-sm tracking-wider uppercase shadow-lg transition-all"
              >
                <span>Enter Game of RUN Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 4. UPCOMING & LIVE MATCHES SHOWCASE (Storyboard Panel 3) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D8AD55]/15 pb-4">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ball-by-Ball Live Arena</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight mt-1">
              Match Center &amp; Fixtures
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
                className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-2xl p-5 border border-[#D8AD55]/20 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#D8AD55]/50 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#8793A5] uppercase tracking-wider">
                    {match.stage || 'League Stage'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    match.status === 'live'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 animate-pulse'
                      : 'bg-white/5 text-gray-300 border border-white/10'
                  }`}>
                    {match.status === 'live' ? '● LIVE' : match.matchTime || 'Upcoming'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-base text-white">
                      {match.teamA?.short || match.teamA?.name || 'Team A'}
                    </span>
                    <span className="font-display font-bold text-sm text-[#F2D69A]">
                      {match.teamA?.score || 'Yet to Bat'}
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
                Official DDPL &amp; Game of RUN tournament matches are being scheduled. Check out the auction room or team rosters in the meantime.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/matches"
                className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 border border-[#D8AD55]/40 text-[#F2D69A] font-bold text-xs"
              >
                <span>View Full Fixture Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5. LEAGUE ECOSYSTEM PILLARS (Panels 4, 5, 6, 7) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link
          href="/auction"
          className="bg-[#0D1B2A]/90 hover:bg-[#111D2D] p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 shadow-xl space-y-3 group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-[#D8AD55]/15 text-[#D8AD55] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Gavel className="w-6 h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-[#F2D69A] transition-colors">
            Live Auction Room
          </h4>
          <p className="text-xs text-[#8793A5] leading-relaxed hidden sm:block">
            30-second live bidding countdown, purse deduction, franchise balance management, and 1-tap undo rollback.
          </p>
        </Link>

        <Link
          href="/standings"
          className="bg-[#0D1B2A]/90 hover:bg-[#111D2D] p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 shadow-xl space-y-3 group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-emerald-300 transition-colors">
            Official Standings
          </h4>
          <p className="text-xs text-[#8793A5] leading-relaxed hidden sm:block">
            Points table with automated Net Run Rate (NRR), head-to-head records, qualification thresholds, and form guides.
          </p>
        </Link>

        <Link
          href="/leaderboard"
          className="bg-[#0D1B2A]/90 hover:bg-[#111D2D] p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 shadow-xl space-y-3 group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-[#D8AD55] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-[#F2D69A] transition-colors">
            Cap Leaderboards
          </h4>
          <p className="text-xs text-[#8793A5] leading-relaxed hidden sm:block">
            Orange Cap top run-scorers, Purple Cap leading wicket-takers, sixes hit, strike rates, and MVP player rankings.
          </p>
        </Link>

        <Link
          href="/archive"
          className="bg-[#0D1B2A]/90 hover:bg-[#111D2D] p-5 sm:p-6 rounded-2xl border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 shadow-xl space-y-3 group transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-xl text-white group-hover:text-purple-300 transition-colors">
            Historical Vault
          </h4>
          <p className="text-xs text-[#8793A5] leading-relaxed hidden sm:block">
            Multi-edition championship archives, past trophy holders, individual honors, and immortalized corporate glory.
          </p>
        </Link>
      </section>

    </div>
  );
}
