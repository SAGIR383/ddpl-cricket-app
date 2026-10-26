'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, Radio, Sparkles, MapPin, Activity, Trophy, ChevronRight } from 'lucide-react';

interface RadarHub {
  id: string;
  city: string;
  country: string;
  xPercent: number; // 0 to 100 on world map SVG coordinate
  yPercent: number; // 0 to 100 on world map SVG coordinate
  delaySeconds: number; // Staggered blinking delay so they don't blink at the same time
  tournamentName: string;
  matchScore: string;
  status: 'Live Match' | 'Auction Concluded' | 'Grand Finals' | 'Player Registration';
}

const GLOBAL_HUBS: RadarHub[] = [
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    xPercent: 62.5,
    yPercent: 44.5,
    delaySeconds: 0.2,
    tournamentName: 'Game of RUN Corporate 2027',
    matchScore: 'Desert Hawks 124/4 (9.2 Ov) • Live',
    status: 'Live Match',
  },
  {
    id: 'delhi',
    city: 'New Delhi',
    country: 'India',
    xPercent: 68.5,
    yPercent: 42.0,
    delaySeconds: 1.5,
    tournamentName: 'DDPL Premier League',
    matchScore: 'Tech Titans 143/8 vs Strikers 134/6',
    status: 'Grand Finals',
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    country: 'India',
    xPercent: 67.2,
    yPercent: 48.0,
    delaySeconds: 0.8,
    tournamentName: 'Corporate Super Cup 2027',
    matchScore: 'Auction Room Live • 42 Players Drafted',
    status: 'Auction Concluded',
  },
  {
    id: 'london',
    city: 'London',
    country: 'United Kingdom',
    xPercent: 48.0,
    yPercent: 28.5,
    delaySeconds: 2.3,
    tournamentName: 'UK Corporate City Championship',
    matchScore: 'Canary Wharf XI 88/2 (7.0 Ov)',
    status: 'Live Match',
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    xPercent: 76.5,
    yPercent: 57.0,
    delaySeconds: 3.1,
    tournamentName: 'Asia-Pacific Tech Cup',
    matchScore: 'Registrations Open • 8 Franchises',
    status: 'Player Registration',
  },
  {
    id: 'sydney',
    city: 'Sydney',
    country: 'Australia',
    xPercent: 88.0,
    yPercent: 78.0,
    delaySeconds: 1.1,
    tournamentName: 'Down Under Corporate Clash',
    matchScore: 'Sydney Thunder 155/5 (10.0 Ov)',
    status: 'Live Match',
  },
  {
    id: 'newyork',
    city: 'New York',
    country: 'United States',
    xPercent: 28.5,
    yPercent: 34.0,
    delaySeconds: 2.7,
    tournamentName: 'North America Corporate T20',
    matchScore: 'Wall Street Strikers 92/3 (6.4 Ov)',
    status: 'Live Match',
  },
  {
    id: 'toronto',
    city: 'Toronto',
    country: 'Canada',
    xPercent: 26.5,
    yPercent: 30.5,
    delaySeconds: 0.5,
    tournamentName: 'Great Lakes Invitational',
    matchScore: 'Franchise Player Draft Ready',
    status: 'Player Registration',
  },
  {
    id: 'johannesburg',
    city: 'Johannesburg',
    country: 'South Africa',
    xPercent: 54.5,
    yPercent: 72.0,
    delaySeconds: 1.9,
    tournamentName: 'Highveld Corporate League',
    matchScore: 'Gold Strikers 110/6 (8.5 Ov)',
    status: 'Live Match',
  },
  {
    id: 'nairobi',
    city: 'Nairobi',
    country: 'Kenya',
    xPercent: 57.5,
    yPercent: 56.5,
    delaySeconds: 3.6,
    tournamentName: 'East Africa Corporate Trophy',
    matchScore: 'Savannah Lions 76/1 (5.2 Ov)',
    status: 'Live Match',
  },
  {
    id: 'dhaka',
    city: 'Dhaka',
    country: 'Bangladesh',
    xPercent: 72.0,
    yPercent: 44.0,
    delaySeconds: 2.0,
    tournamentName: 'Bengal Corporate Premier League',
    matchScore: 'Padma Super Kings 138/7 (10 Ov)',
    status: 'Grand Finals',
  },
  {
    id: 'melbourne',
    city: 'Melbourne',
    country: 'Australia',
    xPercent: 86.5,
    yPercent: 82.5,
    delaySeconds: 3.9,
    tournamentName: 'Victoria Corporate Cup',
    matchScore: 'Live Scoring Active • 2nd Innings',
    status: 'Live Match',
  },
];

export function GlobalMatchRadarMap() {
  const [selectedHub, setSelectedHub] = useState<RadarHub>(GLOBAL_HUBS[0]);

  return (
    <section className="space-y-8 relative overflow-hidden py-8">
      {/* Editorial Header (Matching Image 2 Reference) */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-widest">
          <Globe className="w-3.5 h-3.5 text-[#D8AD55]" />
          <span>Global Corporate Cricket Footprint</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
          The game took us places
        </h2>
        <p className="text-sm sm:text-base text-[#8793A5] font-medium max-w-xl mx-auto">
          Different countries, different grounds, different ways of playing. One seamless digital cricket management platform.
        </p>
      </div>

      {/* World Map Container */}
      <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-b from-[#08111F] via-[#0D1B2A] to-[#08111F] border border-[#D8AD55]/30 shadow-2xl relative overflow-hidden">
        
        {/* Subtle Map Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D8AD55]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Live Active Match Overlay Pill */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/5 relative z-20">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <div className="text-xs">
              <span className="text-gray-400">Inspecting Live Hub:</span>{' '}
              <strong className="text-white">{selectedHub.city}, {selectedHub.country}</strong>
            </div>
          </div>

          <div className="p-2 sm:px-4 sm:py-1.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-xs flex items-center gap-2.5">
            <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span className="text-[#F2D69A] font-bold">{selectedHub.tournamentName}</span>
            <span className="text-xs text-emerald-400 font-mono hidden md:inline">• {selectedHub.matchScore}</span>
          </div>
        </div>

        {/* Scalable SVG World Map with Asynchronous Pulsing Radar Nodes */}
        <div className="relative w-full aspect-[2/1] min-h-[300px] sm:min-h-[420px] max-h-[580px] my-4 select-none">
          
          {/* Base Vector Continents Silhouette SVG */}
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="continentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Simplified Stylized World Continents Paths */}
            {/* North America */}
            <path
              d="M120,60 L240,50 L320,70 L340,110 L300,160 L260,190 L220,180 L190,140 L140,130 L110,90 Z M220,195 L245,210 L255,245 L240,260 L225,230 Z"
              fill="url(#continentGradient)"
              stroke="#D8AD55"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
            {/* South America */}
            <path
              d="M260,260 L330,270 L360,330 L340,410 L300,470 L280,450 L270,360 L245,300 Z"
              fill="url(#continentGradient)"
              stroke="#D8AD55"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
            {/* Europe */}
            <path
              d="M450,70 L540,65 L570,95 L530,130 L490,140 L450,120 L440,90 Z M420,80 L440,75 L435,95 Z"
              fill="url(#continentGradient)"
              stroke="#D8AD55"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
            {/* Africa */}
            <path
              d="M450,150 L560,150 L590,210 L580,310 L540,400 L490,390 L460,280 L430,210 Z M590,330 L605,340 L595,370 Z"
              fill="url(#continentGradient)"
              stroke="#D8AD55"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
            {/* Asia */}
            <path
              d="M560,65 L820,70 L860,120 L840,200 L790,260 L730,270 L680,240 L650,170 L580,140 Z M640,240 L700,245 L690,310 L650,290 Z M735,275 L770,285 L760,330 L730,310 Z"
              fill="url(#continentGradient)"
              stroke="#D8AD55"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
            {/* Australia & Oceania */}
            <path
              d="M780,340 L880,330 L900,390 L870,440 L790,430 L760,380 Z M900,430 L920,440 L910,470 Z"
              fill="url(#continentGradient)"
              stroke="#D8AD55"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
          </svg>

          {/* Radar Hotspot Overlays on the Map */}
          {GLOBAL_HUBS.map((hub) => {
            const isSelected = selectedHub.id === hub.id;
            return (
              <div
                key={hub.id}
                style={{
                  left: `${hub.xPercent}%`,
                  top: `${hub.yPercent}%`,
                }}
                onClick={() => setSelectedHub(hub)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30"
              >
                {/* 1. Outer Asynchronous Expanding Radar Ring (Matching Image 2 Red Concentric Circles) */}
                <span
                  style={{ animationDelay: `${hub.delaySeconds}s` }}
                  className="absolute -inset-3.5 rounded-full border border-rose-500/50 animate-ping pointer-events-none"
                />

                {/* 2. Middle Radar Pulse Wave */}
                <span
                  style={{ animationDelay: `${hub.delaySeconds + 0.4}s` }}
                  className="absolute -inset-1.5 rounded-full bg-rose-500/30 animate-pulse pointer-events-none"
                />

                {/* 3. Core Hotspot Solid Center Dot */}
                <div
                  className={`w-3 h-3 rounded-full transition-transform duration-200 border-2 ${
                    isSelected
                      ? 'bg-rose-500 border-white scale-150 shadow-[0_0_12px_rgba(244,63,94,1)]'
                      : 'bg-rose-500 border-[#08111F] group-hover:scale-125 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                  }`}
                />

                {/* 4. Hover Tooltip Pill */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                  <div className="px-3 py-1.5 rounded-xl bg-[#08111F]/95 backdrop-blur-md border border-[#D8AD55]/40 text-[10px] text-white font-bold shadow-xl space-y-0.5 text-center">
                    <div className="text-[#F2D69A]">{hub.city}, {hub.country}</div>
                    <div className="text-[9px] text-[#8793A5]">{hub.tournamentName}</div>
                    <div className="text-[9px] text-emerald-400 font-mono">{hub.matchScore}</div>
                  </div>
                  <div className="w-2 h-2 bg-[#08111F] rotate-45 border-r border-b border-[#D8AD55]/40 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Tagline (Matching Image 2 Reference: "Someone, somewhere, is playing cricket right now.") */}
        <div className="text-center pt-6 border-t border-white/5 space-y-2 relative z-20">
          <p className="font-display font-medium text-sm sm:text-base text-gray-300 italic">
            Someone, somewhere, is playing corporate cricket{' '}
            <strong className="text-rose-400 font-black not-italic drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
              right now.
            </strong>
          </p>

          {/* Quick Metrics Live Strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-2 text-xs text-[#8793A5] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>12 Global Hubs Live</span>
            </span>
            <span className="text-gray-400">•</span>
            <span>48 Verified Franchises</span>
            <span className="text-gray-400">•</span>
            <span className="text-[#F2D69A]">2,500+ Ball Events Synced</span>
          </div>
        </div>
      </div>
    </section>
  );
}
