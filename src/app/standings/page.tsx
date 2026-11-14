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
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
  const [activeTournamentConfig, setActiveTournamentConfig] = useState<any>(null);
  const [activeTournamentRules, setActiveTournamentRules] = useState<any>(null);
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

  // Group Filter Tab State (For Multi-Group Tournaments)
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>('all');

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    standings.forEach((st) => {
      if (st.group) set.add(st.group);
    });
    return Array.from(set).sort();
  }, [standings]);

  const displayedStandings = useMemo(() => {
    if (selectedGroupTab === 'all' || availableGroups.length <= 1) return standings;
    return standings.filter((st) => st.group === selectedGroupTab);
  }, [standings, selectedGroupTab, availableGroups]);

  // Sync standings from active Analytics API
  useEffect(() => {
    let isMounted = true;

    async function loadTournamentStandings() {
      if (standings.length === 0) setLoading(true);
      try {
        // 1. Fetch available tournaments from register API
        const regListRes = await fetchWithCache<any>('/api/tournaments/register', { ttlMs: 10000 });
        const list = Array.isArray(regListRes?.tournamentsList) ? regListRes.tournamentsList : [];
        if (!isMounted) return;
        setTournamentsList(list);

        if (list.length === 0) {
          setSelectedTournament('');
          setSelectedSeason('');
          setActiveTournamentConfig(null);
          setStandings([]);
          setLoading(false);
          return;
        }

        const activeTournament = list.find((t: any) => t.slug === selectedTournament) || list[0];
        const activeSlug = activeTournament.slug;
        if (selectedTournament !== activeSlug) {
          setSelectedTournament(activeSlug);
        }
        const resolvedSeason = activeTournament.season || selectedSeason || new Date().getFullYear().toString();
        setSelectedSeason(resolvedSeason);

        const [regData, analyticsData, auctionData, rulesData] = await Promise.all([
          fetchWithCache<any>(`/api/tournaments/register?tournament=${activeSlug}`, { ttlMs: 10000 }),
          fetchWithCache<any>(`/api/analytics/tournament?tournament=${activeSlug}`, { ttlMs: 10000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${activeSlug}`, { ttlMs: 15000 }),
          fetchWithCache<any>(`/api/admin/rules?tournament=${activeSlug}`, { ttlMs: 10000 }),
        ]);

        if (!isMounted) return;

        if (regData?.config) {
          setActiveTournamentConfig(regData.config);
          if (regData.config.season) {
            setSelectedSeason(regData.config.season);
          }
        }
        if (rulesData?.rules) {
          setActiveTournamentRules(rulesData.rules);
        }

        const soldTx = auctionData?.data?.soldTransactions || [];

        if (analyticsData?.success && analyticsData.standings && analyticsData.standings.length > 0) {
          const rawTeams = auctionData?.data?.teams || [];
          const mapped = analyticsData.standings.map((st: TeamStandingRow) => {
            const teamSquad = soldTx.filter((tx: any) => tx.team === st.name);
            const foundTeam = rawTeams.find((t: any) => t.name?.toLowerCase() === st.name?.toLowerCase());
            return {
              ...st,
              group: st.group || foundTeam?.group || undefined,
              squadCount: teamSquad.length || foundTeam?.players?.length || st.squadCount || 0,
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
        if (isMounted) setLoading(false);
      }
    }

    loadTournamentStandings();
  }, [selectedTournament]);

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
        teamAHighestScore: 0,
        teamBHighestScore: 0,
        predictedWinProbA: 50,
        predictedWinProbB: 50,
        keyMatchups: ['Awaiting tournament encounter between these two franchises.'],
      };
    }
    return calculateHeadToHead(h2hTeamA, h2hTeamB);
  }, [h2hTeamA, h2hTeamB]);

  // Dynamic Knockout Pathway computed from superadmin rules and tournament configuration
  const dynamicPathway = useMemo(() => {
    const cfg = activeTournamentConfig || {};
    const r = activeTournamentRules || {};

    // 1. If superadmin set explicit custom stages or pathway in rules
    if (r.stages && Array.isArray(r.stages) && r.stages.length > 0) {
      return {
        title: r.pathwayTitle || `Knockout Pathway: ${cfg.name || 'Tournament'} Structure`,
        badge: r.pathwayBadge || 'Official Tournament Rules',
        stages: r.stages,
        qualificationRule: r.qualificationRule || 'Top teams advance to the knockout semi-finals / finals based on points and Net Run Rate (NRR).',
      };
    }

    // 2. Derive structure from tournament format / knockoutFormat
    const kFormat = r.knockoutFormat || (cfg.groupsCount > 1 ? 'group_stage_knockout' : cfg.format === 'game-of-run' ? 'direct_final' : 'ipl_playoffs');

    if (kFormat === 'direct_final') {
      return {
        title: 'Knockout Pathway: League Stage ➔ Grand Final',
        badge: 'Top 2 Direct Final',
        stages: [
          {
            title: 'Stage 1: Round Robin League',
            badge: 'All Play All',
            desc: `Franchises play round-robin fixtures (${cfg.overs || 7} Overs / Innings). Points and NRR determine the top 2 teams on the leaderboard.`,
          },
          {
            title: 'Stage 2: Grand Final Showdown',
            badge: 'Top 2 Teams',
            desc: 'The top 2 ranked teams clash head-to-head in the Grand Final to claim the championship trophy!',
          },
          {
            title: 'Stage 3: Champion Crowned',
            badge: 'Championship',
            desc: 'Championship Trophy, MVP, Orange Cap, and Purple Cap awards presented to the tournament champions.',
          },
        ],
        qualificationRule: 'Top 2 franchises on the points table secure direct qualification to the Grand Final.',
      };
    }

    if (kFormat === 'group_stage_knockout' || cfg.groupsCount > 1) {
      const gNames = Array.isArray(cfg.groupNames) && cfg.groupNames.length > 0 ? cfg.groupNames.join(', ') : `${cfg.groupsCount || 2} Groups`;
      return {
        title: 'Knockout Pathway: Multi-Group Stage ➔ Semi-Finals ➔ Grand Final',
        badge: 'Multi-Group League',
        stages: [
          {
            title: 'Stage 1: Multi-Pool League',
            badge: 'Group Stage',
            desc: `Franchises compete within assigned pools (${gNames}). Top 2 teams from each pool advance to the Cross-Group Semi-Finals.`,
          },
          {
            title: 'Stage 2: Cross-Group Semi-Finals',
            badge: 'Top 4 Teams',
            desc: 'Pool A Leader vs Pool B Runner-Up, and Pool B Leader vs Pool A Runner-Up clash for a place in the Grand Final.',
          },
          {
            title: 'Stage 3: Grand Final',
            badge: 'Championship',
            desc: 'The two victorious semi-finalists face off in the Grand Final for the official corporate tournament trophy!',
          },
        ],
        qualificationRule: 'Top 2 teams from each pool advance to the Cross-Group Semi-Finals.',
      };
    }

    if (kFormat === 'semis_final') {
      return {
        title: 'Knockout Pathway: League Stage ➔ Semi-Finals ➔ Grand Final',
        badge: 'Top 4 Knockouts',
        stages: [
          {
            title: 'Stage 1: Group League',
            badge: 'Round Robin',
            desc: 'Franchises compete in round-robin fixtures. Top 4 teams on points and Net Run Rate (NRR) advance to the Semi-Finals.',
          },
          {
            title: 'Stage 2: Knockout Semi-Finals',
            badge: 'Top 4 Teams',
            desc: '1st vs 4th and 2nd vs 3rd in sudden-death knockout semi-finals. Winners advance to the Grand Final.',
          },
          {
            title: 'Stage 3: Grand Final',
            badge: 'Championship',
            desc: 'The 2 semi-final winners battle in the Grand Final for the official corporate tournament championship trophy!',
          },
        ],
        qualificationRule: 'Top 4 franchises secure direct qualification to the Semi-Finals.',
      };
    }

    if (kFormat === 'pure_knockout') {
      return {
        title: 'Knockout Pathway: Elimination Rounds ➔ Grand Final',
        badge: 'Single Elimination',
        stages: [
          {
            title: 'Stage 1: Elimination Rounds',
            badge: 'Sudden Death',
            desc: 'Every match is a do-or-die battle. Winning teams advance immediately while defeated teams exit.',
          },
          {
            title: 'Stage 2: Semi-Finals',
            badge: 'Final 4',
            desc: 'The final 4 remaining teams clash for the ultimate 2 berths in the championship decider.',
          },
          {
            title: 'Stage 3: Grand Final',
            badge: 'Championship',
            desc: 'The 2 finalists duel under stadium floodlights to lift the championship cup!',
          },
        ],
        qualificationRule: 'Single elimination sudden-death knockout structure.',
      };
    }

    // Default: IPL style
    return {
      title: 'Knockout Pathway: League Stage ➔ Playoffs ➔ Grand Final',
      badge: 'Official League Structure',
      stages: [
        {
          title: 'Stage 1: Group League',
          badge: 'Round Robin',
          desc: 'Franchises play round-robin matches. Top teams on points and NRR advance to the Playoffs.',
        },
        {
          title: 'Stage 2: Playoffs',
          badge: 'Top 4 Teams',
          desc: 'Qualifier 1, Eliminator, and Qualifier 2. The 2 victorious teams advance to the Grand Final.',
        },
        {
          title: 'Stage 3: Grand Final',
          badge: 'Championship',
          desc: 'The two playoff champions compete in the Grand Final for the official corporate tournament trophy!',
        },
      ],
      qualificationRule: 'Top 4 franchises secure direct playoff qualification.',
    };
  }, [activeTournamentConfig, activeTournamentRules]);

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
            Live tournament standings calculated dynamically with official ICC NRR rules, knockout qualification indicators, and form guide.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {tournamentsList.length > 1 && (
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
          )}
          {tournamentsList.length === 1 && (
            <div className="px-3.5 py-2 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold shadow-md">
              {tournamentsList[0].name}
            </div>
          )}
          {tournamentsList.length > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-bold shadow-md">
              Season {selectedSeason || activeTournamentConfig?.season || new Date().getFullYear()} (Active)
            </div>
          )}
        </div>
      </div>

      {/* When no tournaments are scheduled at all */}
      {tournamentsList.length === 0 && !loading && (
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl p-12 text-center border border-[#D8AD55]/30 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#D8AD55]/10 text-[#D8AD55] flex items-center justify-center mx-auto border border-[#D8AD55]/30">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="font-display font-black text-2xl text-white">
            No Active Tournaments Scheduled
          </h3>
          <p className="text-sm text-[#8793A5] max-w-md mx-auto leading-relaxed">
            Points table and standings will automatically populate here once an organizer schedules a tournament and begins matches.
          </p>
          <div className="pt-2">
            <Link
              href="/tournaments/create"
              className="btn-press shimmer-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-lg"
            >
              <span>+ Host New Tournament</span>
            </Link>
          </div>
        </div>
      )}

      {/* Standings Table Card (only shown when a tournament is configured) */}
      {tournamentsList.length > 0 && (
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/30 shadow-2xl">
          <div className="p-5 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="font-display font-black text-xl text-white">
                {activeTournamentConfig?.name || tournamentsList.find((t) => t.slug === selectedTournament)?.name || selectedTournament.toUpperCase()} — {selectedSeason || activeTournamentConfig?.season || ''} Standings
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

        {/* Multi-Group Tabs Bar */}
        {availableGroups.length > 1 && (
          <div className="px-5 py-3 bg-[#08111F]/90 border-b border-[#D8AD55]/15 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-gray-400 mr-1 flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Divisions:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedGroupTab('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedGroupTab === 'all'
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-md font-extrabold'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              All Groups ({standings.length})
            </button>
            {availableGroups.map((grp) => {
              const count = standings.filter((s) => s.group === grp).length;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroupTab(grp)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedGroupTab === grp
                      ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-md font-extrabold'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {grp} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Pre-Match / Auction Phase Notification Banner */}
        {completedMatches === 0 && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#08111F] border-b border-[#D8AD55]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0 shadow-sm shadow-amber-400/50" />
              <div className="text-gray-300">
                <strong className="text-[#F2D69A] uppercase tracking-wider">Tournament Auction &amp; Squad Formation Phase:</strong>{' '}
                All 6 franchises are seeded at 0 PTS. Official Net Run Rate (NRR) and Semi-Final qualification standings will dynamically activate live as Group Stage matches are completed.
              </div>
            </div>
            <Link
              href="/auction"
              className="btn-press shimmer-btn shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs shadow hover:brightness-110"
            >
              <span>Live Auction Room ➔</span>
            </Link>
          </div>
        )}

        <div className="overflow-x-auto">
          {displayedStandings.length > 0 ? (
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-[#08111F] text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                <tr>
                  <th className="px-5 py-4 text-center">#</th>
                  <th className="px-5 py-4">Team</th>
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
                {displayedStandings.map((team, idx) => {
                  const isMultiGroup = (activeTournamentConfig?.groupsCount || 1) > 1 || availableGroups.length > 1;
                  const kFormat = activeTournamentRules?.knockoutFormat || (isMultiGroup ? 'group_stage_knockout' : 'ipl_playoffs');
                  const qualificationLabel =
                    kFormat === 'group_stage_knockout' || isMultiGroup
                      ? 'Semi-Finals'
                      : kFormat === 'direct_final'
                      ? 'Final'
                      : kFormat === 'semis_final'
                      ? 'Semi-Finals'
                      : 'Playoffs';

                  // Crucial: Qualification indicators only display when matches have actually commenced and team has played
                  const hasStartedMatches = completedMatches > 0 && team.played > 0;
                  const isPlayoffZone = hasStartedMatches && (idx < 2 || (selectedGroupTab === 'all' && idx < 4));
                  return (
                    <tr
                      key={team.name}
                      className={`hover:bg-white/[0.04] transition-colors ${
                        isPlayoffZone ? 'bg-emerald-500/[0.03]' : ''
                      }`}
                    >
                      <td className="px-5 py-4 text-center font-display font-black text-base text-gray-300">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{selectedGroupTab === 'all' ? team.rank : idx + 1}</span>
                          {isPlayoffZone && (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                              title={`${qualificationLabel} Qualification Zone`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{team.name}</span>
                          {team.group && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/30 text-[9px] font-bold">
                              {team.group}
                            </span>
                          )}
                          {isPlayoffZone && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold uppercase tracking-wider">
                              {qualificationLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8793A5] flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-[#D8AD55]">{team.short}</span>
                          {team.owner && <span>• Captain / Mgr: {team.owner}</span>}
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
      )}

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
                {h2hStats.totalPlayed > 0 && (h2hStats.teamAHighestScore > 0 || h2hStats.teamBHighestScore > 0)
                  ? `${h2hStats.teamAHighestScore} vs ${h2hStats.teamBHighestScore}`
                  : '—'}
              </div>
              <div className="text-[11px] text-[#8793A5]">
                {h2hStats.totalPlayed > 0 ? 'Match high points' : 'Pending tournament match'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#08111F] border border-white/5 text-center space-y-1">
              <span className="text-gray-400 uppercase font-semibold">Key Rivalry Factor</span>
              <div className="font-display font-bold text-xs text-white line-clamp-2 mt-1">
                {h2hStats.totalPlayed > 0
                  ? (h2hStats.keyMatchups[1] || 'Boundary conversion in death overs')
                  : 'Awaiting first head-to-head encounter'}
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
            <span>{dynamicPathway.title}</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold border border-blue-500/30 self-start sm:self-auto">
            {dynamicPathway.badge}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dynamicPathway.stages.map((st: any, idx: number) => {
            const borderColors = [
              'border-emerald-500/30',
              'border-blue-500/30',
              'border-[#D8AD55]/40',
            ];
            const badgeColors = [
              'bg-emerald-500/20 text-emerald-300',
              'bg-blue-500/20 text-blue-300',
              'bg-amber-500/20 text-amber-300',
            ];
            const titleColors = [
              'text-emerald-400',
              'text-blue-400',
              'text-[#D8AD55]',
            ];
            const bColor = borderColors[idx % borderColors.length];
            const badgeColor = badgeColors[idx % badgeColors.length];
            const tColor = titleColors[idx % titleColors.length];

            return (
              <div key={idx} className={`p-5 rounded-2xl bg-[#08111F] border ${bColor} space-y-2`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${tColor} uppercase tracking-wider`}>{st.title}</span>
                  <span className={`px-2 py-0.5 rounded ${badgeColor} text-[10px] font-bold`}>{st.badge}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Net Run Rate Information Footnote */}
      <div className="p-4 rounded-2xl bg-[#0D1B2A]/60 border border-[#D8AD55]/15 flex items-start gap-3 text-xs text-[#8793A5]">
        <HelpCircle className="w-4 h-4 shrink-0 text-[#D8AD55] mt-0.5" />
        <div>
          <strong className="text-gray-200">How Standings &amp; Points Table Operate:</strong>{' '}
          Franchises and squads are synchronized directly with verified live matches and auction rosters. Net Run Rate (NRR) is calculated as (Total Runs Scored / Total Overs Faced) minus (Total Runs Conceded / Total Overs Bowled). {dynamicPathway.qualificationRule}
        </div>
      </div>
    </div>
  );
}
