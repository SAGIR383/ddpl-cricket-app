'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Activity,
  ChevronRight,
  Trophy,
  Clock,
  Gavel,
  MapPin,
  Sparkles,
  Download,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';
import { downloadIcsCalendar, downloadMatchesCsv } from '@/lib/calendarExport';

interface MatchDisplay {
  id: string;
  matchNumber: number;
  tournament: string;
  stage?: string;
  group?: string | null;
  title: string;
  teamA: { name: string; short: string; score: string; overs: string };
  teamB: { name: string; short: string; score: string; overs: string };
  matchDate?: string | null;
  matchTime?: string | null;
  status: 'upcoming' | 'live' | 'completed' | 'postponed' | 'abandoned';
  summary: string;
  venue: string;
}

export default function MatchesPage() {
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [venueName, setVenueName] = useState<string>('Arena Ground');
  const [franchiseTeams, setFranchiseTeams] = useState<any[]>([]);
  const [tournamentStartDate, setTournamentStartDate] = useState<string | null>(null);
  const [tournamentEndDate, setTournamentEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch official tournament schedule & fixtures using fast client cache
  useEffect(() => {
    let isMounted = true;

    async function loadMatchesFromApi() {
      if (matches.length === 0) setLoading(true);
      try {
        const [regData, mData, rulesData, aData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register', { ttlMs: 20000 }),
          selectedTournament ? fetchWithCache<any>(`/api/matches?tournament=${selectedTournament}`, { ttlMs: 20000 }) : Promise.resolve(null),
          selectedTournament ? fetchWithCache<any>(`/api/admin/rules?tournament=${selectedTournament}`, { ttlMs: 30000 }) : Promise.resolve(null),
          selectedTournament ? fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 20000 }) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        if (regData?.tournamentsList !== undefined && Array.isArray(regData.tournamentsList)) {
          setTournamentsList(regData.tournamentsList);
          if (regData.tournamentsList.length > 0) {
            setSelectedTournament((prev) => {
              const exists = regData.tournamentsList.some((t: any) => t.slug === prev);
              return exists && prev ? prev : regData.tournamentsList[0].slug;
            });
          } else {
            setSelectedTournament('');
            setMatches([]);
            setLoading(false);
            return;
          }
        }

        const activeTourneyMeta = tournamentsList.find((t) => t.slug === selectedTournament);
        const tourneyLabel = activeTourneyMeta?.name || selectedTournament.toUpperCase();

        let tournamentOvers = 10;
        if (rulesData?.success && rulesData.rules?.matchOvers) {
          tournamentOvers = rulesData.rules.matchOvers;
        }

        const officialGround =
          rulesData?.rules?.groundName ||
          rulesData?.rules?.venue ||
          activeTourneyMeta?.venue ||
          'Arena Ground';
        setVenueName(officialGround);

        if (aData?.success && aData.data?.teams && Array.isArray(aData.data.teams)) {
          setFranchiseTeams(aData.data.teams);
        } else if (aData?.data?.teams) {
          setFranchiseTeams(aData.data.teams);
        }

        let loadedOfficial = false;
        if (mData?.schedule) {
          setTournamentStartDate(mData.schedule.startDate || null);
          setTournamentEndDate(mData.schedule.endDate || null);

          if (mData.schedule.matches && mData.schedule.matches.length > 0) {
            loadedOfficial = true;
            setMatches(
              mData.schedule.matches.map((m: any) => ({
                id: m.id,
                matchNumber: m.matchNumber,
                tournament: `${tourneyLabel} ${activeTourneyMeta?.season || ''}`.trim(),
                stage: m.stage || 'League',
                group: m.group || null,
                title: m.title || `Match ${m.matchNumber}: ${m.teamA?.short || m.teamA} vs ${m.teamB?.short || m.teamB}`,
                teamA: {
                  name: m.teamA?.name || m.teamA,
                  short: m.teamA?.short || (m.teamA?.name || m.teamA || '').slice(0, 3).toUpperCase(),
                  score: m.teamA?.score || 'Yet to bat',
                  overs: m.teamA?.overs || '',
                },
                teamB: {
                  name: m.teamB?.name || m.teamB,
                  short: m.teamB?.short || (m.teamB?.name || m.teamB || '').slice(0, 3).toUpperCase(),
                  score: m.teamB?.score || 'Yet to bat',
                  overs: m.teamB?.overs || '',
                },
                matchDate: m.matchDate || null,
                matchTime: m.matchTime || '10:00 AM',
                status: m.status || 'upcoming',
                summary: m.summary || `${tournamentOvers} Overs scheduled fixture between ${m.teamA?.name || m.teamA} and ${m.teamB?.name || m.teamB}.`,
                venue: m.venue || officialGround,
              }))
            );
          }
        }

        // When official schedule is not generated yet, keep matches empty to reflect the pre-auction registration phase
        if (!loadedOfficial) {
          setTournamentStartDate(null);
          setTournamentEndDate(null);
          setMatches([]);
        }
      } catch (err) {
        console.error('Failed to load matches schedule:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMatchesFromApi();

    // Live sync every 5s & re-sync on window focus
    const interval = setInterval(loadMatchesFromApi, 5000);
    const handleFocus = () => loadMatchesFromApi();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedTournament]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ball-by-Ball Arena</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1">
            Matches &amp; Live Fixtures
          </h1>
          <p className="text-sm text-[#8793A5] mt-1.5 max-w-2xl">
            Live ball-by-ball scorecards, match centre radar, and official tournament fixture schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tournament Selector: Only render if multiple tournaments exist */}
          {tournamentsList.length > 1 && (
            <div className="flex rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 p-1 text-xs font-bold shadow-md">
              {tournamentsList.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setSelectedTournament(t.slug)}
                  className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedTournament === t.slug
                      ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow'
                      : 'text-[#8793A5] hover:text-white'
                  }`}
                >
                  {t.name} Fixtures
                </button>
              ))}
            </div>
          )}
          {tournamentsList.length === 1 && (
            <div className="px-4 py-2 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold shadow-md">
              {tournamentsList[0].name} Fixtures
            </div>
          )}

          {/* Export Actions */}
          {matches.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const tourneyName = tournamentsList.find((t) => t.slug === selectedTournament)?.name || selectedTournament;
                  downloadIcsCalendar(tourneyName, matches as any);
                }}
                className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow cursor-pointer"
                title="Add all matches to Google/Apple/Outlook Calendar (.ics)"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Add to Calendar (.ics)</span>
                <span className="sm:hidden">.ics</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tourneyName = tournamentsList.find((t) => t.slug === selectedTournament)?.name || selectedTournament;
                  downloadMatchesCsv(tourneyName, matches as any);
                }}
                className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow cursor-pointer"
                title="Export Tournament Fixture Schedule as CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tournament Dates & Duration Banner (if set by Super Admin) */}
      {tournamentStartDate && tournamentEndDate && (
        <div className="p-5 rounded-2xl bg-[#0D1B2A]/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Official Tournament Schedule Window
              </div>
              <div className="font-display font-extrabold text-lg text-white">
                {tournamentsList.find((t) => t.slug === selectedTournament)?.name || selectedTournament.toUpperCase()}: {tournamentStartDate} to {tournamentEndDate}
              </div>
            </div>
          </div>
          <span className="text-xs text-[#8793A5] font-medium">
            Verified by Tournament Super Admin
          </span>
        </div>
      )}

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((m) => {
            const isPlayoff = m.stage && m.stage !== 'League' && m.stage !== 'Group Stage';

            return (
              <div
                key={m.id}
                className={`bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border transition-all ${
                  m.status === 'live'
                    ? 'border-emerald-500/60 shadow-xl shadow-emerald-500/10'
                    : isPlayoff
                    ? 'border-[#D8AD55]/40 hover:border-[#D8AD55]/70'
                    : 'border-[#D8AD55]/20 hover:border-[#D8AD55]/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Teams & Scores */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
                      <span className="text-xs font-bold text-[#D8AD55] uppercase tracking-wider">
                        {m.tournament}
                      </span>

                      {/* Stage Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                        isPlayoff
                          ? 'bg-[#D8AD55]/15 text-[#F2D69A] border-[#D8AD55]/40 shadow-sm'
                          : 'bg-[#08111F] text-[#F2D69A] border-white/10'
                      }`}>
                        {m.stage || 'League'}
                      </span>

                      {m.group && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                          {m.group}
                        </span>
                      )}

                      <span className="text-xs text-[#8793A5] font-medium">{m.title}</span>

                      {m.status === 'live' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 animate-pulse">
                          ● Live Now
                        </span>
                      ) : m.status === 'completed' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/30">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#08111F] text-[#8793A5] text-xs font-bold border border-white/5">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Team A */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#08111F] border border-white/5">
                        <div>
                          <span className="font-display font-bold text-lg text-white">
                            {m.teamA.name}
                          </span>
                          <div className="text-xs text-[#8793A5] font-semibold">{m.teamA.short}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-black text-xl text-[#F2D69A]">
                            {m.teamA.score}
                          </span>
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#08111F] border border-white/5">
                        <div>
                          <span className="font-display font-bold text-lg text-white">
                            {m.teamB.name}
                          </span>
                          <div className="text-xs text-[#8793A5] font-semibold">{m.teamB.short}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-black text-xl text-gray-300">
                            {m.teamB.score}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Date, Time & Venue */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#8793A5]">
                      {m.matchDate && (
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          {m.matchDate}
                        </span>
                      )}

                      {m.matchTime && (
                        <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {m.matchTime}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-[#D8AD55]" />
                        {m.venue}
                      </span>
                    </div>

                    <div className="text-xs text-[#8793A5]">
                      <span className="font-medium text-gray-300">{m.summary}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex md:flex-col justify-end gap-2 shrink-0">
                    <Link
                      href={`/matches/${m.id}`}
                      className="btn-press shimmer-btn flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider shadow-lg transition-all bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] hover:brightness-110"
                    >
                      <Activity className="w-4 h-4 text-[#08111F]" />
                      <span>Live Scorer Console</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-[#0D1B2A] to-[#08111F] border border-[#D8AD55]/30 shadow-2xl p-6 sm:p-10 space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8AD55]/10 border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>Tournament Auction & Squad Formation Phase</span>
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                Official Fixtures Awaiting Auction & Roster Finalization
              </h3>
              <p className="text-sm text-[#8793A5] max-w-2xl leading-relaxed">
                Tournament franchises are currently being onboarded and registered. Official match pairings, schedules, and the Ball-by-Ball Live Scorer Console will go live as soon as team rosters are finalized following the Player Auction.
              </p>
            </div>

            {/* Configured Ground Badge */}
            <div className="p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/25 flex items-center gap-3 shrink-0">
              <div className="p-2.5 rounded-xl bg-[#D8AD55]/15 text-[#D8AD55]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8793A5]">
                  Official Tournament Ground
                </div>
                <div className="font-display font-bold text-base text-white">
                  {venueName}
                </div>
              </div>
            </div>
          </div>

          {/* Confirmed Franchises Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F2D69A] uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#D8AD55]" />
                <span>Confirmed Registered Franchises ({franchiseTeams.length})</span>
              </div>
              <span className="text-xs text-[#8793A5] italic">
                More franchises joining in coming days
              </span>
            </div>

            {franchiseTeams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {franchiseTeams.map((team: any, idx: number) => {
                  const squadCount = Array.isArray(team.players) ? team.players.length : 1;
                  return (
                    <div
                      key={team.id || team.name || idx}
                      className="p-4 rounded-2xl bg-[#08111F]/80 border border-white/10 hover:border-[#D8AD55]/40 transition-all flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/40 flex items-center justify-center font-display font-black text-sm text-[#F2D69A] shrink-0">
                          {team.short || (team.name ? team.name.slice(0, 2).toUpperCase() : 'TM')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-extrabold text-sm sm:text-base text-white truncate">
                            {team.name}
                          </h4>
                          <p className="text-xs text-[#8793A5] truncate">
                            Owner: <span className="text-gray-300 font-medium">{team.ownerName || 'Franchise Owner'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                          {squadCount} Squad
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#08111F]/60 border border-white/5 text-center text-xs text-[#8793A5]">
                Franchise registrations are currently open. Franchises will appear here once approved by Super Admin.
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/auction"
              className="btn-press shimmer-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg transition-all hover:brightness-110"
            >
              <Gavel className="w-4 h-4" />
              <span>Go to Live Auction</span>
            </Link>

            <Link
              href={`/tournaments/${selectedTournament}`}
              className="btn-press inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-white font-display font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Trophy className="w-4 h-4 text-[#D8AD55]" />
              <span>View Tournament Hub</span>
            </Link>

            <Link
              href="/admin"
              className="btn-press inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-white/10 hover:border-[#D8AD55]/30 text-[#8793A5] hover:text-white font-display font-bold text-xs uppercase tracking-wider transition-all ml-auto"
            >
              <ShieldCheck className="w-4 h-4 text-[#D8AD55]" />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
