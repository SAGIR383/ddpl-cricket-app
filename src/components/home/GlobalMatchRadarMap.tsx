'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight, Activity, MapPin } from 'lucide-react';
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
    cx: 532,
    cy: 466,
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
    cx: 582,
    cy: 486,
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
    cx: 587,
    cy: 462,
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
    cx: 588,
    cy: 498,
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
    cx: 620,
    cy: 465,
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
    cx: 605,
    cy: 512,
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
    cx: 574,
    cy: 452,
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
    cx: 412,
    cy: 382,
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
    cx: 426,
    cy: 380,
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
    cx: 232,
    cy: 402,
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
    cx: 148,
    cy: 375,
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
    cy: 390,
    delaySeconds: 4.5,
    tournamentName: 'Great Lakes Invitational',
    matchScore: 'Franchise Player Draft Ready',
    status: 'Player Registration',
  },
  {
    id: 'barbados',
    city: 'Bridgetown',
    country: 'Barbados',
    region: 'Caribbean',
    cx: 236,
    cy: 476,
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
    cx: 475,
    cy: 592,
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
    cx: 497,
    cy: 526,
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
    cx: 652,
    cy: 530,
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
    cx: 722,
    cy: 642,
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
    cx: 712,
    cy: 656,
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
    cy: 630,
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
    cx: 768,
    cy: 665,
    delaySeconds: 2.1,
    tournamentName: 'Kiwi Corporate Championship',
    matchScore: 'Waitakere Hawks 94/2 (7.4 Ov)',
    status: 'Live Match',
  },
];

export function GlobalMatchRadarMap() {
  const [selectedHub, setSelectedHub] = useState<RadarHub>(GLOBAL_HUBS[0]);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <section className="space-y-6 relative overflow-hidden py-6">
      {/* Editorial Card matching user reference image */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl relative overflow-hidden text-slate-900 transition-all duration-300">
        
        {/* Editorial Header */}
        <div className="text-center space-y-2 max-w-3xl mx-auto pt-2 pb-4">
          <h2 className="font-sans font-black text-3xl sm:text-5xl text-slate-900 tracking-tight">
            The game took us places
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-normal">
            Different countries, different grounds, different ways of playing.
          </p>
        </div>

        {/* Live Active Match Pill / Ticker */}
        <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between p-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
            <span className="text-slate-600 font-medium">
              Active Ground: <strong className="text-slate-900 font-semibold">{selectedHub.city}, {selectedHub.country}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-900">{selectedHub.tournamentName}</span>
            <span className="hidden sm:inline text-emerald-600 font-mono">• {selectedHub.matchScore}</span>
          </div>
        </div>

        {/* Scalable Geographical World Map with Staggered Radar Hotspots */}
        <div className="relative w-full aspect-[784/458] my-2 select-none">
          <svg
            viewBox="30.767 241.591 784.077 458.627"
            className="w-full h-full object-contain"
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
                @keyframes coreGlow {
                  0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                  50% {
                    transform: scale(0.85);
                    opacity: 0.65;
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

            {/* Geographical Vector Continents */}
            <WorldMapPaths />

            {/* Asynchronous Red Blinking Radar Hotspots */}
            {GLOBAL_HUBS.map((hub) => {
              const isSelected = selectedHub.id === hub.id;

              return (
                <g
                  key={hub.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedHub(hub)}
                  onMouseEnter={() => {
                    setSelectedHub(hub);
                    setIsHovered(true);
                  }}
                  onMouseLeave={() => setIsHovered(false)}
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
                    stroke="#DC2626"
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
                    stroke="#DC2626"
                    className="radar-pulse-ring"
                    style={{
                      animationDelay: `${hub.delaySeconds}s`,
                      transformOrigin: `${hub.cx}px ${hub.cy}px`,
                    }}
                  />

                  {/* Static Ambient Radar Ring (matching reference image) */}
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={isSelected ? 9 : 6.5}
                    fill="rgba(220, 38, 38, 0.08)"
                    stroke="#DC2626"
                    strokeWidth={isSelected ? 1.2 : 0.6}
                    strokeOpacity={isSelected ? 0.9 : 0.45}
                    className="transition-all duration-300"
                  />

                  {/* Central Solid Red Blinking Hotspot Dot */}
                  <circle
                    cx={hub.cx}
                    cy={hub.cy}
                    r={isSelected ? 4 : 3.2}
                    fill="#DC2626"
                    className="drop-shadow-[0_0_4px_rgba(220,38,38,0.7)] transition-all duration-300"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Tagline matching user reference image */}
        <div className="text-center pt-3 pb-1">
          <p className="text-xs sm:text-sm text-slate-700 tracking-normal">
            Someone, somewhere, is playing cricket{' '}
            <span className="text-red-600 font-bold italic">right now.</span>
          </p>
        </div>

        {/* Interactive Floating Details for Selected Hub */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="font-semibold text-slate-800">{selectedHub.city}, {selectedHub.country}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
              {selectedHub.status}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-500 hidden md:inline">
              {selectedHub.matchScore}
            </span>
            <Link
              href="/matches"
              className="inline-flex items-center gap-1 font-bold text-red-600 hover:text-red-700 hover:underline"
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
