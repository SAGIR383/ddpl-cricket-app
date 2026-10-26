'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Flame,
  Zap,
  Trophy,
  Shield,
  Star,
  Medal,
  Users,
  Gavel,
  Sparkles,
  Target,
  Crown,
} from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';
import {
  OrangeCapBatter,
  PurpleCapBowler,
  MvpPlayer,
} from '@/lib/tournamentAnalytics';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'mvp' | 'batting' | 'bowling' | 'sixes'>('mvp');
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);

  const [orangeCap, setOrangeCap] = useState<OrangeCapBatter[]>([]);
  const [purpleCap, setPurpleCap] = useState<PurpleCapBowler[]>([]);
  const [mvpList, setMvpList] = useState<MvpPlayer[]>([]);
  const [sixesList, setSixesList] = useState<any[]>([]);
  const [completedMatches, setCompletedMatches] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Load tournament analytics and leaderboards
  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboards() {
      setLoading(true);
      try {
        const [regData, analyticsData, auctionData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 30000 }),
          fetchWithCache<any>(`/api/analytics/tournament?tournament=${selectedTournament}`, { ttlMs: 5000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 10000 }),
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

        const lb = analyticsData?.leaderboards;
        setCompletedMatches(analyticsData?.completedMatches || 0);

        if (lb && (lb.orangeCap?.length > 0 || lb.purpleCap?.length > 0 || lb.mvpLeaderboard?.length > 0)) {
          setOrangeCap(lb.orangeCap || []);
          setPurpleCap(lb.purpleCap || []);
          setMvpList(lb.mvpLeaderboard || []);
          setSixesList(lb.maxSixesLeaderboard || []);
        } else {
          // Fallback to auction players with initial 0 standings prior to matches
          const sold = auctionData?.data?.soldTransactions || [];
          const initialMvp: MvpPlayer[] = sold.map((tx: any, idx: number) => ({
            rank: idx + 1,
            name: tx.player,
            team: tx.team,
            totalPoints: 0,
            runs: 0,
            wickets: 0,
            sixes: 0,
            fours: 0,
            dots: 0,
          }));

          const initialOrange: OrangeCapBatter[] = sold.map((tx: any, idx: number) => ({
            rank: idx + 1,
            name: tx.player,
            team: tx.team,
            runs: 0,
            innings: 0,
            balls: 0,
            highestScore: 0,
            strikeRate: 0,
            fours: 0,
            sixes: 0,
            fifties: 0,
            thirties: 0,
          }));

          const initialPurple: PurpleCapBowler[] = sold.map((tx: any, idx: number) => ({
            rank: idx + 1,
            name: tx.player,
            team: tx.team,
            wickets: 0,
            innings: 0,
            oversStr: '0.0',
            legalBalls: 0,
            runsConceded: 0,
            economy: 0,
            average: 0,
            maidens: 0,
            bestBowling: '-',
          }));

          setMvpList(initialMvp);
          setOrangeCap(initialOrange);
          setPurpleCap(initialPurple);
          setSixesList([]);
        }
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboards();
  }, [selectedTournament]);

  const topOrange = orangeCap[0];
  const topPurple = purpleCap[0];
  const topMvp = mvpList[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Honors &amp; Individual Accolades</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1">
            Tournament Leaderboards &amp; Awards
          </h1>
          <p className="text-sm text-[#8793A5] mt-1.5 max-w-2xl">
            Orange Cap, Purple Cap, and MVP standings calculated dynamically from verified tournament scorecards.
          </p>
        </div>

        {/* Tournament Selector: Only render if multiple tournaments exist */}
        {tournamentsList.length > 1 && (
          <div className="flex rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 p-1 text-xs font-bold overflow-x-auto max-w-xs sm:max-w-md shadow-md">
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
                {t.name}
              </button>
            ))}
          </div>
        )}
        {tournamentsList.length === 1 && (
          <div className="px-4 py-2 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold shadow-md">
            {tournamentsList[0].name}
          </div>
        )}
      </div>

      {/* Top 3 Caps Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Orange Cap */}
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-6 rounded-3xl border border-[#D8AD55]/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-[#D8AD55] to-amber-600" />
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
              Orange Cap
            </span>
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-xs text-[#8793A5] font-semibold">Leading Run Scorer</div>
          <div className="font-display font-black text-2xl text-white truncate">
            {topOrange && topOrange.runs > 0 ? topOrange.name : 'Awaiting Deliveries'}
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#8793A5] truncate">{topOrange?.team || 'Tournament Leader'}</span>
            <span className="font-display font-black text-xl text-[#F2D69A]">
              {topOrange?.runs || 0} Runs
            </span>
          </div>
        </div>

        {/* Purple Cap */}
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-6 rounded-3xl border border-[#D8AD55]/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600" />
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-black uppercase tracking-wider">
              Purple Cap
            </span>
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xs text-[#8793A5] font-semibold">Leading Wicket Taker</div>
          <div className="font-display font-black text-2xl text-white truncate">
            {topPurple && topPurple.wickets > 0 ? topPurple.name : 'Awaiting Deliveries'}
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#8793A5] truncate">{topPurple?.team || 'Tournament Leader'}</span>
            <span className="font-display font-black text-xl text-purple-300">
              {topPurple?.wickets || 0} Wickets
            </span>
          </div>
        </div>

        {/* MVP Award */}
        <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-6 rounded-3xl border border-[#D8AD55]/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55]" />
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/40 text-xs font-black uppercase tracking-wider">
              MVP Champion
            </span>
            <Trophy className="w-5 h-5 text-[#D8AD55]" />
          </div>
          <div className="text-xs text-[#8793A5] font-semibold">Most Valuable Player</div>
          <div className="font-display font-black text-2xl text-white truncate">
            {topMvp && topMvp.totalPoints > 0 ? topMvp.name : 'Awaiting Deliveries'}
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#8793A5] truncate">{topMvp?.team || 'Tournament Leader'}</span>
            <span className="font-display font-black text-xl text-[#D8AD55]">
              {topMvp?.totalPoints || 0} MVP Pts
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#D8AD55]/15 overflow-x-auto">
        <button
          onClick={() => setActiveTab('mvp')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'mvp'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#D8AD55]" />
          <span>MVP Rankings</span>
        </button>
        <button
          onClick={() => setActiveTab('batting')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'batting'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Orange Cap (Batting)</span>
        </button>
        <button
          onClick={() => setActiveTab('bowling')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bowling'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-purple-400" />
          <span>Purple Cap (Bowling)</span>
        </button>
        <button
          onClick={() => setActiveTab('sixes')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sixes'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Maximum Sixes</span>
        </button>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/30 shadow-2xl">
        <div className="p-5 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-display font-bold text-lg text-white">
            {selectedTournament.toUpperCase()} —{' '}
            {activeTab === 'mvp'
              ? 'Most Valuable Players'
              : activeTab === 'batting'
              ? 'Leading Run Scorers'
              : activeTab === 'bowling'
              ? 'Leading Wicket Takers'
              : 'Sixes Hit'}
          </span>
          <span className="text-xs text-[#8793A5]">
            {completedMatches > 0
              ? `Calculated from ${completedMatches} completed match scorecard(s)`
              : 'Statistics calculate automatically as deliveries are scored'}
          </span>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'mvp' && (
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-[#08111F] text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                <tr>
                  <th className="px-5 py-4 text-center">#</th>
                  <th className="px-5 py-4">Player Name</th>
                  <th className="px-5 py-4">Franchise</th>
                  <th className="px-4 py-4 text-center">Runs</th>
                  <th className="px-4 py-4 text-center">Wickets</th>
                  <th className="px-4 py-4 text-center">6s</th>
                  <th className="px-4 py-4 text-center">Dots</th>
                  <th className="px-5 py-4 text-right font-black text-white">MVP Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mvpList.map((p, idx) => (
                  <tr key={p.name + idx} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4 text-center font-display font-black text-gray-300">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-5 py-4 font-bold text-white">{p.name}</td>
                    <td className="px-5 py-4 text-[#8793A5] font-semibold">{p.team}</td>
                    <td className="px-4 py-4 text-center font-bold text-[#F2D69A]">{p.runs}</td>
                    <td className="px-4 py-4 text-center font-bold text-purple-300">{p.wickets}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-semibold">{p.sixes}</td>
                    <td className="px-4 py-4 text-center text-gray-400">{p.dots}</td>
                    <td className="px-5 py-4 text-right font-display font-black text-xl text-[#D8AD55]">
                      {p.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'batting' && (
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-[#08111F] text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                <tr>
                  <th className="px-5 py-4 text-center">#</th>
                  <th className="px-5 py-4">Batter Name</th>
                  <th className="px-5 py-4">Franchise</th>
                  <th className="px-4 py-4 text-center">Inns</th>
                  <th className="px-4 py-4 text-center font-black text-white">Runs</th>
                  <th className="px-4 py-4 text-center">HS</th>
                  <th className="px-4 py-4 text-center">SR</th>
                  <th className="px-4 py-4 text-center">4s</th>
                  <th className="px-4 py-4 text-center">6s</th>
                  <th className="px-4 py-4 text-center">50s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orangeCap.map((b, idx) => (
                  <tr key={b.name + idx} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4 text-center font-display font-black text-gray-300">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-5 py-4 font-bold text-white">{b.name}</td>
                    <td className="px-5 py-4 text-[#8793A5] font-semibold">{b.team}</td>
                    <td className="px-4 py-4 text-center text-gray-300">{b.innings}</td>
                    <td className="px-4 py-4 text-center font-display font-black text-xl text-[#F2D69A]">
                      {b.runs}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-white">{b.highestScore}</td>
                    <td className="px-4 py-4 text-center text-cyan-300 font-bold">{b.strikeRate}</td>
                    <td className="px-4 py-4 text-center text-[#D8AD55]">{b.fours}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-bold">{b.sixes}</td>
                    <td className="px-4 py-4 text-center text-emerald-400 font-bold">{b.fifties}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'bowling' && (
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-[#08111F] text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                <tr>
                  <th className="px-5 py-4 text-center">#</th>
                  <th className="px-5 py-4">Bowler Name</th>
                  <th className="px-5 py-4">Franchise</th>
                  <th className="px-4 py-4 text-center">Inns</th>
                  <th className="px-4 py-4 text-center font-black text-white">Wkts</th>
                  <th className="px-4 py-4 text-center">Overs</th>
                  <th className="px-4 py-4 text-center">Runs</th>
                  <th className="px-4 py-4 text-center">Econ</th>
                  <th className="px-4 py-4 text-center">Avg</th>
                  <th className="px-4 py-4 text-center">BBI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {purpleCap.map((bw, idx) => (
                  <tr key={bw.name + idx} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4 text-center font-display font-black text-gray-300">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="px-5 py-4 font-bold text-white">{bw.name}</td>
                    <td className="px-5 py-4 text-[#8793A5] font-semibold">{bw.team}</td>
                    <td className="px-4 py-4 text-center text-gray-300">{bw.innings}</td>
                    <td className="px-4 py-4 text-center font-display font-black text-xl text-purple-300">
                      {bw.wickets}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-300">{bw.oversStr}</td>
                    <td className="px-4 py-4 text-center text-gray-400">{bw.runsConceded}</td>
                    <td className="px-4 py-4 text-center text-emerald-400 font-bold">{bw.economy}</td>
                    <td className="px-4 py-4 text-center text-cyan-300 font-semibold">{bw.average}</td>
                    <td className="px-4 py-4 text-center text-[#F2D69A] font-bold">{bw.bestBowling}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'sixes' && (
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-[#08111F] text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                <tr>
                  <th className="px-5 py-4 text-center">#</th>
                  <th className="px-5 py-4">Player Name</th>
                  <th className="px-5 py-4">Franchise</th>
                  <th className="px-4 py-4 text-center font-black text-white">Sixes (6s)</th>
                  <th className="px-4 py-4 text-center">Balls Faced</th>
                  <th className="px-5 py-4 text-right">Balls Per Six</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sixesList.length > 0 ? (
                  sixesList.map((s, idx) => (
                    <tr key={s.name + idx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-5 py-4 text-center font-display font-black text-gray-300">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="px-5 py-4 font-bold text-white">{s.name}</td>
                      <td className="px-5 py-4 text-[#8793A5] font-semibold">{s.team}</td>
                      <td className="px-4 py-4 text-center font-display font-black text-2xl text-red-400">
                        {s.sixes}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-300">{s.balls}</td>
                      <td className="px-5 py-4 text-right text-cyan-300 font-bold">
                        {s.sixes > 0 ? (s.balls / s.sixes).toFixed(1) : '-'} b/6
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-xs text-[#8793A5]">
                      No sixes recorded yet in this tournament.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
