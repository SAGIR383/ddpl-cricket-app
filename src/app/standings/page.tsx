'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, BarChart3, ChevronRight, HelpCircle, Users, Gavel, Calendar, Sparkles } from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';

interface StandingTeam {
  rank: number;
  name: string;
  short: string;
  owner?: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  oversFor: number;
  runsAgainst: number;
  oversAgainst: number;
  nrr: number;
  squadCount?: number;
}

export default function StandingsPage() {
  const [selectedTournament, setSelectedTournament] = useState<string>('ddpl');
  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [tournamentsList, setTournamentsList] = useState<any[]>([
    { slug: 'ddpl', name: 'DDPL', season: '2026' },
    { slug: 'game-of-run', name: 'Game of RUN', season: '2026' },
  ]);
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync standings from active Auction State using client cache
  useEffect(() => {
    let isMounted = true;

    async function loadTournamentStandings() {
      if (standings.length === 0) setLoading(true);
      try {
        const [regData, data] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 30000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 10000 }),
        ]);

        if (!isMounted) return;

        if (regData?.tournamentsList && regData.tournamentsList.length > 0) {
          setTournamentsList(regData.tournamentsList);
        }

        if (data?.success && data.data && data.data.teams && data.data.teams.length > 0) {
          const auctionTeams = data.data.teams;
          const soldTransactions = data.data.soldTransactions || [];

          // Map teams directly from auction state with fresh 0 stats prior to match results
          const mappedStandings: StandingTeam[] = auctionTeams.map((t: any, idx: number) => {
            const teamSquad = soldTransactions.filter((tx: any) => tx.team === t.name);
            return {
              rank: idx + 1,
              name: t.name,
              short: t.short,
              owner: t.owner || 'Franchise Owner',
              played: 0,
              won: 0,
              lost: 0,
              tied: 0,
              noResult: 0,
              points: 0,
              runsFor: 0,
              oversFor: 0,
              runsAgainst: 0,
              oversAgainst: 0,
              nrr: 0.0,
              squadCount: teamSquad.length || t.playersBought || 0,
            };
          });

          setStandings(mappedStandings);
        } else {
          setStandings([]);
        }
      } catch (err) {
        console.error('Failed to load tournament standings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTournamentStandings();
  }, [selectedTournament, selectedSeason]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Championship Table</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1">
            Points Table &amp; Standings
          </h1>
          <p className="text-sm text-[#8793A5] mt-1.5 max-w-2xl">
            Official tournament rankings synchronized with live auction squads and official Net Run Rate (NRR) rules.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
          >
            {tournamentsList.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
          >
            <option value="2026">Season 2026 (Active)</option>
            <option value="2025">Season 2025 (Archive)</option>
          </select>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/30 shadow-2xl">
        <div className="p-5 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-black text-xl text-white">
              {tournamentsList.find((t) => t.slug === selectedTournament)?.name || selectedTournament.toUpperCase()} — {selectedSeason} Standings
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold border border-blue-500/30">
              Synced Live
            </span>
          </div>
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 badge-live-radar" />
            Top 4 Advance to Playoffs
          </span>
        </div>

        <div className="overflow-x-auto">
          {standings.length > 0 ? (
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-[#08111F] text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                <tr>
                  <th className="px-5 py-4 text-center">#</th>
                  <th className="px-5 py-4">Franchise</th>
                  <th className="px-4 py-4 text-center">Squad</th>
                  <th className="px-4 py-4 text-center">P</th>
                  <th className="px-4 py-4 text-center">W</th>
                  <th className="px-4 py-4 text-center">L</th>
                  <th className="px-4 py-4 text-center">T</th>
                  <th className="px-4 py-4 text-center">NR</th>
                  <th className="px-5 py-4 text-center font-black text-white">PTS</th>
                  <th className="px-5 py-4 text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((team) => {
                  const isPlayoffZone = team.rank <= 4;
                  return (
                    <tr
                      key={team.name}
                      className={`hover:bg-white/[0.04] transition-colors ${
                        isPlayoffZone ? 'bg-emerald-500/[0.03]' : ''
                      }`}
                    >
                      <td className="px-5 py-4 text-center font-display font-black text-base text-gray-300">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{team.rank}</span>
                          {isPlayoffZone && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Playoff Qualification Zone" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{team.name}</span>
                          {isPlayoffZone && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold uppercase tracking-wider">
                              Playoffs
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8793A5] flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-[#D8AD55]">{team.short}</span>
                          {team.owner && <span>• Owner: {team.owner}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-[#08111F] text-xs font-bold text-[#F2D69A] border border-[#D8AD55]/30">
                          {team.squadCount} Players
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-300">{team.played}</td>
                      <td className="px-4 py-4 text-center text-emerald-400 font-bold">{team.won}</td>
                      <td className="px-4 py-4 text-center text-rose-400 font-bold">{team.lost}</td>
                      <td className="px-4 py-4 text-center text-gray-400">{team.tied}</td>
                      <td className="px-4 py-4 text-center text-gray-400">{team.noResult}</td>
                      <td className="px-5 py-4 text-center font-display font-black text-xl text-[#D8AD55]">
                        {team.points}
                      </td>
                      <td className="px-5 py-4 text-right font-display font-bold text-base text-[#F2D69A]">
                        {team.nrr > 0 ? `+${team.nrr.toFixed(3)}` : team.nrr.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center space-y-4">
              <Trophy className="w-12 h-12 text-[#8793A5] mx-auto opacity-40" />
              <div className="font-display font-bold text-lg text-white">No Standings Data Yet</div>
              <p className="text-xs text-[#8793A5] max-w-sm mx-auto">
                Once the auction is conducted for this tournament, franchises and rosters will populate automatically.
              </p>
              <Link
                href="/auction"
                className="btn-press shimmer-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 border border-[#D8AD55]/40 text-[#F2D69A] text-xs font-bold transition-all"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Go to Live Auction</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tournament Playoff & Knockout Stage Pathway */}
      <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#D8AD55]/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-white">
            <Trophy className="w-5 h-5 text-[#D8AD55]" />
            <span>Knockout Pathway: League Stage ➔ Playoffs ➔ Grand Final</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold border border-blue-500/30 self-start sm:self-auto">
            Official League Structure
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#08111F] border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider">Stage 1: Group League</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Round Robin</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Franchises play round-robin matches. Top teams on points and NRR advance to the Playoffs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#08111F] border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-400 uppercase tracking-wider">Stage 2: Playoffs</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">Top 4 Teams</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Qualifier 1, Eliminator, and Qualifier 2. The 2 victorious teams advance to the Grand Final.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#08111F] border border-[#D8AD55]/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#D8AD55] uppercase tracking-wider">Stage 3: Grand Final</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Championship</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              The two playoff champions compete in the Grand Final for the official corporate tournament trophy!
            </p>
          </div>
        </div>
      </div>

      {/* Net Run Rate Information Footnote */}
      <div className="p-4 rounded-2xl bg-[#0D1B2A]/60 border border-[#D8AD55]/15 flex items-start gap-3 text-xs text-[#8793A5]">
        <HelpCircle className="w-4 h-4 shrink-0 text-[#D8AD55] mt-0.5" />
        <div>
          <strong className="text-gray-200">How Standings &amp; Points Table Operate:</strong>{' '}
          Franchises and squads are synchronized directly with the live Auction section. Matches scheduled in the tournament will increment Played (P), Won (W), Lost (L), and Points (2 for Win, 1 for Tie/No Result), with tie-breakers decided by Net Run Rate (NRR).
        </div>
      </div>
    </div>
  );
}
