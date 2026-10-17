'use client';

import React, { useState } from 'react';
import { Layers, Filter, ChevronDown, ChevronUp, AlertCircle, ShieldAlert } from 'lucide-react';
import { MatchLiveState, InningsData, DeliveryEvent } from '@/types/match.types';
import { calculateOversString } from '@/lib/matchEngine';

interface OversTabProps {
  state: MatchLiveState;
}

export type OverFilterType = 'full' | 'overs' | 'wickets' | 'boundaries';

interface OverSummaryData {
  overNumber: number; // 1-based (e.g. 1 for 1st over)
  bowlerName: string;
  battersInvolved: string[];
  deliveries: DeliveryEvent[];
  totalRuns: number;
  totalWickets: number;
  cumulativeRuns: number;
  cumulativeWickets: number;
  hasWicket: boolean;
  hasBoundary: boolean;
}

export function OversTab({ state }: OversTabProps) {
  // Team / Innings selector: 1 or 2
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(state.currentInnings);
  const [filterType, setFilterType] = useState<OverFilterType>('full');
  const [expandedOvers, setExpandedOvers] = useState<Record<number, boolean>>({});

  const activeInnings: InningsData | null =
    selectedInnings === 1 ? state.innings1 : state.innings2;

  // Toggle over card expansion
  const toggleOverExpanded = (overNum: number) => {
    setExpandedOvers((prev) => ({
      ...prev,
      [overNum]: !prev[overNum],
    }));
  };

  if (!activeInnings) {
    return (
      <div className="p-8 rounded-3xl bg-[#0D1B2A]/90 border border-[#D8AD55]/20 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="font-display font-black text-xl text-white">
          2nd Innings Not Commenced
        </h3>
        <p className="text-xs text-[#8793A5] max-w-sm mx-auto">
          {state.innings1.bowlingTeam} has not yet started their chase. Select 1st Innings above to view previous overs.
        </p>
        <button
          onClick={() => setSelectedInnings(1)}
          className="px-4 py-2 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold hover:bg-[#111D2D] transition-all cursor-pointer"
        >
          View 1st Innings Overs
        </button>
      </div>
    );
  }

  // Group deliveries into chronological overs
  const oversMap = new Map<number, DeliveryEvent[]>();
  activeInnings.deliveries.forEach((del) => {
    const list = oversMap.get(del.over) || [];
    list.push(del);
    oversMap.set(del.over, list);
  });

  // Calculate cumulative stats for each over
  const oversList: OverSummaryData[] = [];
  let runningRuns = 0;
  let runningWickets = 0;

  // Determine total overs bowled or in progress
  const maxOverIdx = activeInnings.deliveries.length > 0
    ? Math.max(...Array.from(oversMap.keys()))
    : -1;

  for (let overIdx = 0; overIdx <= maxOverIdx; overIdx++) {
    const dels = oversMap.get(overIdx) || [];
    const overRuns = dels.reduce((sum, d) => sum + d.runsTotal, 0);
    const overWkts = dels.filter((d) => d.isWicket).length;

    runningRuns += overRuns;
    runningWickets += overWkts;

    const bowler = dels[0]?.bowlerName || 'Bowler';
    const uniqueBatters = Array.from(new Set(dels.map((d) => d.strikerName)));

    oversList.push({
      overNumber: overIdx + 1,
      bowlerName: bowler,
      battersInvolved: uniqueBatters,
      deliveries: dels,
      totalRuns: overRuns,
      totalWickets: overWkts,
      cumulativeRuns: runningRuns,
      cumulativeWickets: runningWickets,
      hasWicket: overWkts > 0,
      hasBoundary: dels.some((d) => d.isBoundary),
    });
  }

  // Apply filters
  const filteredOvers = oversList.filter((ov) => {
    if (filterType === 'wickets') return ov.hasWicket;
    if (filterType === 'boundaries') return ov.hasBoundary;
    return true; // 'full' or 'overs'
  });

  return (
    <div className="space-y-5">
      {/* 1. TOP SELECTORS BAR (Innings Selector + Filter Pills) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Innings Selector Dropdown / Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8793A5] uppercase tracking-wider hidden sm:inline">
            Innings:
          </span>
          <div className="flex items-center gap-1.5 bg-[#08111F] p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setSelectedInnings(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedInnings === 1
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md shadow-[#D8AD55]/20'
                  : 'text-[#8793A5] hover:text-white'
              }`}
            >
              1st Inn: {state.innings1.battingTeamShort} ({state.innings1.totalRuns}/{state.innings1.wickets})
            </button>

            {state.innings2 && (
              <button
                onClick={() => setSelectedInnings(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedInnings === 2
                    ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md shadow-[#D8AD55]/20'
                    : 'text-[#8793A5] hover:text-white'
                }`}
              >
                2nd Inn: {state.innings2.battingTeamShort} ({state.innings2.totalRuns}/{state.innings2.wickets})
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills: Full / Overs / Wickets / Boundaries */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'full', label: 'Full View' },
              { id: 'overs', label: 'Overs Only' },
              { id: 'wickets', label: 'Wickets' },
              { id: 'boundaries', label: 'Boundaries' },
            ] as const
          ).map((f) => {
            const isActive = filterType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#111D2D] text-[#F2D69A] border border-[#D8AD55]/50 shadow-sm'
                    : 'bg-[#08111F]/70 text-[#8793A5] hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CHRONOLOGICAL OVER CARDS FEED (Latest over first) */}
      <div className="space-y-4">
        {filteredOvers.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0D1B2A]/90 border border-[#D8AD55]/20 text-center space-y-2">
            <Layers className="w-8 h-8 text-[#D8AD55] mx-auto opacity-70" />
            <div className="font-display font-bold text-base text-white">
              No overs matching filter
            </div>
            <div className="text-xs text-[#8793A5]">
              Try changing the filter or wait for more balls to be bowled.
            </div>
          </div>
        ) : (
          [...filteredOvers].reverse().map((ov) => {
            const isExpanded = filterType === 'full' || expandedOvers[ov.overNumber];

            return (
              <div
                key={ov.overNumber}
                className={`rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border transition-all ${
                  ov.hasWicket
                    ? 'border-red-500/40 shadow-lg shadow-red-500/5'
                    : ov.hasBoundary
                    ? 'border-[#D8AD55]/40 shadow-lg shadow-[#D8AD55]/5'
                    : 'border-[#D8AD55]/20'
                }`}
              >
                {/* Over Header Bar */}
                <div
                  onClick={() => filterType !== 'full' && toggleOverExpanded(ov.overNumber)}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-3 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 select-none ${
                    filterType !== 'full' ? 'cursor-pointer hover:bg-[#111D2D]/80' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 flex flex-col items-center justify-center font-display shadow-inner">
                      <span className="text-[10px] text-[#8793A5] uppercase font-bold leading-none">
                        OV
                      </span>
                      <span className="text-base font-black text-[#F2D69A] leading-tight">
                        {ov.overNumber}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {ov.bowlerName}
                        </span>
                        <span className="text-xs text-[#8793A5]">
                          to {ov.battersInvolved.join(' & ')}
                        </span>
                      </div>
                      <div className="text-xs text-[#8793A5] mt-0.5 flex items-center gap-2">
                        <span>Score: <strong className="text-white font-black">{ov.cumulativeRuns}/{ov.cumulativeWickets}</strong></span>
                        <span>•</span>
                        <span>Runs in Over: <strong className="text-[#F2D69A] font-bold">+{ov.totalRuns}</strong></span>
                        {ov.totalWickets > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-400 font-bold">
                              {ov.totalWickets} Wkt{ov.totalWickets > 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ball Badges Strip (Summary row) */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5">
                      {ov.deliveries.map((del, dIdx) => (
                        <span
                          key={dIdx}
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs shadow-sm ${
                            del.isWicket
                              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                              : del.isSix
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                              : del.isFour
                              ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F]'
                              : del.extraType !== 'none'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : del.runsBat === 0
                              ? 'bg-[#08111F] text-gray-400 border border-white/10'
                              : 'bg-[#111D2D] text-white border border-[#D8AD55]/30'
                          }`}
                        >
                          {del.symbol}
                        </span>
                      ))}
                    </div>

                    {filterType !== 'full' && (
                      <button className="p-1 rounded-lg text-[#8793A5] hover:text-white">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Ball Badges Row (if small screen) */}
                <div className="sm:hidden px-4 py-2.5 bg-[#08111F]/70 border-b border-white/5 flex items-center gap-1.5 flex-wrap">
                  {ov.deliveries.map((del, dIdx) => (
                    <span
                      key={dIdx}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs shadow-sm ${
                        del.isWicket
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                          : del.isSix
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                          : del.isFour
                          ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F]'
                          : del.extraType !== 'none'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : del.runsBat === 0
                          ? 'bg-[#08111F] text-gray-400 border border-white/10'
                          : 'bg-[#111D2D] text-white border border-[#D8AD55]/30'
                      }`}
                    >
                      {del.symbol}
                    </span>
                  ))}
                </div>

                {/* Expanded Ball-by-Ball Details in Over */}
                {isExpanded && (
                  <div className="divide-y divide-white/5 bg-[#08111F]/40">
                    {ov.deliveries.map((del) => (
                      <div
                        key={del.id}
                        className={`p-3.5 sm:px-5 flex items-start gap-3.5 hover:bg-[#111D2D]/40 transition-colors ${
                          del.isWicket ? 'bg-red-500/5' : del.isBoundary ? 'bg-[#D8AD55]/5' : ''
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-display font-black text-xs ${
                            del.isWicket
                              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/30'
                              : del.isSix
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                              : del.isFour
                              ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F]'
                              : del.extraType !== 'none'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[#08111F] text-gray-300 border border-white/10'
                          }`}
                        >
                          {del.symbol}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-white">{del.ballDisplay}</span>
                            <span className="text-[#8793A5]">
                              {del.bowlerName} to {del.strikerName}
                            </span>
                            {del.isWicket && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/40 uppercase">
                                OUT
                              </span>
                            )}
                            {del.isFour && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#D8AD55]/20 text-[#F2D69A] uppercase">
                                FOUR
                              </span>
                            )}
                            {del.isSix && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 uppercase">
                                SIX
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-300 mt-1 leading-relaxed">
                            {del.commentary}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
