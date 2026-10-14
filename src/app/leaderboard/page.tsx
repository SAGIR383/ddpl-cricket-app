'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Flame, Zap, Trophy, Shield, Star, Medal, Users, Gavel } from 'lucide-react';

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
  const [selectedTournament, setSelectedTournament] = useState<'ddpl' | 'game-of-run'>('ddpl');
  const [acquiredPlayers, setAcquiredPlayers] = useState<LeaderPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load acquired players from live auction
  useEffect(() => {
    async function loadAuctionPlayers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/auction/data?tournament=${selectedTournament}`);
        const data = await res.json();

        if (data.success && data.data && data.data.soldTransactions && data.data.soldTransactions.length > 0) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cricket-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-cricket-gold" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Tournament Leaderboards &amp; Awards
            </h1>
          </div>
          <p className="text-sm text-cricket-muted mt-1">
            Orange Cap, Purple Cap, and MVP standings calculated dynamically from verified tournament scorecards.
          </p>
        </div>

        <div className="flex rounded-xl bg-cricket-dark border border-cricket-border p-1 text-xs font-bold">
          <button
            onClick={() => setSelectedTournament('ddpl')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTournament === 'ddpl'
                ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                : 'text-cricket-muted hover:text-white'
            }`}
          >
            DDPL 2026 Leaders
          </button>
          <button
            onClick={() => setSelectedTournament('game-of-run')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTournament === 'game-of-run'
                ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                : 'text-cricket-muted hover:text-white'
            }`}
          >
            Game of RUN Leaders
          </button>
        </div>
      </div>

      {/* Top 3 Caps Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Orange Cap */}
        <div className="glass-card p-6 border-t-4 border-t-amber-500 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase">
              Orange Cap
            </span>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-xs text-cricket-muted">Leading Run Scorer</div>
          <div className="font-display font-black text-2xl text-white">
            {hasMatchesPlayed ? 'Tournament Leader' : 'Awaiting Matches'}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-cricket-border">
            <span className="text-cricket-muted">{selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN'}</span>
            <span className="font-display font-black text-xl text-amber-400">0 Runs</span>
          </div>
        </div>

        {/* Purple Cap */}
        <div className="glass-card p-6 border-t-4 border-t-purple-500 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold uppercase">
              Purple Cap
            </span>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-xs text-cricket-muted">Leading Wicket Taker</div>
          <div className="font-display font-black text-2xl text-white">
            {hasMatchesPlayed ? 'Tournament Leader' : 'Awaiting Matches'}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-cricket-border">
            <span className="text-cricket-muted">{selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN'}</span>
            <span className="font-display font-black text-xl text-purple-400">0 Wickets</span>
          </div>
        </div>

        {/* MVP Award */}
        <div className="glass-card p-6 border-t-4 border-t-cricket-teal space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-cricket-teal/20 text-cricket-teal border border-cricket-teal/30 text-xs font-bold uppercase">
              MVP Champion
            </span>
            <Trophy className="w-5 h-5 text-cricket-teal" />
          </div>
          <div className="text-xs text-cricket-muted">Most Valuable Player</div>
          <div className="font-display font-black text-2xl text-white">
            {hasMatchesPlayed ? 'Tournament Leader' : 'Awaiting Matches'}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-cricket-border">
            <span className="text-cricket-muted">{selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN'}</span>
            <span className="font-display font-black text-xl text-cricket-teal">0 MVP Pts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cricket-border">
        <button
          onClick={() => setActiveTab('mvp')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-lg transition-all ${
            activeTab === 'mvp'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          MVP Rankings
        </button>
        <button
          onClick={() => setActiveTab('batting')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-lg transition-all ${
            activeTab === 'batting'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          Orange Cap (Batting)
        </button>
        <button
          onClick={() => setActiveTab('bowling')}
          className={`px-5 py-3 border-b-2 font-display font-bold text-lg transition-all ${
            activeTab === 'bowling'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          Purple Cap (Bowling)
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card overflow-hidden border border-cricket-border shadow-xl">
        <div className="p-4 bg-gradient-to-r from-blue-950 via-cricket-card to-cricket-dark border-b border-cricket-border flex items-center justify-between">
          <span className="font-display font-bold text-lg text-white">
            {selectedTournament.toUpperCase()} — Active Squad Contenders ({acquiredPlayers.length})
          </span>
          <span className="text-xs text-cricket-muted">
            Statistics update automatically with match scorecard completion
          </span>
        </div>

        {acquiredPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                <tr>
                  <th className="px-4 py-3.5 text-center">#</th>
                  <th className="px-4 py-3.5">Player Name</th>
                  <th className="px-4 py-3.5">Franchise</th>
                  <th className="px-4 py-3.5 text-center">Runs</th>
                  <th className="px-4 py-3.5 text-center">Wickets</th>
                  <th className="px-4 py-3.5 text-right font-bold text-white">MVP Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cricket-border">
                {acquiredPlayers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-cricket-card/40 transition-colors">
                    <td className="px-4 py-3.5 text-center font-display font-black text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      {p.name}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-cricket-teal font-semibold">
                      {p.team}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-300">
                      {p.runs}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-300">
                      {p.wickets}
                    </td>
                    <td className="px-4 py-3.5 text-right font-display font-bold text-cricket-gold">
                      {p.pts} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-cricket-muted mx-auto" />
            <div className="font-display font-bold text-lg text-white">No Auction Players Acquired Yet</div>
            <p className="text-xs text-cricket-muted max-w-sm mx-auto">
              Once players are sold in the auction room, they will be listed here as contenders for Orange Cap, Purple Cap, and MVP awards.
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
  );
}
