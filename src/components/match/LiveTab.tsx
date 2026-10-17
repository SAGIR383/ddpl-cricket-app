'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Award,
  TrendingUp,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Zap,
} from 'lucide-react';
import { MatchLiveState, InningsData, DeliveryEvent } from '@/types/match.types';
import { calculateOversString } from '@/lib/matchEngine';

interface LiveTabProps {
  state: MatchLiveState;
  onNavigateToTab: (tab: any) => void;
}

export function LiveTab({ state, onNavigateToTab }: LiveTabProps) {
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [commentaryFilter, setCommentaryFilter] = useState<'all' | 'wickets' | 'boundaries'>('all');

  const currentInnings: InningsData =
    state.currentInnings === 1 ? state.innings1 : (state.innings2 || state.innings1);

  const striker = currentInnings.batters[currentInnings.strikerIndex] || currentInnings.batters[0];
  const nonStriker = currentInnings.batters[currentInnings.nonStrikerIndex] || currentInnings.batters[1];
  const bowler = currentInnings.bowlers[currentInnings.currentBowlerIndex] || currentInnings.bowlers[0];

  // Current over calculations
  const currentOverIndex = Math.floor(currentInnings.legalBalls / 6);
  const currentOverDeliveries = currentInnings.deliveries.filter((d) => d.over === currentOverIndex);
  const currentOverRuns = currentOverDeliveries.reduce((sum, d) => sum + d.runsTotal, 0);

  // Filtered commentary deliveries (newest first)
  const filteredDeliveries = [...currentInnings.deliveries].reverse().filter((d) => {
    if (commentaryFilter === 'wickets') return d.isWicket;
    if (commentaryFilter === 'boundaries') return d.isBoundary;
    return true;
  });

  // Match Insights metrics
  const totalFours = currentInnings.deliveries.filter((d) => d.isFour).length;
  const totalSixes = currentInnings.deliveries.filter((d) => d.isSix).length;
  const dotBallsCount = currentInnings.deliveries.filter((d) => d.runsTotal === 0 && d.isLegal).length;
  const boundaryRuns = totalFours * 4 + totalSixes * 6;
  const boundaryPercentage = currentInnings.totalRuns > 0 ? Math.round((boundaryRuns / currentInnings.totalRuns) * 100) : 0;

  // Active partnership runs
  const currentPartnershipRuns = (striker?.runs || 0) + (nonStriker?.runs || 0);
  const currentPartnershipBalls = (striker?.balls || 0) + (nonStriker?.balls || 0);

  return (
    <div className="space-y-6">
      {/* 1. CREX-STYLE ACTIVE PITCH CREASE & BOWLER SPELL */}
      <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl">
        {/* Top Header Strip */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Active Crease • {currentInnings.battingTeamShort} vs {currentInnings.bowlingTeamShort}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#8793A5]">
              Partnership:{' '}
              <strong className="text-[#F2D69A]">
                {currentPartnershipRuns} ({currentPartnershipBalls}b)
              </strong>
            </span>
          </div>
        </div>

        {/* Crease Content Grid */}
        <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#08111F]/60">
          {/* Batters (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-[11px] font-bold text-[#D8AD55] uppercase tracking-wider flex items-center justify-between">
              <span>Batters at Crease</span>
              <span className="text-gray-400 font-normal">R (B • 4s • 6s • SR)</span>
            </div>

            <div className="space-y-2.5">
              {/* Striker (Active on strike) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#111D2D] via-[#0D1B2A] to-[#111D2D] border-2 border-[#D8AD55]/60 shadow-lg shadow-[#D8AD55]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D8AD55] to-[#F2D69A] text-[#08111F] flex items-center justify-center font-display font-black text-base shadow">
                    ★
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                        {striker?.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 uppercase tracking-wider">
                        Strike
                      </span>
                    </div>
                    <div className="text-xs text-[#8793A5] mt-0.5">
                      SR: <strong className="text-[#F2D69A]">{striker?.strikeRate || '0.00'}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display font-black text-2xl sm:text-3xl text-[#F2D69A]">
                    {striker?.runs || 0}
                    <span className="text-xs font-semibold text-[#8793A5] ml-1">
                      ({striker?.balls || 0})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8793A5] font-medium">
                    {striker?.fours || 0}x4 • {striker?.sixes || 0}x6
                  </div>
                </div>
              </div>

              {/* Non-Striker */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0D1B2A]/70 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#08111F] border border-white/10 text-[#8793A5] flex items-center justify-center font-bold text-sm">
                    •
                  </div>
                  <div>
                    <div className="font-bold text-gray-200 text-sm sm:text-base">
                      {nonStriker?.name}
                    </div>
                    <div className="text-xs text-[#8793A5] mt-0.5">
                      SR: <strong className="text-gray-300">{nonStriker?.strikeRate || '0.00'}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display font-bold text-xl sm:text-2xl text-gray-200">
                    {nonStriker?.runs || 0}
                    <span className="text-xs font-semibold text-[#8793A5] ml-1">
                      ({nonStriker?.balls || 0})
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8793A5] font-medium">
                    {nonStriker?.fours || 0}x4 • {nonStriker?.sixes || 0}x6
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bowler Spell & Current Over Balls (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-[11px] font-bold text-[#D8AD55] uppercase tracking-wider flex items-center justify-between">
              <span>Current Bowler</span>
              <span className="text-gray-400 font-normal">O - M - R - W</span>
            </div>

            {/* Bowler Card */}
            <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/20 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm sm:text-base">{bowler?.name}</div>
                <div className="text-xs text-[#8793A5] mt-0.5">
                  Econ: <strong className="text-white">{bowler?.economy || '0.00'}</strong> • Dots:{' '}
                  <strong className="text-[#F2D69A]">{bowler?.dots || 0}</strong>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-2xl text-[#F2D69A]">
                  {bowler?.wickets || 0} <span className="text-[#D8AD55]/60 text-lg">/</span>{' '}
                  {bowler?.runsConceded || 0}
                </div>
                <div className="text-xs text-[#8793A5]">
                  {bowler?.oversStr || '0.0'} ov • Maidens: {bowler?.maidens || 0}
                </div>
              </div>
            </div>

            {/* This Over Timeline Strip */}
            <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#8793A5]">
                  Over {currentOverIndex + 1}
                </span>
                <span className="text-[#D8AD55] font-black">
                  {currentOverRuns} Run{currentOverRuns !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap min-h-[36px]">
                {currentOverDeliveries.length === 0 ? (
                  <span className="text-xs text-[#8793A5] italic">Ready for next delivery…</span>
                ) : (
                  currentOverDeliveries.map((del, idx) => {
                    const isWicket = del.isWicket;
                    const isFour = del.isFour;
                    const isSix = del.isSix;
                    const isExtra = del.extraType !== 'none';
                    return (
                      <span
                        key={idx}
                        title={`${del.ballDisplay}: ${del.commentary}`}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-xs shadow-md transition-all hover:scale-115 cursor-help ${
                          isWicket
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/40 ring-1 ring-red-400'
                            : isSix
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/40 ring-1 ring-purple-300'
                            : isFour
                            ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-[#D8AD55]/40 font-black'
                            : isExtra
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            : del.runsBat === 0
                            ? 'bg-[#0D1B2A] text-gray-400 border border-white/10'
                            : 'bg-[#111D2D] text-white border border-[#D8AD55]/30'
                        }`}
                      >
                        {del.symbol}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTION PILLS (Insights, Points Table, Leaderboard) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <button
          onClick={() => setShowInsightsModal(true)}
          className="p-3.5 rounded-2xl bg-[#0D1B2A]/90 hover:bg-[#111D2D] border border-[#D8AD55]/25 hover:border-[#D8AD55]/60 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-md group cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#D8AD55] group-hover:scale-110 transition-transform" />
          <span>Insights</span>
        </button>

        <Link
          href={`/tournaments/${state.tournament}`}
          className="p-3.5 rounded-2xl bg-[#0D1B2A]/90 hover:bg-[#111D2D] border border-[#D8AD55]/25 hover:border-[#D8AD55]/60 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-md group cursor-pointer"
        >
          <Award className="w-4 h-4 text-[#D8AD55] group-hover:scale-110 transition-transform" />
          <span>Points Table</span>
        </Link>

        <Link
          href="/leaderboard"
          className="p-3.5 rounded-2xl bg-[#0D1B2A]/90 hover:bg-[#111D2D] border border-[#D8AD55]/25 hover:border-[#D8AD55]/60 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-md group cursor-pointer"
        >
          <TrendingUp className="w-4 h-4 text-[#D8AD55] group-hover:scale-110 transition-transform" />
          <span>Leaderboard</span>
        </Link>
      </div>

      {/* 3. CHRONOLOGICAL BALL-BY-BALL COMMENTARY STREAM */}
      <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl">
        {/* Commentary Bar with Filter Pills */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-display font-bold text-sm text-[#F2D69A]">
              Live Ball-by-Ball Commentary
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#08111F] p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setCommentaryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                commentaryFilter === 'all'
                  ? 'bg-[#D8AD55] text-[#08111F]'
                  : 'text-[#8793A5] hover:text-white'
              }`}
            >
              All ({currentInnings.deliveries.length})
            </button>
            <button
              onClick={() => setCommentaryFilter('boundaries')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                commentaryFilter === 'boundaries'
                  ? 'bg-[#D8AD55] text-[#08111F]'
                  : 'text-[#8793A5] hover:text-white'
              }`}
            >
              Boundaries ({totalFours + totalSixes})
            </button>
            <button
              onClick={() => setCommentaryFilter('wickets')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                commentaryFilter === 'wickets'
                  ? 'bg-[#D8AD55] text-[#08111F]'
                  : 'text-[#8793A5] hover:text-white'
              }`}
            >
              Wickets ({currentInnings.wickets})
            </button>
          </div>
        </div>

        {/* Deliveries Stream List */}
        <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
          {filteredDeliveries.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8793A5] italic space-y-1">
              <div>No deliveries matching filter.</div>
              <div>Balls bowled by official match scorers will appear here in real time.</div>
            </div>
          ) : (
            filteredDeliveries.map((del) => {
              const isWicket = del.isWicket;
              const isFour = del.isFour;
              const isSix = del.isSix;

              return (
                <div
                  key={del.id}
                  className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-[#111D2D]/60 transition-colors ${
                    isWicket
                      ? 'bg-red-500/10 border-l-4 border-l-red-500'
                      : isSix
                      ? 'bg-purple-500/10 border-l-4 border-l-purple-500'
                      : isFour
                      ? 'bg-[#D8AD55]/10 border-l-4 border-l-[#D8AD55]'
                      : ''
                  }`}
                >
                  {/* Delivery Badge */}
                  <span
                    className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center font-display font-black text-sm shadow-md ${
                      isWicket
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/40 ring-2 ring-red-400'
                        : isSix
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/40'
                        : isFour
                        ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-[#D8AD55]/40'
                        : del.extraType !== 'none'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : del.runsBat === 0
                        ? 'bg-[#08111F] text-gray-400 border border-white/10'
                        : 'bg-[#111D2D] text-white border border-[#D8AD55]/30'
                    }`}
                  >
                    {del.symbol}
                  </span>

                  {/* Commentary Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-display font-black text-sm text-white">
                        {del.ballDisplay}
                      </span>
                      <span className="text-[#8793A5]">
                        {del.bowlerName} to {del.strikerName}
                      </span>

                      {isWicket && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40 uppercase">
                          WICKET
                        </span>
                      )}
                      {isFour && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 uppercase">
                          FOUR
                        </span>
                      )}
                      {isSix && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                          SIX
                        </span>
                      )}
                      {del.extraType !== 'none' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                          {del.extraType} (+{del.runsExtras})
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-gray-200 mt-1.5 leading-relaxed font-sans">
                      {del.commentary}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. MATCH INSIGHTS MODAL */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-[#0D1B2A] border border-[#D8AD55]/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D8AD55]" />
                <h3 className="font-display font-black text-xl text-white">Match Insights</h3>
              </div>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="p-1 rounded-lg text-[#8793A5] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5]">Total Boundaries</span>
                <div className="font-display font-black text-xl text-[#F2D69A]">
                  {totalFours + totalSixes}{' '}
                  <span className="text-xs font-normal text-white">
                    ({totalFours}x4, {totalSixes}x6)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5]">Boundary % Runs</span>
                <div className="font-display font-black text-xl text-emerald-400">
                  {boundaryPercentage}%{' '}
                  <span className="text-xs font-normal text-gray-400">
                    ({boundaryRuns} runs)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5]">Dot Ball Pressure</span>
                <div className="font-display font-black text-xl text-blue-400">
                  {dotBallsCount}{' '}
                  <span className="text-xs font-normal text-gray-400">
                    ({currentInnings.legalBalls > 0 ? Math.round((dotBallsCount / currentInnings.legalBalls) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5]">Current Run Rate</span>
                <div className="font-display font-black text-xl text-[#D8AD55]">
                  {currentInnings.legalBalls > 0
                    ? ((currentInnings.totalRuns * 6) / currentInnings.legalBalls).toFixed(2)
                    : '0.00'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInsightsModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black text-sm uppercase tracking-wider cursor-pointer"
            >
              Close Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
