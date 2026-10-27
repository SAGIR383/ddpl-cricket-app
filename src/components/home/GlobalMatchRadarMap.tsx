'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight, MapPin, Globe } from 'lucide-react';
import { WorldMapPaths } from './WorldMapPaths';

export interface RadarHub {
  id: string;
  city: string;
  country: string;
  region: string;
  cx: number; // SVG viewBox coordinate X (30.767 to 814.844)
  cy: number; // SVG viewBox coordinate Y (241.591 to 700.218)
  delaySeconds: number; // Staggered blinking delay so points blink asynchronously
  tournamentName: string;
  matchScore: string;
  status: 'Live Match' | 'Auction Concluded' | 'Grand Finals' | 'Player Registration';
}

export const GLOBAL_HUBS: RadarHub[] = [
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    cx: 531,
    cy: 468,
    delaySeconds: 0.2,
    tournamentName: 'Game of RUN Corporate 2027',
    matchScore: 'Desert Hawks 124/4 (9.2 Ov) • Live',
    status: 'Live Match',
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    country: 'India',
    region: 'South Asia',
    cx: 584,
    cy: 482,
    delaySeconds: 1.1,
    tournamentName: 'Corporate Super Cup 2027',
    matchScore: 'Auction Room Live • 42 Players Drafted',
    status: 'Auction Concluded',
  },
  {
    id: 'delhi',
    city: 'New Delhi',
    country: 'India',
    region: 'South Asia',
    cx: 588,
    cy: 458,
    delaySeconds: 2.3,
    tournamentName: 'DDPL Premier League',
    matchScore: 'Tech Titans 143/8 vs Strikers 134/6',
    status: 'Grand Finals',
  },
  {
    id: 'bangalore',
    city: 'Bengaluru',
    country: 'India',
    region: 'South Asia',
    cx: 590,
    cy: 496,
    delaySeconds: 0.7,
    tournamentName: 'Silicon City Corporate T20',
    matchScore: 'Byte Warriors 98/2 (7.1 Ov)',
    status: 'Live Match',
  },
  {
    id: 'dhaka',
    city: 'Dhaka',
    country: 'Bangladesh',
    region: 'South Asia',
    cx: 618,
    cy: 462,
    delaySeconds: 3.4,
    tournamentName: 'Bengal Corporate Premier League',
    matchScore: 'Padma Super Kings 138/7 (10 Ov)',
    status: 'Grand Finals',
  },
  {
    id: 'colombo',
    city: 'Colombo',
    country: 'Sri Lanka',
    region: 'South Asia',
    cx: 604,
    cy: 508,
    delaySeconds: 1.8,
    tournamentName: 'Island Corporate League',
    matchScore: 'Colombo Lions 112/5 (8.4 Ov)',
    status: 'Live Match',
  },
  {
    id: 'lahore',
    city: 'Lahore',
    country: 'Pakistan',
    region: 'South Asia',
    cx: 572,
    cy: 450,
    delaySeconds: 4.1,
    tournamentName: 'Punjab Corporate Shield',
    matchScore: 'Qalandars XI 105/3 (8.0 Ov)',
    status: 'Live Match',
  },
  {
    id: 'london',
    city: 'London',
    country: 'United Kingdom',
    region: 'Europe',
    cx: 413,
    cy: 386,
    delaySeconds: 2.7,
    tournamentName: 'UK Corporate City Championship',
    matchScore: 'Canary Wharf XI 88/2 (7.0 Ov)',
    status: 'Live Match',
  },
  {
    id: 'amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    cx: 422,
    cy: 388,
    delaySeconds: 0.5,
    tournamentName: 'European Tech Cricket Trophy',
    matchScore: 'Tulip Titans 74/1 (5.4 Ov)',
    status: 'Live Match',
  },
  {
    id: 'newyork',
    city: 'New York',
    country: 'United States',
    region: 'North America',
    cx: 230,
    cy: 398,
    delaySeconds: 3.8,
    tournamentName: 'North America Corporate T20',
    matchScore: 'Wall Street Strikers 92/3 (6.4 Ov)',
    status: 'Live Match',
  },
  {
    id: 'seattle',
    city: 'Seattle',
    country: 'United States',
    region: 'North America',
    cx: 146,
    cy: 372,
    delaySeconds: 1.4,
    tournamentName: 'Pacific Northwest Corporate Cup',
    matchScore: 'Cascade Kings 118/4 (9.0 Ov)',
    status: 'Live Match',
  },
  {
    id: 'toronto',
    city: 'Toronto',
    country: 'Canada',
    region: 'North America',
    cx: 224,
    cy: 386,
    delaySeconds: 4.5,
    tournamentName: 'Great Lakes Invitational',
    matchScore: 'Franchise Player Draft Ready',
    status: 'Player Registration',
  },
  {
    id: 'barbados',
    city: 'Kingston / West Indies',
    country: 'Jamaica & Caribbean',
    region: 'Caribbean',
    cx: 228,
    cy: 475,
    delaySeconds: 2.0,
    tournamentName: 'Caribbean Corporate Bash',
    matchScore: 'Calypso Kings 132/5 (9.3 Ov)',
    status: 'Live Match',
  },
  {
    id: 'johannesburg',
    city: 'Johannesburg',
    country: 'South Africa',
    region: 'Africa',
    cx: 472,
    cy: 594,
    delaySeconds: 3.0,
    tournamentName: 'Highveld Corporate League',
    matchScore: 'Gold Strikers 110/6 (8.5 Ov)',
    status: 'Live Match',
  },
  {
    id: 'nairobi',
    city: 'Nairobi',
    country: 'Kenya',
    region: 'Africa',
    cx: 494,
    cy: 524,
    delaySeconds: 0.9,
    tournamentName: 'East Africa Corporate Trophy',
    matchScore: 'Savannah Lions 76/1 (5.2 Ov)',
    status: 'Live Match',
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    cx: 654,
    cy: 526,
    delaySeconds: 2.5,
    tournamentName: 'Asia-Pacific Tech Cup',
    matchScore: 'Registrations Open • 8 Franchises',
    status: 'Player Registration',
  },
  {
    id: 'sydney',
    city: 'Sydney',
    country: 'Australia',
    region: 'Oceania',
    cx: 714,
    cy: 626,
    delaySeconds: 1.6,
    tournamentName: 'Down Under Corporate Clash',
    matchScore: 'Sydney Thunder 155/5 (10.0 Ov)',
    status: 'Live Match',
  },
  {
    id: 'melbourne',
    city: 'Melbourne',
    country: 'Australia',
    region: 'Oceania',
    cx: 704,
    cy: 636,
    delaySeconds: 4.3,
    tournamentName: 'Victoria Corporate Cup',
    matchScore: 'Live Scoring Active • 2nd Innings',
    status: 'Live Match',
  },
  {
    id: 'perth',
    city: 'Perth',
    country: 'Australia',
    region: 'Oceania',
    cx: 668,
    cy: 618,
    delaySeconds: 3.2,
    tournamentName: 'Western Australia Corporate League',
    matchScore: 'Sunset Warriors 85/3 (6.1 Ov)',
    status: 'Live Match',
  },
  {
    id: 'auckland',
    city: 'Auckland',
    country: 'New Zealand',
    region: 'Oceania',
    cx: 806,
    cy: 662,
    delaySeconds: 2.1,
    tournamentName: 'Kiwi Corporate Championship',
    matchScore: 'Waitakere Hawks 94/2 (7.4 Ov)',
    status: 'Live Match',
  },
];

export function GlobalMatchRadarMap() {
  const [selectedHub, setSelectedHub] = useState<RadarHub>(GLOBAL_HUBS[0]);

  return (
    <section className="space-y-4 relative overflow-hidden py-4">
      {/* Editorial Card themed to match CricPlus luxury dark navy/gold palette */}
      <div className="bg-gradient-to-b from-[#08111F] via-[#0D1B2A] to-[#08111F] rounded-3xl p-5 sm:p-7 border border-[#D8AD55]/30 shadow-2xl relative overflow-hidden text-white transition-all duration-300">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[220px] bg-[#D8AD55]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Editorial Header */}
        <div className="text-center space-y-1.5 max-w-2xl mx-auto pt-1 pb-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-[11px] font-bold uppercase tracking-wider">
            <Globe className="w-3 h-3 text-[#D8AD55]" />
            <span>Global Match Radar</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
            The game took us places
          </h2>
          <p className="text-xs sm:text-sm text-[#8793A5] font-normal">
            Different countries, different grounds, different ways of playing.
          </p>
        </div>

        {/* Live Active Match Pill / Ticker */}
        <div className="max-w-2xl mx-auto mb-3 flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-[#08111F]/90 border border-[#D8AD55]/25 text-xs shadow-md relative z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="text-[#8793A5] text-[11px] sm:text-xs">
              Active Ground: <strong className="text-white font-semibold">{selectedHub.city}, {selectedHub.country}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 text-[11px] sm:text-xs">
            <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span className="font-semibold text-[#F2D69A]">{selectedHub.tournamentName}</span>
            <span className="hidden sm:inline text-emerald-400 font-mono">• {selectedHub.matchScore}</span>
          </div>
        </div>

        {/* Scalable Compact World Map with Calibrated Landmass Radar Nodes */}
        <div className="relative w-full aspect-[2.4/1] max-h-[340px] sm:max-h-[380px] my-1 select-none">
          <svg
            viewBox="30.767 241.591 784.077 458.627"
            className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Inline CSS Keyframes for Asynchronous Radar Waves */}
            <defs>
              <style>{`
                @keyframes radarPulse {
                  0% {
                    r: 3.5px;
                    opacity: 0.95;
                    stroke-width: 1px;
                  }
                  50% {
                    opacity: 0.5;
                    stroke-width: 0.8px;
                  }
                  100% {
                    r: 16px;
                    opacity: 0;
                    stroke-width: 0.4px;
                  }
                }
                .radar-pulse-ring {
                  animation: radarPulse 2.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
                  transform-origin: center;
                }
                .radar-pulse-outer {
                  animation: radarPulse 2.8s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
                  animation-delay: 0.4s;
                  transform-origin: center;
                }
              `}</style>
            </defs>

            {/* Geographical Vector Continents in Dark Luxury Palette */}
            <WorldMapPaths />

            {/* Asynchronous Red Blinking Radar Hotspots calibrated to dry land */}
            {GLOBAL_HUBS.map((hub) => {
              const isSelected = selectedHub.id === hub.id;

              return (
                <g
                  key={hub.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedHub(hub)}
                  onMouseEnter={() => setSelectedHub(hub)}
                >
                  {/* Invisible enlarged hit target for effortless touch & hover */}
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={12}
                    fill="transparent"
                  />

                  {/* Outer Radar Concentric Ring (Staggered Animation) */}
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={14}
                    fill="none"
                    stroke="#EF4444"
                    className="radar-pulse-outer"
                    style={{
                      animationDelay: `${hub.delaySeconds}s`,
                      transformOrigin: `${hub.cx}px ${hub.cy}px`,
                    }}
                  />

                  {/* Inner Radar Concentric Ring (Staggered Animation) */}
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={7}
                    fill="none"
                    stroke="#EF4444"
                    className="radar-pulse-ring"
                    style={{
                      animationDelay: `${hub.delaySeconds}s`,
                      transformOrigin: `${hub.cx}px ${hub.cy}px`,
                    }}
                  />

                  {/* Static Ambient Radar Ring */}
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={isSelected ? 9 : 6.5}
                    fill="rgba(239, 68, 68, 0.15)"
                    stroke="#EF4444"
                    strokeWidth={isSelected ? 1.4 : 0.7}
                    strokeOpacity={isSelected ? 0.95 : 0.5}
                    className="transition-all duration-300"
                  />

                  {/* Central Solid Red Blinking Hotspot Dot */}
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={isSelected ? 4 : 3.2}
                    fill="#EF4444"
                    className="drop-shadow-[0_0_6px_rgba(239,68,68,0.9)] transition-all duration-300"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Tagline matching user reference image */}
        <div className="text-center pt-2 pb-0 relative z-10">
          <p className="text-xs sm:text-sm text-slate-300 tracking-normal">
            Someone, somewhere, is playing cricket{' '}
            <span className="text-red-500 font-bold italic tracking-wide">right now.</span>
          </p>
        </div>

        {/* Interactive Details Footer for Selected Hub */}
        <div className="mt-3 pt-3 border-t border-[#D8AD55]/15 flex flex-wrap items-center justify-between gap-2.5 text-xs relative z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span className="font-semibold text-white">{selectedHub.city}, {selectedHub.country}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
              {selectedHub.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#8793A5] hidden md:inline text-[11px]">
              {selectedHub.matchScore}
            </span>
            <Link
              href="/matches"
              className="inline-flex items-center gap-1 font-bold text-[#F2D69A] hover:text-white transition-colors"
            >
              <span>Explore Grounds & Matches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
