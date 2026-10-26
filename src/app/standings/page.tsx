'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  BarChart3,
  ChevronRight,
  HelpCircle,
  Users,
  Gavel,
  Calendar,
  Sparkles,
  Swords,
  TrendingUp,
  ShieldCheck,
  Award,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';
import { TeamStandingRow, calculateHeadToHead, HeadToHeadStats } from '@/lib/tournamentAnalytics';
import { generateExecutiveTournamentDossierPDF, TournamentDossierData } from '@/lib/pdfGenerator';
import { generateTournamentExcelReport } from '@/lib/excelGenerator';

export default function StandingsPage() {
  const [selectedTournament, setSelectedTournament] = useState<string>('ddpl');
  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [tournamentsList, setTournamentsList] = useState<any[]>([
    { slug: 'ddpl', name: 'DDPL', season: '2026' },
    { slug: 'game-of-run', name: 'Game of RUN', season: '2026' },
  ]);
  const [standings, setStandings] = useState<TeamStandingRow[]>([]);
  const [completedMatches, setCompletedMatches] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDossier = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const activeMeta = tournamentsList.find((t) => t.slug === selectedTournament) || {
        slug: selectedTournament,
        name: selectedTournament.toUpperCase(),
      };
      const [rulesData, auctionData, matchesData, analyticsData] = await Promise.all([
        fetchWithCache<any>(`/api/admin/rules?tournament=${selectedTournament}`, { ttlMs: 10000 }),
        fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 10000 }),
        fetchWithCache<any>(`/api/matches?tournament=${selectedTournament}`, { ttlMs: 10000 }),
        fetchWithCache<any>(`/api/analytics/tournament?tournament=${selectedTournament}`, { ttlMs: 5000 }),
      ]);

      const dossierPayload: TournamentDossierData = {
        tournament: {
          slug: selectedTournament,
          name: activeMeta.name || selectedTournament.toUpperCase(),
          organizationName: activeMeta.organizationName || 'Corporate League Foundation',
          season: selectedSeason,
          overs: rulesData?.rules?.matchOvers || 10,
          basePurse: rulesData?.rules?.basePurse || 10000,
        },
        standings: standings,
        teams: auctionData?.data?.teams || [],
        soldTransactions: auctionData?.data?.soldTransactions || [],
        matches: matchesData?.schedule?.matches || [],
        orangeCap: analyticsData?.leaderboards?.orangeCap || [],
        purpleCap: analyticsData?.leaderboards?.purpleCap || [],
        mvpList: analyticsData?.leaderboards?.mvp || [],
      };

      if (format === 'pdf') {
        generateExecutiveTournamentDossierPDF(dossierPayload);
      } else {
        generateTournamentExcelReport(dossierPayload);
      }
    } catch (err: any) {
      alert('Failed to export report: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Head to Head Selector State
  const [h2hTeamA, setH2hTeamA] = useState<string>('');
  const [h2hTeamB, setH2hTeamB] = useState<string>('');

  // Sync standings from active Analytics API
  useEffect(() => {
    let isMounted = true;

    async function loadTournamentStandings() {
      if (standings.length === 0) setLoading(true);
      try {
        const [regData, analyticsData, auctionData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 30000 }),
          fetchWithCache<any>(`/api/analytics/tournament?tournament=${selectedTournament}`, { ttlMs: 5000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 10000 }),
        ]);

        if (!isMounted) return;

        if (regData?.tournamentsList && regData.tournamentsList.length > 0) {
          setTournamentsList(regData.tournamentsList);
        }

        const soldTx = auctionData?.data?.soldTransactions || [];

        if (analyticsData?.success && analyticsData.standings && analyticsData.standings.length > 0) {
          const mapped = analyticsData.standings.map((st: TeamStandingRow) => {
            const teamSquad = soldTx.filter((tx: any) => tx.team === st.name);
            return {
              ...st,
              squadCount: teamSquad.length || st.squadCount || 0,
            };
          });

          setStandings(mapped);
          setCompletedMatches(analyticsData.completedMatches || 0);

          if (mapped.length >= 2) {
            setH2hTeamA(mapped[0].name);
            setH2hTeamB(mapped[1].name);
          }
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

  // Head-to-Head calculations
  const h2hStats: HeadToHeadStats = useMemo(() => {
    if (!h2hTeamA || !h2hTeamB) {
      return {
        teamA: 'Team A',
        teamB: 'Team B',
        totalPlayed: 0,
        teamAWins: 0,
        teamBWins: 0,
        ties: 0,
        teamAHighestScore: 110,
        teamBHighestScore: 105,
        predictedWinProbA: 50,
        predictedWinProbB: 50,
        keyMatchups: ['Both franchises neck and neck on net run rate.'],
      };
    }
    return calculateHeadToHead(h2hTeamA, h2hTeamB);
  }, [h2hTeamA, h2hTeamB]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Championship Table &amp; Analytics</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1">
            Points Table &amp; Net Run Rate
          </h1>
          <p className="text-sm text-[#8793A5] mt-1.5 max-w-2xl">
            Live tournament standings calculated dynamically with official ICC NRR rules, playoff qualification indicators, and form guide.
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
              {completedMatches > 0 ? `${completedMatches} Matches Completed` : 'Live Synced'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExportDossier('pdf')}
              className="btn-press shimmer-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] text-xs font-bold shadow-md hover:brightness-110 cursor-pointer disabled:opacity-50"
              title="Download Executive Tournament Dossier (PDF)"
            >
              <FileDown className="w-3.5 h-3.5 text-[#08111F]" />
              <span>Dossier PDF</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExportDossier('excel')}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              title="Download Official Standings & Ledger (Excel .xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel Report</span>
            </button>
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded-xl bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold transition-all flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Caps</span>
            </Link>
          </div>
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
                  <th className="px-5 py-4 text-center">Form</th>
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
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                              title="Playoff Qualification Zone"
                            />
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
                          {team.squadCount || 0} Players
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
                        {team.nrrStr || (team.nrr >= 0 ? `+${team.nrr.toFixed(3)}` : team.nrr.toFixed(3))}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {team.form && team.form.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            {team.form.map((res, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shadow-sm ${
                                  res === 'W'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                                    : res === 'L'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">-</span>
                        )}
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

      {/* HEAD-TO-HEAD & AI MATCHUP PREDICTOR */}
      {standings.length >= 2 && (
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white">
                  Head-to-Head &amp; AI Matchup Predictor
                </h3>
                <p className="text-xs text-[#8793A5]">
                  Compare historical rivalry, win probabilities, and tactical strengths between any two franchises
                </p>
              </div>
            </div>

            {/* Franchise Selectors */}
            <div className="flex items-center gap-2">
              <select
                value={h2hTeamA}
                onChange={(e) => setH2hTeamA(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#08111F] border border-cyan-500/40 text-cyan-300 text-xs font-bold"
              >
                {standings.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="text-xs font-bold text-gray-500">vs</span>
              <select
                value={h2hTeamB}
                onChange={(e) => setH2hTeamB(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#08111F] border border-cyan-500/40 text-cyan-300 text-xs font-bold"
              >
                {standings
                  .filter((t) => t.name !== h2hTeamA)
                  .map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Probability Gauge Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-cyan-400">
                {h2hTeamA}: {h2hStats.predictedWinProbA}% Win Probability
              </span>
              <span className="text-emerald-400">
                {h2hTeamB}: {h2hStats.predictedWinProbB}% Win Probability
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                style={{ width: `${h2hStats.predictedWinProbA}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${h2hStats.predictedWinProbB}%` }}
              />
            </div>
          </div>

          {/* Stats Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#08111F] border border-white/5 text-center space-y-1">
              <span className="text-gray-400 uppercase font-semibold">Total Meetings</span>
              <div className="font-display font-black text-2xl text-white">
                {h2hStats.totalPlayed}
              </div>
              <div className="text-[11px] text-[#8793A5]">
                {h2hStats.teamAWins} wins - {h2hStats.teamBWins} wins
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#08111F] border border-white/5 text-center space-y-1">
              <span className="text-gray-400 uppercase font-semibold">Highest Head-to-Head Total</span>
              <div className="font-display font-black text-2xl text-[#F2D69A]">
                {h2hStats.teamAHighestScore} vs {h2hStats.teamBHighestScore}
              </div>
              <div className="text-[11px] text-[#8793A5]">Match high points</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#08111F] border border-white/5 text-center space-y-1">
              <span className="text-gray-400 uppercase font-semibold">Key Rivalry Factor</span>
              <div className="font-display font-bold text-xs text-white line-clamp-2 mt-1">
                {h2hStats.keyMatchups[1] || 'Boundary conversion in death overs'}
              </div>
            </div>
          </div>
        </div>
      )}

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
          Franchises and squads are synchronized directly with verified live matches and auction rosters. Net Run Rate (NRR) is calculated as (Total Runs Scored / Total Overs Faced) minus (Total Runs Conceded / Total Overs Bowled). Top 4 franchises secure direct playoff qualification.
        </div>
      </div>
    </div>
  );
}
