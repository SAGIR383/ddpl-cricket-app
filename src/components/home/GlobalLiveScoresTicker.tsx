'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Radio, ChevronLeft, ChevronRight, Globe, Flame, Shield, Trophy, Activity, X, MapPin, Zap, Clock } from 'lucide-react';
import { fetchWithCache } from '@/lib/clientCache';
import { GlobalLiveMatch } from '@/app/api/live-scores/global/route';

type FilterCategory = 'all' | 'live' | 'upcoming' | 'international' | 'franchise' | 'domestic';

export function GlobalLiveScoresTicker() {
  const [matches, setMatches] = useState<GlobalLiveMatch[]>([]);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMatch, setSelectedMatch] = useState<GlobalLiveMatch | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch live global match scores feed with rapid 5-second ball-by-ball polling
  useEffect(() => {
    let isMounted = true;

    async function loadGlobalScores() {
      try {
        // Bypass cache or use short 3s TTL to get every ball delivered in real time
        const res = await fetchWithCache<any>('/api/live-scores/global?category=all', { ttlMs: 3000 });
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.matches)) {
          setMatches(res.matches);
          const now = new Date();
          setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (err) {
        console.error('Failed to load global live scores feed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGlobalScores();

    // Auto-refresh feed every 5s for genuine real-time ball-by-ball precision
    const interval = setInterval(loadGlobalScores, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // When match list updates, automatically update selectedMatch so modal updates ball-by-ball
  useEffect(() => {
    if (selectedMatch) {
      const updated = matches.find((m) => m.id === selectedMatch.id);
      if (updated) setSelectedMatch(updated);
    }
  }, [matches]);

  // Lock background scroll and listen for ESC key when details modal is open
  useEffect(() => {
    if (!selectedMatch) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedMatch(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedMatch]);

  const filteredMatches = activeCategory === 'all'
    ? matches
    : activeCategory === 'live'
    ? matches.filter((m) => m.status === 'live')
    : activeCategory === 'upcoming'
    ? matches.filter((m) => m.status === 'upcoming')
    : matches.filter((m) => m.category === activeCategory);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const categories: { id: FilterCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'All Matches', icon: Globe },
    { id: 'live', label: '🔴 Live Now', icon: Activity },
    { id: 'upcoming', label: '📅 Upcoming / Scheduled', icon: Clock },
    { id: 'international', label: 'International (ICC)', icon: Trophy },
    { id: 'franchise', label: 'Franchise (BBL/SA20)', icon: Flame },
    { id: 'domestic', label: 'County & Domestic', icon: Shield },
  ];

  return (
    <section className="relative overflow-hidden py-2 select-none">
      <div className="bg-gradient-to-b from-[#08111F] via-[#0D1B2A] to-[#08111F] border border-[#D8AD55]/30 rounded-3xl p-4 sm:p-5 shadow-2xl relative">
        
        {/* Subtle Ambient Gold Glow */}
        <div className="absolute top-0 left-1/4 w-72 h-16 bg-[#D8AD55]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar: Category Filter Pills & Left/Right Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8AD55]/15 pb-3">
          
          {/* Section Eyebrow */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] sm:text-xs font-black tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
              <span>LIVE MATCH HUB</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#8793A5]">
              <span>Real-Time Ball-by-Ball Feed</span>
              {lastSyncTime && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sync {lastSyncTime}</span>
                </span>
              )}
            </span>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {categories.map((tab) => {
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
              <span>Connecting to real-time global live cricket scores feed…</span>
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
                      {m.statusText?.toLowerCase().includes('toss') ? (
                        <span className="flex items-center gap-1 text-[#F2D69A] font-black bg-[#D8AD55]/15 border border-[#D8AD55]/30 px-1.5 py-0.2 rounded">
                          <span>🪙 TOSS</span>
                        </span>
                      ) : m.statusText?.toLowerCase().includes('bad light') ? (
                        <span className="flex items-center gap-1 text-sky-400 font-bold bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.2 rounded">
                          <span>☁️ BAD LIGHT</span>
                        </span>
                      ) : m.statusText?.toLowerCase().includes('lunch') ? (
                        <span className="flex items-center gap-1 text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
                          <span>⏸️ LUNCH</span>
                        </span>
                      ) : isLive ? (
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
                    <span className="truncate text-emerald-400 font-medium max-w-[230px]" title={m.statusText}>
                      {m.statusText}
                    </span>
                    <span className="text-[#8793A5] font-mono text-[9px] hover:text-[#F2D69A] shrink-0 font-bold underline">
                      Details →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enterprise-grade Google-Style Pop-up Modal rendered via React Portal directly into body */}
      {mounted && selectedMatch && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#0F1D30] via-[#08111F] to-[#0A1424] border border-[#D8AD55]/50 p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9)] space-y-4 my-auto scrollbar-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#D8AD55]/20 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D8AD55]">
                    {selectedMatch.league}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] uppercase font-bold">
                    {selectedMatch.format}
                  </span>
                  {selectedMatch.status === 'live' ? (
                    <span className="flex items-center gap-1 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
                      LIVE BALL-BY-BALL
                    </span>
                  ) : (
                    <span className="text-amber-400 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                      {selectedMatch.status}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-black text-lg sm:text-xl text-white mt-1">
                  {selectedMatch.teamA.name} vs {selectedMatch.teamB.name}
                </h3>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white cursor-pointer transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Match Situation & Equation Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#08111F] to-emerald-500/15 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400">{selectedMatch.statusText}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8793A5] pt-0.5">
                <span className="flex items-center gap-1 truncate max-w-[320px]">
                  <MapPin className="w-3.5 h-3.5 text-[#D8AD55] shrink-0" />
                  <span className="truncate">{selectedMatch.venue}</span>
                </span>
                {selectedMatch.toss && (
                  <span className="text-gray-400 text-[10px] italic shrink-0 hidden sm:inline">
                    {selectedMatch.toss}
                  </span>
                )}
              </div>
            </div>

            {/* Scorecard Table */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-[#08111F] border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none">{selectedMatch.teamA.flag}</span>
                  <div>
                    <span className="font-bold text-white text-sm sm:text-base">{selectedMatch.teamA.name}</span>
                    <span className="text-gray-400 text-xs font-mono ml-2 font-normal">({selectedMatch.teamA.short})</span>
                  </div>
                </div>
                <div className="font-mono font-black text-base sm:text-lg text-white">
                  {selectedMatch.teamA.score || 'Yet to Bat'}
                  {selectedMatch.teamA.overs && (
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      ({selectedMatch.teamA.overs} Ov)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none">{selectedMatch.teamB.flag}</span>
                  <div>
                    <span className="font-bold text-white text-sm sm:text-base">{selectedMatch.teamB.name}</span>
                    <span className="text-gray-400 text-xs font-mono ml-2 font-normal">({selectedMatch.teamB.short})</span>
                  </div>
                </div>
                <div className="font-mono font-black text-base sm:text-lg text-white">
                  {selectedMatch.teamB.score || 'Yet to Bat'}
                  {selectedMatch.teamB.overs && (
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      ({selectedMatch.teamB.overs} Ov)
                    </span>
                  )}
                </div>
              </div>

              {/* CRR & RRR Metrics Row */}
              {(selectedMatch.crr || selectedMatch.rrr || selectedMatch.partnership) && (
                <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                  {selectedMatch.crr && (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300">
                      CRR: <strong className="text-white">{selectedMatch.crr}</strong>
                    </span>
                  )}
                  {selectedMatch.rrr && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      RRR: <strong className="text-emerald-400">{selectedMatch.rrr}</strong>
                    </span>
                  )}
                  {selectedMatch.partnership && (
                    <span className="px-2 py-0.5 rounded bg-[#D8AD55]/10 text-[#F2D69A] border border-[#D8AD55]/20">
                      🤝 {selectedMatch.partnership}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Active Batters Live Table (Google Style) */}
            {selectedMatch.batters && selectedMatch.batters.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  <span>Batting</span>
                  <div className="flex items-center gap-4 text-right pr-1 font-mono text-gray-400">
                    <span className="w-8">R</span>
                    <span className="w-8">B</span>
                    <span className="w-6">4s</span>
                    <span className="w-6">6s</span>
                    <span className="w-12">SR</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {selectedMatch.batters.map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                        <span className={`font-sans font-bold truncate ${b.isStriker ? 'text-white' : 'text-gray-300'}`}>
                          {b.name}
                        </span>
                        {b.isStriker && (
                          <span className="text-emerald-400 font-black text-xs">*</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-right pr-1 text-gray-200">
                        <span className="w-8 font-black text-white">{b.runs}</span>
                        <span className="w-8 text-gray-400">{b.balls}</span>
                        <span className="w-6 text-gray-400">{b.fours}</span>
                        <span className="w-6 text-gray-400">{b.sixes}</span>
                        <span className="w-12 text-[#F2D69A]">{b.sr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Bowler Live Figures */}
            {selectedMatch.bowler && (
              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">
                  <span>Bowling</span>
                  <div className="flex items-center gap-4 text-right pr-1 font-mono text-gray-400">
                    <span className="w-8">O</span>
                    <span className="w-6">M</span>
                    <span className="w-8">R</span>
                    <span className="w-6">W</span>
                    <span className="w-12">ECON</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-sans font-bold text-white truncate max-w-[190px]">
                    {selectedMatch.bowler.name}
                  </span>
                  <div className="flex items-center gap-4 text-right pr-1 text-gray-200">
                    <span className="w-8 text-gray-300">{selectedMatch.bowler.overs}</span>
                    <span className="w-6 text-gray-400">{selectedMatch.bowler.maidens}</span>
                    <span className="w-8 text-gray-300">{selectedMatch.bowler.runs}</span>
                    <span className="w-6 font-black text-emerald-400">{selectedMatch.bowler.wickets}</span>
                    <span className="w-12 text-gray-300">{selectedMatch.bowler.econ}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Balls Strip */}
            {selectedMatch.recentBalls && selectedMatch.recentBalls.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#8793A5] tracking-wider">
                  Recent Deliveries
                </span>
                <div className="flex items-center gap-1.5 font-mono flex-wrap justify-end">
                  {selectedMatch.recentBalls.map((b, idx) => {
                    const isWicket = b.toUpperCase().includes('W') && !b.toUpperCase().includes('WD');
                    const isFour = b.includes('4');
                    const isSix = b.includes('6');

                    return (
                      <span
                        key={idx}
                        className={`min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isWicket
                            ? 'bg-red-500 text-white animate-pulse'
                            : isSix
                            ? 'bg-purple-500/80 text-white'
                            : isFour
                            ? 'bg-blue-500/80 text-white'
                            : b === '0'
                            ? 'bg-white/10 text-gray-400'
                            : 'bg-[#D8AD55]/20 text-[#F2D69A]'
                        }`}
                      >
                        {b}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Editorial Summary */}
            {selectedMatch.summary && (
              <div className="p-3 rounded-xl bg-white/5 text-xs text-gray-300 italic border border-white/5">
                "{selectedMatch.summary}"
              </div>
            )}

            {/* Bottom Dismiss Button */}
            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
            >
              Close Match Center
            </button>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
