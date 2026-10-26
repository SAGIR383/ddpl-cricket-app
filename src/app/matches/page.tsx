'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Activity, ChevronRight, Trophy, Clock, Gavel, MapPin, Sparkles, Download, FileSpreadsheet } from 'lucide-react';
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
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>(`/api/matches?tournament=${selectedTournament}`, { ttlMs: 3000 }),
          fetchWithCache<any>(`/api/admin/rules?tournament=${selectedTournament}`, { ttlMs: 3000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 3000 }),
        ]);

        if (!isMounted) return;

        if (regData?.tournamentsList !== undefined && Array.isArray(regData.tournamentsList)) {
          setTournamentsList(regData.tournamentsList);
          if (regData.tournamentsList.length > 0) {
            setSelectedTournament((prev) => {
              const exists = regData.tournamentsList.some((t: any) => t.slug === prev);
              return exists && prev ? prev : regData.tournamentsList[0].slug;
            });
          }
        }

        const activeTourneyMeta = tournamentsList.find((t) => t.slug === selectedTournament);
        const tourneyLabel = activeTourneyMeta?.name || selectedTournament.toUpperCase();

        let tournamentOvers = 10;
        if (rulesData?.success && rulesData.rules?.matchOvers) {
          tournamentOvers = rulesData.rules.matchOvers;
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
                venue: m.venue || 'Arena Ground 1',
              }))
            );
          }
        }

        // Fallback: If no schedule has been generated yet, pair from current auction franchises
        if (!loadedOfficial) {
          setTournamentStartDate(null);
          setTournamentEndDate(null);
          if (aData?.success && aData.data && aData.data.teams && aData.data.teams.length >= 2) {
            const auctionTeams = aData.data.teams;
            const generated: MatchDisplay[] = [];
            let matchNum = 1;

            for (let i = 0; i < auctionTeams.length; i++) {
              for (let j = i + 1; j < auctionTeams.length; j++) {
                generated.push({
                  id: `match-${matchNum}`,
                  matchNumber: matchNum,
                  tournament: `${tourneyLabel} ${activeTourneyMeta?.season || ''}`.trim(),
                  stage: 'League',
                  title: `Match ${matchNum}: ${auctionTeams[i].short} vs ${auctionTeams[j].short} (${tournamentOvers} Ov)`,
                  teamA: {
                    name: auctionTeams[i].name,
                    short: auctionTeams[i].short,
                    score: 'Yet to bat',
                    overs: '',
                  },
                  teamB: {
                    name: auctionTeams[j].name,
                    short: auctionTeams[j].short,
                    score: 'Yet to bat',
                    overs: '',
                  },
                  matchDate: null,
                  matchTime: '10:00 AM',
                  status: 'upcoming',
                  summary: `${tournamentOvers} Overs round-robin match between ${auctionTeams[i].name} and ${auctionTeams[j].name}.`,
                  venue: 'Arena Ground 1',
                });
                matchNum++;
              }
            }

            setMatches(generated);
          } else {
            setMatches([]);
          }
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
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-14 text-center space-y-4 border border-[#D8AD55]/20 rounded-3xl">
          <Calendar className="w-12 h-12 text-[#8793A5] mx-auto opacity-40" />
          <h3 className="font-display font-black text-2xl text-white">No Match Fixtures Generated Yet</h3>
          <p className="text-sm text-[#8793A5] max-w-md mx-auto">
            Fixtures are paired automatically from auction franchises. Complete the auction or import squads to schedule tournament matches.
          </p>
          <Link
            href="/auction"
            className="btn-press shimmer-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow transition-all hover:brightness-110"
          >
            <Gavel className="w-4 h-4" />
            <span>Go to Live Auction</span>
          </Link>
        </div>
      )}
    </div>
  );
}
