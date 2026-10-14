'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Award, Medal, Flame, Star, ShieldCheck, ChevronRight, History, Calendar, Users, Gavel } from 'lucide-react';

export default function HistoricalArchivePage() {
  const [activeTab, setActiveTab] = useState<'hallOfFame' | 'allTimeRecords'>('hallOfFame');
  const [selectedTournament, setSelectedTournament] = useState<'all' | 'ddpl' | 'game-of-run'>('all');

  // Archive records (Clean slate for current active inaugural tournament)
  // This section dynamically populates upon tournament season conclusion
  const archivedEditions: any[] = [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-cricket-card to-cricket-dark border border-cricket-border p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase">
              <History className="w-3.5 h-3.5" />
              Corporate Sports Heritage &amp; Hall of Fame
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-wide">
              Historical Tournament Archive
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              Official archive of concluded tournament editions, championship finals, and verified career player milestones across DDPL and Game of RUN.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cricket-border">
        <button
          onClick={() => setActiveTab('hallOfFame')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display font-bold text-lg transition-all ${
            activeTab === 'hallOfFame'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Past Champions &amp; Finals</span>
        </button>
        <button
          onClick={() => setActiveTab('allTimeRecords')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display font-bold text-lg transition-all ${
            activeTab === 'allTimeRecords'
              ? 'border-cricket-teal text-cricket-teal'
              : 'border-transparent text-cricket-muted hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>All-Time Career Records</span>
        </button>
      </div>

      {/* Clean Archive Notice Banner */}
      <div className="glass-card p-12 text-center space-y-4 border border-cricket-border shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-xl">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
            Archive Vault Ready for Concluded Editions
          </h3>
          <p className="text-sm text-cricket-muted max-w-lg mx-auto leading-relaxed">
            All legacy mock data has been purged. Historical records, championship banners, and career player leaderboards will automatically archive here when the active 2026 tournament concludes and transitions to subsequent editions.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/tournaments/ddpl"
            className="px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs border border-blue-500/40 transition-all"
          >
            Explore DDPL 2026
          </Link>
          <Link
            href="/tournaments/game-of-run"
            className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all"
          >
            Explore Game of RUN 2026
          </Link>
          <Link
            href="/auction"
            className="px-5 py-2.5 rounded-xl bg-cricket-teal text-cricket-dark font-display font-bold text-xs shadow transition-all hover:brightness-110"
          >
            Go to Live Auction
          </Link>
        </div>
      </div>
    </div>
  );
}
