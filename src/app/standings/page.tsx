'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, BarChart3, ChevronRight, HelpCircle, Users, Gavel, Calendar } from 'lucide-react';

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
  const [selectedTournament, setSelectedTournament] = useState<'ddpl' | 'game-of-run'>('ddpl');
  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync standings from active Auction State
  useEffect(() => {
    async function loadTournamentStandings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/auction/data?tournament=${selectedTournament}`);
        const data = await res.json();

        if (data.success && data.data && data.data.teams && data.data.teams.length > 0) {
          const auctionTeams = data.data.teams;
          const soldTransactions = data.data.soldTransactions || [];

          // Map teams directly from auction state with fresh 0 stats prior to match results
          const mappedStandings: StandingTeam[] = auctionTeams.map((t: any, index: number) => {
            const teamSquadMembers = soldTransactions.filter((tx: any) => tx.team === t.name);
            return {
              rank: index + 1,
              name: t.name,
              short: t.short,
              owner: t.owner,
              played: 0,
              won: 0,
              lost: 0,
              tied: 0,
              noResult: 0,
              points: 0,
              runsFor: 0,
              oversFor: 0.0,
              runsAgainst: 0,
              oversAgainst: 0.0,
              nrr: 0.0,
              squadCount: teamSquadMembers.length || t.playersBought || 1,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cricket-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-cricket-gold" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Points Table &amp; Standings
            </h1>
          </div>
          <p className="text-sm text-cricket-muted mt-1">
            Official tournament rankings synchronized with live auction squads and official Net Run Rate (NRR) rules.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
          >
            <option value="ddpl">DDPL</option>
            <option value="game-of-run">Game of RUN</option>
          </select>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-xs font-bold"
          >
            <option value="2026">Season 2026 (Active)</option>
            <option value="2025">Season 2025 (Archive)</option>
          </select>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="glass-card overflow-hidden border border-cricket-border shadow-2xl">
        <div className="p-4 bg-gradient-to-r from-blue-950 via-cricket-card to-cricket-dark border-b border-cricket-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl text-white">
              {selectedTournament === 'ddpl' ? 'DDPL' : 'Game of RUN'} — {selectedSeason} Season Standings
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              Synced with Auction Squads
            </span>
          </div>
          <span className="text-xs text-emerald-400 font-bold">
            Top 2 Qualify for Grand Finale
          </span>
        </div>

        <div className="overflow-x-auto">
          {standings.length > 0 ? (
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                <tr>
                  <th className="px-4 py-3.5 text-center">#</th>
                  <th className="px-4 py-3.5">Franchise</th>
                  <th className="px-3 py-3.5 text-center">Squad</th>
                  <th className="px-3 py-3.5 text-center">P</th>
                  <th className="px-3 py-3.5 text-center">W</th>
                  <th className="px-3 py-3.5 text-center">L</th>
                  <th className="px-3 py-3.5 text-center">T</th>
                  <th className="px-3 py-3.5 text-center">NR</th>
                  <th className="px-4 py-3.5 text-center font-bold text-white">PTS</th>
                  <th className="px-4 py-3.5 text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cricket-border">
                {standings.map((team) => (
                  <tr
                    key={team.name}
                    className="hover:bg-cricket-card/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-center font-display font-black text-base text-gray-300">
                      {team.rank}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm">{team.name}</div>
                      <div className="text-[11px] text-cricket-muted flex items-center gap-1.5">
                        <span className="font-semibold text-cricket-teal">{team.short}</span>
                        {team.owner && <span>• Owner: {team.owner}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-cricket-dark text-xs font-bold text-cricket-gold border border-cricket-border">
                        {team.squadCount} Players
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center font-semibold text-gray-300">{team.played}</td>
                    <td className="px-3 py-3.5 text-center text-emerald-400 font-bold">{team.won}</td>
                    <td className="px-3 py-3.5 text-center text-rose-400 font-bold">{team.lost}</td>
                    <td className="px-3 py-3.5 text-center text-gray-400">{team.tied}</td>
                    <td className="px-3 py-3.5 text-center text-gray-400">{team.noResult}</td>
                    <td className="px-4 py-3.5 text-center font-display font-black text-xl text-cricket-gold">
                      {team.points}
                    </td>
                    <td className="px-4 py-3.5 text-right font-display font-bold text-base text-cricket-teal">
                      {team.nrr > 0 ? `+${team.nrr.toFixed(3)}` : team.nrr.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center space-y-3">
              <Trophy className="w-12 h-12 text-cricket-muted mx-auto" />
              <div className="font-display font-bold text-lg text-white">No Standings Data Yet</div>
              <p className="text-xs text-cricket-muted max-w-sm mx-auto">
                Once the auction is conducted for this tournament, franchises and rosters will populate automatically.
              </p>
              <Link
                href="/auction"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-teal/40 text-cricket-teal text-xs font-bold transition-all"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Go to Live Auction</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Net Run Rate Information Footnote */}
      <div className="p-4 rounded-xl bg-cricket-card/50 border border-cricket-border flex items-start gap-3 text-xs text-cricket-muted">
        <HelpCircle className="w-4 h-4 shrink-0 text-cricket-teal mt-0.5" />
        <div>
          <strong className="text-gray-200">How Standings &amp; Points Table Operate:</strong>{' '}
          Franchises and squads are synchronized directly with the live Auction section. Matches scheduled in the tournament will increment Played (P), Won (W), Lost (L), and Points (2 for Win, 1 for Tie/No Result), with tie-breakers decided by Net Run Rate (NRR).
        </div>
      </div>
    </div>
  );
}
