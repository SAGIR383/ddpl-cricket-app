'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Award, Medal, Flame, Star, ShieldCheck, ChevronRight, History, Calendar, Users, Gavel, Sparkles } from 'lucide-react';

export default function HistoricalArchivePage() {
  const [activeTab, setActiveTab] = useState<'hallOfFame' | 'allTimeRecords'>('hallOfFame');
  const [selectedTournament, setSelectedTournament] = useState<'all' | 'ddpl' | 'game-of-run'>('all');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 p-8 sm:p-12 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Corporate Sports Heritage &amp; Hall of Fame</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
              Historical Championship Vault
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              Official archive of concluded tournament editions, championship finals, and verified career player milestones across DDPL and Game of RUN.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D8AD55]/15">
        <button
          onClick={() => setActiveTab('hallOfFame')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display font-bold text-base sm:text-lg transition-all ${
            activeTab === 'hallOfFame'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#D8AD55]" />
          <span>Past Champions &amp; Finals</span>
        </button>
        <button
          onClick={() => setActiveTab('allTimeRecords')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display font-bold text-base sm:text-lg transition-all ${
            activeTab === 'allTimeRecords'
              ? 'border-[#D8AD55] text-[#F2D69A]'
              : 'border-transparent text-[#8793A5] hover:text-white'
          }`}
        >
          <Star className="w-4 h-4 text-[#D8AD55]" />
          <span>All-Time Career Records</span>
        </button>
      </div>

      {/* Vault Clean Slate Card */}
      <div className="bg-[#0D1B2A]/90 backdrop-blur-md p-10 sm:p-14 text-center space-y-5 rounded-3xl border border-[#D8AD55]/30 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#D8AD55] flex items-center justify-center mx-auto shadow-xl">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
            Archive Vault Ready for Concluded Editions
          </h3>
          <p className="text-sm text-[#8793A5] max-w-lg mx-auto leading-relaxed">
            Historical records, championship banners, and career player leaderboards will automatically archive here when the active 2026 tournament concludes and transitions to subsequent editions.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/tournaments/ddpl"
            className="btn-press px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs border border-blue-500/40 transition-all"
          >
            Explore DDPL 2026
          </Link>
          <Link
            href="/tournaments/game-of-run"
            className="btn-press px-5 py-2.5 rounded-xl bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 text-[#F2D69A] font-bold text-xs border border-[#D8AD55]/40 transition-all"
          >
            Explore Game of RUN 2026
          </Link>
          <Link
            href="/auction"
            className="btn-press shimmer-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow transition-all hover:brightness-110"
          >
            Go to Live Auction
          </Link>
        </div>
      </div>
    </div>
  );
}
