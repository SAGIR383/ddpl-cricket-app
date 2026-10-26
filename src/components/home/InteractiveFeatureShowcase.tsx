'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Gavel,
  Tv,
  BarChart3,
  Award,
  ShieldCheck,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  icon: any;
  accentColor: string;
  href: string;
  screenType: 'score' | 'auction' | 'broadcast' | 'analyse' | 'certify' | 'govern';
}

const FEATURES: FeatureItem[] = [
  {
    id: 'score',
    title: 'Score',
    subtitle: 'Record the match.',
    tagline: 'Professional Digital Match Centre',
    description: 'Ball-by-ball live scoring, batsman wagon wheels, automated strike rotation, and instant DLS revisions on mobile or tablet.',
    icon: Activity,
    accentColor: '#EF4444', // Red accent as in user reference image
    href: '/matches',
    screenType: 'score',
  },
  {
    id: 'auction',
    title: 'Auction',
    subtitle: 'Live bidding wars.',
    tagline: 'Real-Time Multiplayer Franchise Auction',
    description: 'Conduct high-frequency 30-second auction countdowns with instant franchise purse deductions and stage projector mode.',
    icon: Gavel,
    accentColor: '#D8AD55',
    href: '/auction',
    screenType: 'auction',
  },
  {
    id: 'broadcast',
    title: 'Broadcast',
    subtitle: 'Stream live overlay.',
    tagline: 'TV-Grade OBS & YouTube Graphics',
    description: 'Drop-in transparent browser graphics overlay with real-time score ribbons, batsman milestones, and bowler figures.',
    icon: Tv,
    accentColor: '#06B6D4',
    href: '/matches/ddpl-m1/overlay',
    screenType: 'broadcast',
  },
  {
    id: 'analyse',
    title: 'Analyse',
    subtitle: 'Points table & caps.',
    tagline: 'Instant ICC Net Run Rate (NRR) Engine',
    description: 'Automated standings table, playoff qualification trackers, head-to-head records, and Orange/Purple cap leaderboards.',
    icon: BarChart3,
    accentColor: '#10B981',
    href: '/standings',
    screenType: 'analyse',
  },
  {
    id: 'certify',
    title: 'Certify',
    subtitle: '1-Click awards.',
    tagline: 'Official Branded PDF Certificates',
    description: 'Instant generation of tamper-evident athlete participation diplomas, championship awards, and official match scorecards.',
    icon: Award,
    accentColor: '#F59E0B',
    href: '/admin',
    screenType: 'certify',
  },
  {
    id: 'govern',
    title: 'Govern',
    subtitle: 'Host your league.',
    tagline: 'Multi-Tenant Corporate Administration',
    description: 'Custom tournament creation studio with overs customization, organization branding, player approvals, and role permissions.',
    icon: ShieldCheck,
    accentColor: '#8B5CF6',
    href: '/tournaments/create',
    screenType: 'govern',
  },
];

export function InteractiveFeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // Auto-cycle through features on idle every 5 seconds
  useEffect(() => {
    if (!isAutoCycling) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % FEATURES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoCycling]);

  const activeFeature = FEATURES[activeIdx];

  return (
    <section className="space-y-8 relative overflow-hidden py-6">
      {/* Editorial Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
          <span>Interactive Feature Experience</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
          One thing led to another.
        </h2>
        <p className="text-sm sm:text-base text-[#8793A5] max-w-2xl font-medium">
          A corporate cricket scoring tool became an all-in-one ecosystem for leagues, multiplayer auctions, broadcast overlays, and digital governance.
        </p>
      </div>

      {/* Main Interactive Stage (2-Column Grid on Desktop, Stacked on Mobile) */}
      <div
        className="rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 shadow-2xl relative"
        onMouseEnter={() => setIsAutoCycling(false)}
        onMouseLeave={() => setIsAutoCycling(true)}
      >
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D8AD55]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* LEFT COLUMN: Feature Index & Active Storytelling */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Feature Vertical Navigation Tabs (Desktop) / Horizontal Scroll (Mobile) */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {FEATURES.map((f, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setActiveIdx(idx);
                      setIsAutoCycling(false);
                    }}
                    className={`text-left px-4 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group whitespace-nowrap shrink-0 lg:w-full ${
                      isActive
                        ? 'bg-[#111D2D] border-l-4 border-l-[#EF4444] border-t border-r border-b border-white/10 shadow-lg'
                        : 'text-[#8793A5] hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#EF4444]' : 'bg-[#8793A5]/40'}`} />
                      <span className={`font-display text-base sm:text-lg font-bold tracking-wide ${isActive ? 'text-white' : 'text-[#8793A5]'}`}>
                        {f.title}
                      </span>
                    </div>

                    {isActive && (
                      <span className="hidden lg:inline-flex text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">
                        Active Demo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Feature Headline & Dynamic Pitch (Matching Image 1 Big Bold Typography) */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D8AD55] uppercase tracking-widest">
                  {activeFeature.tagline}
                </span>
              </div>

              {/* Big Red/Bold Accent Word matching Image 1: "Score. Record the match." */}
              <div>
                <h3
                  className="font-display font-black text-5xl sm:text-6xl tracking-tight transition-all duration-300"
                  style={{ color: activeFeature.accentColor }}
                >
                  {activeFeature.title}
                </h3>
                <div className="font-display font-extrabold text-2xl sm:text-3xl text-white mt-1">
                  {activeFeature.subtitle}
                </div>
              </div>

              <p className="text-sm text-[#8793A5] leading-relaxed max-w-md">
                {activeFeature.description}
              </p>

              <div className="pt-2">
                <Link
                  href={activeFeature.href}
                  className="btn-press shimmer-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110"
                >
                  <span>Explore {activeFeature.title} Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic iPhone Device Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            
            {/* Phone Chassis Shell */}
            <div className="relative w-[320px] sm:w-[350px] rounded-[48px] p-3.5 bg-gradient-to-b from-[#2E3748] via-[#1B2332] to-[#0A0F1A] border-4 border-[#3D4759] shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(216,173,85,0.15)] ring-1 ring-white/20">
              
              {/* Screen Frame */}
              <div className="relative w-full h-[580px] sm:h-[620px] rounded-[38px] overflow-hidden bg-[#08111F] border border-white/10 flex flex-col justify-between">
                
                {/* 1. Phone Top Status Bar & Dynamic Island */}
                <div className="px-6 pt-3 pb-2 flex items-center justify-between text-white text-[11px] font-bold z-20 shrink-0">
                  <span>9:41</span>
                  {/* Dynamic Island Pill */}
                  <div className="w-24 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] text-[#F2D69A] font-mono font-bold">CRICPLUS</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span>5G</span>
                    <span className="w-4 h-2 rounded-sm border border-white/60 relative">
                      <span className="absolute inset-0.5 bg-white rounded-xs" />
                    </span>
                  </div>
                </div>

                {/* 2. Top App Navigation Header Inside Phone */}
                <div className="px-4 py-2 bg-[#0D1B2A] border-b border-white/5 flex items-center justify-between z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D8AD55]/20 text-[#F2D69A] text-[10px] font-bold">
                      League Match
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8793A5] font-mono">
                    Season 2027
                  </span>
                </div>

                {/* 3. Dynamic Interactive Screen Content (Morphs based on active feature) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none animate-fade-in key={activeFeature.id}">
                  
                  {/* A. SCORE SCREEN (Matching Image 1 Reference Scorecard) */}
                  {activeFeature.screenType === 'score' && (
                    <div className="space-y-3 text-xs">
                      {/* Match Score Banner */}
                      <div className="p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                          <span className="font-bold text-gray-200">Corporate Titans</span>
                          <span className="font-display font-black text-base text-[#F2D69A]">143/8 <span className="text-[10px] text-[#8793A5]">(10.0 Ov)</span></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            Tech Strikers
                          </span>
                          <span className="font-display font-black text-base text-emerald-400">134/6 <span className="text-[10px] text-emerald-300">(8.4 Ov)</span></span>
                        </div>
                        <div className="text-[10px] text-[#8793A5] pt-1">
                          Need 10 runs in 8 balls • RRR: 7.50
                        </div>
                      </div>

                      {/* Batters Mini Scorecard Table */}
                      <div className="rounded-2xl bg-[#0D1B2A] border border-white/5 overflow-hidden">
                        <div className="px-3 py-1.5 bg-[#08111F] text-[10px] font-bold text-[#8793A5] flex justify-between uppercase">
                          <span>Batter</span>
                          <div className="flex gap-4">
                            <span>R</span>
                            <span>B</span>
                            <span>4s</span>
                            <span>6s</span>
                            <span>SR</span>
                          </div>
                        </div>
                        <div className="p-3 space-y-2 text-[11px]">
                          <div className="flex justify-between items-center text-white font-semibold">
                            <span>Maulik K. *</span>
                            <div className="flex gap-4 font-mono text-[10px]">
                              <strong className="text-[#F2D69A]">24</strong>
                              <span>12</span>
                              <span>2</span>
                              <span>2</span>
                              <span>200.0</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Sagir H.</span>
                            <div className="flex gap-4 font-mono text-[10px]">
                              <strong className="text-[#F2D69A]">44</strong>
                              <span>21</span>
                              <span>4</span>
                              <span>3</span>
                              <span>209.5</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[#8793A5]">
                            <span>Saumil P. (c&amp;b)</span>
                            <div className="flex gap-4 font-mono text-[10px]">
                              <span>18</span>
                              <span>10</span>
                              <span>2</span>
                              <span>1</span>
                              <span>180.0</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Over Deliveries */}
                      <div className="p-3 rounded-2xl bg-[#0D1B2A] border border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-[#8793A5] uppercase font-bold">This Over</span>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                          <span className="w-5 h-5 rounded-full bg-[#08111F] text-gray-300 flex items-center justify-center border border-white/10">1</span>
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">4</span>
                          <span className="w-5 h-5 rounded-full bg-[#08111F] text-gray-300 flex items-center justify-center border border-white/10">0</span>
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/40">6</span>
                          <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">W</span>
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40 animate-pulse">2</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* B. AUCTION SCREEN */}
                  {activeFeature.screenType === 'auction' && (
                    <div className="space-y-3 text-xs">
                      {/* Player Lot Card */}
                      <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/40 text-center space-y-2">
                        <div className="text-[10px] font-mono text-[#D8AD55] uppercase font-bold">Lot #14 • All-Rounder Pool</div>
                        <div className="font-display font-black text-lg text-white">Rashid Khan (Platinum)</div>
                        <div className="text-[10px] text-[#8793A5]">Right-hand bat • Leg spin</div>
                        
                        {/* Current Bid Pill */}
                        <div className="p-2.5 rounded-xl bg-[#08111F] border border-emerald-500/30 flex items-center justify-between">
                          <span className="text-[10px] text-[#8793A5]">Current Highest Bid:</span>
                          <span className="font-display font-black text-base text-emerald-400">₹4,800 Pts</span>
                        </div>

                        {/* Leading Bidder */}
                        <div className="text-[10px] text-gray-300">
                          Leading: <strong className="text-[#F2D69A]">Thunderbolts Group</strong>
                        </div>

                        {/* 30s Countdown Bar */}
                        <div className="w-full bg-[#08111F] h-2 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-gradient-to-r from-emerald-400 to-[#D8AD55] h-full w-2/3 animate-pulse" />
                        </div>
                        <div className="text-[9px] text-amber-300 font-mono">12 Seconds Remaining — Going Twice...</div>
                      </div>

                      {/* Quick Bid Increment Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button className="py-2 rounded-xl bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-[10px] font-bold">
                          +100
                        </button>
                        <button className="py-2 rounded-xl bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-[10px] font-bold">
                          +200
                        </button>
                        <button className="py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] text-[10px] font-black">
                          BID ₹5,000
                        </button>
                      </div>
                    </div>
                  )}

                  {/* C. BROADCAST SCREEN */}
                  {activeFeature.screenType === 'broadcast' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-[11px] text-cyan-300">
                        📺 OBS / YouTube Live Stream Overlay Preview
                      </div>

                      {/* Lower-Third TV Ribbon */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-2 border-[#D8AD55] space-y-2 shadow-2xl">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">LIVE BROADCAST</span>
                          <span className="text-[#D8AD55]">OVER 9.3</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-display font-black text-sm text-white">ROYAL STRIKERS</div>
                            <div className="text-[10px] text-[#8793A5]">Target: 142</div>
                          </div>
                          <div className="text-right">
                            <div className="font-display font-black text-xl text-[#F2D69A]">118 / 3</div>
                            <div className="text-[10px] text-emerald-400">Req RR: 7.2</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#0D1B2A] border border-white/5 space-y-1.5 text-[10px]">
                        <div className="text-[#8793A5] uppercase font-bold">Current Bowler</div>
                        <div className="flex justify-between text-white font-medium">
                          <span>Faisal M.</span>
                          <span className="font-mono text-[#D8AD55]">2.3 Ov • 1/14 (Econ 5.60)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* D. ANALYSE SCREEN */}
                  {activeFeature.screenType === 'analyse' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 space-y-2">
                        <div className="text-[10px] font-bold text-[#D8AD55] uppercase">Standings &amp; Net Run Rate</div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 font-bold">
                            <span>1. Super Strikers (Q)</span>
                            <span className="font-mono">8 Pts • +1.42 NRR</span>
                          </div>
                          <div className="flex justify-between items-center p-1.5 rounded-lg bg-emerald-500/5 text-gray-200">
                            <span>2. Tech Titans (Q)</span>
                            <span className="font-mono">6 Pts • +0.89 NRR</span>
                          </div>
                          <div className="flex justify-between items-center p-1.5 text-[#8793A5]">
                            <span>3. City Hawks</span>
                            <span className="font-mono">4 Pts • -0.12 NRR</span>
                          </div>
                        </div>
                      </div>

                      {/* Cap Leader Honors */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 space-y-1">
                          <div className="font-bold uppercase">🟠 Orange Cap</div>
                          <div className="font-bold text-white text-xs">Sagir H.</div>
                          <div className="font-mono">214 Runs (SR 178)</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 space-y-1">
                          <div className="font-bold uppercase">🟣 Purple Cap</div>
                          <div className="font-bold text-white text-xs">Faisal M.</div>
                          <div className="font-mono">9 Wickets (Econ 5.2)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* E. CERTIFY SCREEN */}
                  {activeFeature.screenType === 'certify' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-[#0D1B2A] to-[#08111F] border-2 border-[#D8AD55] text-center space-y-2 shadow-xl">
                        <div className="text-[9px] font-bold tracking-widest text-[#D8AD55] uppercase">
                          Official Certificate Preview
                        </div>
                        <div className="font-display font-black text-sm text-[#F2D69A] uppercase">
                          Certificate of Participation
                        </div>
                        <div className="text-[10px] text-gray-400">Conferred Upon</div>
                        <div className="font-display font-bold text-base text-white">
                          Tournament Athlete
                        </div>
                        <div className="text-[9px] text-[#8793A5]">
                          Corporate Cricket Championship 2027
                        </div>
                        <div className="pt-2 border-t border-white/10 flex justify-between text-[8px] text-gray-400 font-mono">
                          <span>Director Signature</span>
                          <span className="text-[#D8AD55]">CP-CERT-HASH</span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-center text-[10px] font-bold">
                        ✓ Downloadable as Verified A4 Vector PDF
                      </div>
                    </div>
                  )}

                  {/* F. GOVERN SCREEN */}
                  {activeFeature.screenType === 'govern' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 space-y-2">
                        <div className="text-[10px] font-bold text-[#D8AD55] uppercase">League Overs &amp; Format Studio</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 rounded-xl bg-[#08111F] border border-white/10">
                            <span className="text-[#8793A5] block">Format:</span>
                            <strong className="text-white">Round-Robin + Top 4</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-[#08111F] border border-white/10">
                            <span className="text-[#8793A5] block">Innings:</span>
                            <strong className="text-[#F2D69A]">10 Overs / Match</strong>
                          </div>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#0D1B2A] border border-white/5 space-y-2">
                        <div className="text-[10px] font-bold text-gray-300 uppercase">Franchise Purse Allocation</div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#8793A5]">Base Budget:</span>
                          <strong className="text-emerald-400 font-mono">₹10,000 Points</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Phone Bottom Dock Bar */}
                <div className="px-6 py-3 bg-[#0D1B2A]/90 backdrop-blur-md border-t border-white/5 flex items-center justify-around text-gray-400 text-[10px] z-10 shrink-0">
                  <span className="text-[#D8AD55] font-bold">Home</span>
                  <span>Matches</span>
                  <span>Auction</span>
                  <span>Profile</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
