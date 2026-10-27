'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, ChevronLeft, ChevronRight, Globe, Flame, Shield, Trophy, Activity, X } from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';
import { GlobalLiveMatch } from '@/app/api/live-scores/global/route';

type FilterCategory = 'all' | 'international' | 'franchise' | 'domestic';

export function GlobalLiveScoresTicker() {
  const [matches, setMatches] = useState<GlobalLiveMatch[]>([]);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMatch, setSelectedMatch] = useState<GlobalLiveMatch | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch live global match scores feed
  useEffect(() => {
    let isMounted = true;

    async function loadGlobalScores() {
      try {
        const res = await fetchWithCache<any>('/api/live-scores/global?category=all', { ttlMs: 15000 });
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.matches)) {
          setMatches(res.matches);
        }
      } catch (err) {
        console.error('Failed to load global live scores feed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGlobalScores();

    // Auto refresh feed every 15s
    const interval = setInterval(loadGlobalScores, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredMatches = activeCategory === 'all'
    ? matches
    : matches.filter((m) => m.category === activeCategory);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden py-2 select-none">
      <div className="bg-gradient-to-b from-[#08111F] via-[#0D1B2A] to-[#08111F] border border-[#D8AD55]/30 rounded-3xl p-4 sm:p-5 shadow-2xl relative">
        
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-28 bg-[#D8AD55]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header Strip with Live Pill & Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8AD55]/15">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-black tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span>LIVE MATCH HUB</span>
            </div>
            <span className="text-xs font-bold text-gray-300 hidden md:inline">
              Global Cricket Scores • Real-Time Broadcast
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Matches', icon: Globe },
              { id: 'international', label: 'International (ICC)', icon: Trophy },
              { id: 'franchise', label: 'Franchise (BBL / SA20 / IPL)', icon: Flame },
              { id: 'domestic', label: 'County & Domestic', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as FilterCategory)}
                  className={`btn-press flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-black shadow-md'
                      : 'bg-[#08111F]/80 text-[#8793A5] hover:text-white border border-[#D8AD55]/15 hover:border-[#D8AD55]/40'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Carousel Arrows */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/25 text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/25 text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Horizontal Swipeable Match Scores Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 overflow-x-auto pt-3 pb-1 scrollbar-none snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth' }}
        >
          {loading ? (
            <div className="w-full py-8 text-center text-xs text-[#8793A5] flex items-center justify-center gap-2">
              <Radio className="w-4 h-4 text-[#D8AD55] animate-pulse" />
              <span>Connecting to global live cricket scores feed…</span>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="w-full py-6 text-center text-xs text-[#8793A5]">
              No matches found in this category right now.
            </div>
          ) : (
            filteredMatches.map((m) => {
              const isLive = m.status === 'live';
              const isCompleted = m.status === 'completed';

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatch(m)}
                  className={`snap-start min-w-[275px] sm:min-w-[305px] max-w-[320px] rounded-2xl p-3.5 flex flex-col justify-between transition-all cursor-pointer border ${
                    isLive
                      ? 'bg-gradient-to-br from-[#0F1D30] to-[#0A1422] border-red-500/30 hover:border-red-400/60 shadow-lg shadow-red-950/20'
                      : 'bg-[#08111F]/90 border-[#D8AD55]/20 hover:border-[#D8AD55]/50'
                  }`}
                >
                  {/* Card Header: League & Status Indicator */}
                  <div className="flex items-center justify-between text-[10px] font-bold pb-2 border-b border-white/5">
                    <span className="truncate max-w-[170px] text-[#8793A5] font-semibold" title={m.league}>
                      {m.league}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-mono text-[9px] uppercase">
                        {m.format}
                      </span>
                      {isLive ? (
                        <span className="flex items-center gap-1 text-red-400 font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
                          <span>LIVE</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="text-gray-400 font-semibold">FT</span>
                      ) : (
                        <span className="text-amber-400 font-semibold">UPCOMING</span>
                      )}
                    </div>
                  </div>

                  {/* Teams & Scores */}
                  <div className="py-2.5 space-y-1.5">
                    {/* Team A */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[170px]">
                        <span className="text-base leading-none">{m.teamA.flag}</span>
                        <span className="font-bold text-white truncate">{m.teamA.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-black text-white text-xs sm:text-sm">
                          {m.teamA.score || '—'}
                        </span>
                        {m.teamA.overs && (
                          <span className="text-[10px] text-gray-400 font-mono ml-1">
                            ({m.teamA.overs})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[170px]">
                        <span className="text-base leading-none">{m.teamB.flag}</span>
                        <span className="font-bold text-white truncate">{m.teamB.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-black text-white text-xs sm:text-sm">
                          {m.teamB.score || '—'}
                        </span>
                        {m.teamB.overs && (
                          <span className="text-[10px] text-gray-400 font-mono ml-1">
                            ({m.teamB.overs})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Match Situation / One-line Summary */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="truncate text-emerald-400 font-medium max-w-[240px]" title={m.statusText}>
                      {m.statusText}
                    </span>
                    <span className="text-[#8793A5] font-mono text-[9px] hover:text-[#F2D69A] shrink-0">
                      Details →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mini Scorecard Popup Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0D1B2A] via-[#08111F] to-[#0D1B2A] border border-[#D8AD55]/40 p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8AD55]">
                  {selectedMatch.league} • {selectedMatch.format}
                </span>
                <h3 className="font-display font-black text-lg text-white">
                  {selectedMatch.teamA.name} vs {selectedMatch.teamB.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Match Status & Venue */}
            <div className="p-3 rounded-2xl bg-[#08111F] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold">{selectedMatch.statusText}</span>
              <span className="text-gray-400 text-[11px] truncate max-w-[200px]">{selectedMatch.venue}</span>
            </div>

            {/* Full Scores Breakdown */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#08111F]/80 border border-[#D8AD55]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedMatch.teamA.flag}</span>
                  <span className="font-bold text-white text-sm">{selectedMatch.teamA.name}</span>
                </div>
                <div className="font-mono font-black text-base text-white">
                  {selectedMatch.teamA.score || 'Yet to Bat'}{' '}
                  {selectedMatch.teamA.overs && <span className="text-xs text-gray-400 font-normal">({selectedMatch.teamA.overs} Ov)</span>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedMatch.teamB.flag}</span>
                  <span className="font-bold text-white text-sm">{selectedMatch.teamB.name}</span>
                </div>
                <div className="font-mono font-black text-base text-white">
                  {selectedMatch.teamB.score || 'Yet to Bat'}{' '}
                  {selectedMatch.teamB.overs && <span className="text-xs text-gray-400 font-normal">({selectedMatch.teamB.overs} Ov)</span>}
                </div>
              </div>
            </div>

            {/* Current Batters & Bowlers if available */}
            {selectedMatch.currentBatters && (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                <div className="text-[10px] uppercase font-bold text-blue-300">Active Batters & Bowler</div>
                <div className="text-gray-200 font-mono text-[11px]">{selectedMatch.currentBatters}</div>
                {selectedMatch.currentBowler && (
                  <div className="text-gray-300 font-mono text-[11px] pt-0.5">Bowling: {selectedMatch.currentBowler}</div>
                )}
              </div>
            )}

            {/* Match Summary */}
            {selectedMatch.summary && (
              <div className="text-xs text-gray-300 italic pt-1">
                "{selectedMatch.summary}"
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-md hover:brightness-110"
            >
              Close Match Details
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
