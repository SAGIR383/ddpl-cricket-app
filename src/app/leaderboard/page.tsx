'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Flame, Zap, Trophy, Shield, Star, Medal, Users, Gavel, Sparkles } from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';

interface LeaderPlayer {
  rank: number;
  name: string;
  team: string;
  runs: number;
  wickets: number;
  pts: number;
  balls?: number;
  sr?: string;
  econ?: string;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'mvp' | 'batting' | 'bowling'>('mvp');
  const [selectedTournament, setSelectedTournament] = useState<string>('ddpl');
  const [tournamentsList, setTournamentsList] = useState<any[]>([
    { slug: 'ddpl', name: 'DDPL', season: '2026' },
    { slug: 'game-of-run', name: 'Game of RUN', season: '2026' },
  ]);
  const [acquiredPlayers, setAcquiredPlayers] = useState<LeaderPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  // Load acquired players from live auction using fast client cache
  useEffect(() => {
    let isMounted = true;

    async function loadAuctionPlayers() {
      if (acquiredPlayers.length === 0) setLoading(true);
      try {
        const [regData, data] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 30000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 10000 }),
        ]);

        if (!isMounted) return;

        if (regData?.tournamentsList && regData.tournamentsList.length > 0) {
          setTournamentsList(regData.tournamentsList);
        }

        if (data?.success && data.data && data.data.soldTransactions && data.data.soldTransactions.length > 0) {
          const sold = data.data.soldTransactions;

          const mapped: LeaderPlayer[] = sold.map((tx: any, idx: number) => ({
            rank: idx + 1,
            name: tx.player,
            team: tx.team,
            runs: 0,
            wickets: 0,
            pts: 0,
            balls: 0,
            sr: '0.0',
            econ: '0.00',
          }));

          setAcquiredPlayers(mapped);
        } else {
          setAcquiredPlayers([]);
        }
      } catch (err) {
        console.error('Failed to load auction players for leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAuctionPlayers();
  }, [selectedTournament]);

  const hasMatchesPlayed = false; // Fresh tournament prior to completed matches

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

        {/* Tournament Selector Pill Bar */}
        <div className="flex rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 p-1 text-xs font-bold overflow-x-auto max-w-xs sm:max-w-md shadow-md">
          {tournamentsList.map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedTournament(t.slug)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                selectedTournament === t.slug
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow'
                  : 'text-[#8793A5] hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
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
          <div className="font-display font-black text-2xl text-white">
            {hasMatchesPlayed ? 'Tournament Leader' : 'Awaiting Matches'}
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#8793A5]">{selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN'}</span>
            <span className="font-display font-black text-xl text-[#F2D69A]">0 Runs</span>
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
          <div className="font-display font-black text-2xl text-white">
            {hasMatchesPlayed ? 'Tournament Leader' : 'Awaiting Matches'}
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#8793A5]">{selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN'}</span>
            <span className="font-display font-black text-xl text-purple-300">0 Wickets</span>
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
          <div className="font-display font-black text-2xl text-white">
            {hasMatchesPlayed ? 'Tournament Leader' : 'Awaiting Matches'}
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
            <span className="text-[#8793A5]">{selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN'}</span>
            <span className="font-display font-black text-xl text-[#D8AD55]">0 MVP Pts</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#D8AD55]/15">
        <button
          onClick={() => setActiveTab('mvp')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-base sm:text-lg transition-all ${
            activeTab === 'mvp'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          MVP Rankings
        </button>
        <button
          onClick={() => setActiveTab('batting')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-base sm:text-lg transition-all ${
            activeTab === 'batting'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          Orange Cap (Batting)
        </button>
        <button
          onClick={() => setActiveTab('bowling')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-base sm:text-lg transition-all ${
            activeTab === 'bowling'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          Purple Cap (Bowling)
        </button>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden border border-[#D8AD55]/30 shadow-2xl">
        <div className="p-5 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-display font-bold text-lg text-white">
            {selectedTournament.toUpperCase()} — Active Squad Contenders ({acquiredPlayers.length})
          </span>
          <span className="text-xs text-[#8793A5]">
            Statistics update automatically with match scorecard completion
          </span>
        </div>

        {acquiredPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-[#08111F] text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                <tr>
                  <th className="px-5 py-4 text-center">#</th>
                  <th className="px-5 py-4">Player Name</th>
                  <th className="px-5 py-4">Franchise</th>
                  <th className="px-5 py-4 text-center">Runs</th>
                  <th className="px-5 py-4 text-center">Wickets</th>
                  <th className="px-5 py-4 text-right font-black text-white">MVP Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {acquiredPlayers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4 text-center font-display font-black text-[#8793A5]">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4 font-bold text-white">
                      {p.name}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#D8AD55] font-semibold">
                      {p.team}
                    </td>
                    <td className="px-5 py-4 text-center text-gray-300">
                      {p.runs}
                    </td>
                    <td className="px-5 py-4 text-center text-gray-300">
                      {p.wickets}
                    </td>
                    <td className="px-5 py-4 text-right font-display font-bold text-[#F2D69A]">
                      {p.pts} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-4">
            <Users className="w-12 h-12 text-[#8793A5] mx-auto opacity-40" />
            <div className="font-display font-bold text-lg text-white">No Auction Players Acquired Yet</div>
            <p className="text-xs text-[#8793A5] max-w-sm mx-auto">
              Once players are sold in the auction room, they will be listed here as contenders for Orange Cap, Purple Cap, and MVP awards.
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
  );
}
