'use client';

import React, { useState, useMemo } from 'react';
import { DeliveryEvent, WagonWheelZone } from '@/types/match.types';
import { Compass, Target, PieChart, ShieldCheck } from 'lucide-react';

export interface WagonWheelProps {
  deliveries: DeliveryEvent[];
  interactive?: boolean;
  selectedZone?: WagonWheelZone | null;
  onSelectZone?: (zone: WagonWheelZone) => void;
  batterNameFilter?: string | null;
}

export const ZONE_CONFIG: Record<
  WagonWheelZone,
  { label: string; side: 'off' | 'leg'; angleStart: number; angleEnd: number; centerAngle: number }
> = {
  third_man: { label: 'Third Man', side: 'off', angleStart: 315, angleEnd: 360, centerAngle: 337.5 },
  cover_point: { label: 'Point / Cover Point', side: 'off', angleStart: 0, angleEnd: 45, centerAngle: 22.5 },
  extra_cover: { label: 'Extra Cover', side: 'off', angleStart: 45, angleEnd: 90, centerAngle: 67.5 },
  long_off: { label: 'Long Off', side: 'off', angleStart: 90, angleEnd: 135, centerAngle: 112.5 },
  long_on: { label: 'Long On', side: 'leg', angleStart: 135, angleEnd: 180, centerAngle: 157.5 },
  mid_wicket: { label: 'Mid Wicket', side: 'leg', angleStart: 180, angleEnd: 225, centerAngle: 202.5 },
  square_leg: { label: 'Square Leg', side: 'leg', angleStart: 225, angleEnd: 270, centerAngle: 247.5 },
  fine_leg: { label: 'Fine Leg', side: 'leg', angleStart: 270, angleEnd: 315, centerAngle: 292.5 },
};

export function WagonWheel({
  deliveries = [],
  interactive = false,
  selectedZone = null,
  onSelectZone,
  batterNameFilter = null,
}: WagonWheelProps) {
  const [hoveredZone, setHoveredZone] = useState<WagonWheelZone | null>(null);

  // Filter deliveries if batter specified
  const filteredDeliveries = useMemo(() => {
    if (!batterNameFilter) return deliveries;
    return deliveries.filter(
      (d) => d.strikerName?.toLowerCase() === batterNameFilter.toLowerCase()
    );
  }, [deliveries, batterNameFilter]);

  // Sector aggregated analytics
  const sectorStats = useMemo(() => {
    const stats: Record<WagonWheelZone, { runs: number; shots: number; fours: number; sixes: number }> = {
      third_man: { runs: 0, shots: 0, fours: 0, sixes: 0 },
      cover_point: { runs: 0, shots: 0, fours: 0, sixes: 0 },
      extra_cover: { runs: 0, shots: 0, fours: 0, sixes: 0 },
      long_off: { runs: 0, shots: 0, fours: 0, sixes: 0 },
      long_on: { runs: 0, shots: 0, fours: 0, sixes: 0 },
      mid_wicket: { runs: 0, shots: 0, fours: 0, sixes: 0 },
      square_leg: { runs: 0, shots: 0, fours: 0, sixes: 0 },
      fine_leg: { runs: 0, shots: 0, fours: 0, sixes: 0 },
    };

    let totalRuns = 0;
    let offRuns = 0;
    let legRuns = 0;

    filteredDeliveries.forEach((d) => {
      // Deterministic fallback if ball had runs but no zone recorded
      let zone: WagonWheelZone = d.shotZone as WagonWheelZone;
      if (!zone && d.runsBat > 0) {
        // Pseudo-deterministic placement for legacy balls
        const hash = (d.ball * 37 + d.runsBat * 19 + d.over * 7) % 8;
        const zones: WagonWheelZone[] = [
          'cover_point',
          'extra_cover',
          'long_off',
          'long_on',
          'mid_wicket',
          'square_leg',
          'fine_leg',
          'third_man',
        ];
        zone = zones[hash];
      }

      if (zone && stats[zone]) {
        stats[zone].runs += d.runsBat;
        stats[zone].shots += 1;
        if (d.isFour) stats[zone].fours += 1;
        if (d.isSix) stats[zone].sixes += 1;

        totalRuns += d.runsBat;
        if (ZONE_CONFIG[zone].side === 'off') offRuns += d.runsBat;
        else legRuns += d.runsBat;
      }
    });

    return { stats, totalRuns, offRuns, legRuns };
  }, [filteredDeliveries]);

  // Center coordinate of SVG
  const cx = 200;
  const cy = 200;
  const radius = 175;
  const innerRadius = 70;

  // Convert polar to cartesian coordinates
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  // SVG Pie slice path
  const describeArcSector = (
    centerX: number,
    centerY: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(centerX, centerY, r, endAngle);
    const end = polarToCartesian(centerX, centerY, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M',
      centerX,
      centerY,
      'L',
      start.x,
      start.y,
      'A',
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'Z',
    ].join(' ');
  };

  return (
    <div className="w-full space-y-6">
      {/* Off-Side vs Leg-Side Ratio Bar */}
      <div className="p-4 rounded-2xl bg-[#08111F] border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-cyan-400">
            Off Side: {sectorStats.offRuns} runs (
            {sectorStats.totalRuns > 0
              ? Math.round((sectorStats.offRuns / sectorStats.totalRuns) * 100)
              : 50}
            %)
          </span>
          <span className="text-[#D8AD55]">Total: {sectorStats.totalRuns} Runs</span>
          <span className="text-emerald-400">
            Leg Side: {sectorStats.legRuns} runs (
            {sectorStats.totalRuns > 0
              ? Math.round((sectorStats.legRuns / sectorStats.totalRuns) * 100)
              : 50}
            %)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{
              width: `${
                sectorStats.totalRuns > 0
                  ? (sectorStats.offRuns / sectorStats.totalRuns) * 100
                  : 50
              }%`,
            }}
          />
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{
              width: `${
                sectorStats.totalRuns > 0
                  ? (sectorStats.legRuns / sectorStats.totalRuns) * 100
                  : 50
              }%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Wagon Wheel Stadium Ground */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          <div className="relative w-full max-w-[380px] aspect-square rounded-full p-2 bg-[#050B14] border-2 border-white/10 shadow-2xl shadow-black/80 flex items-center justify-center">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full select-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <radialGradient id="fieldGrass" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0B201B" />
                  <stop offset="70%" stopColor="#081A15" />
                  <stop offset="100%" stopColor="#05120E" />
                </radialGradient>
                <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Cricket Ground Base Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="url(#fieldGrass)"
                stroke="#1B4D3E"
                strokeWidth="3"
                className="transition-all"
              />

              {/* 30-Yard Inner Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={innerRadius}
                fill="none"
                stroke="#2B6B56"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />

              {/* 8 Sector Slices (Interactive or Display) */}
              {(Object.keys(ZONE_CONFIG) as WagonWheelZone[]).map((zoneKey) => {
                const cfg = ZONE_CONFIG[zoneKey];
                const isSelected = selectedZone === zoneKey;
                const isHovered = hoveredZone === zoneKey;
                const zStat = sectorStats.stats[zoneKey];

                return (
                  <g key={zoneKey}>
                    <path
                      d={describeArcSector(cx, cy, radius, cfg.angleStart, cfg.angleEnd)}
                      fill={
                        isSelected
                          ? '#D8AD55'
                          : isHovered
                          ? '#164E63'
                          : 'transparent'
                      }
                      fillOpacity={isSelected ? 0.35 : isHovered ? 0.25 : 0}
                      stroke={isSelected ? '#D8AD55' : '#1B4D3E'}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray="3 3"
                      className={`transition-colors ${
                        interactive ? 'cursor-pointer hover:fill-cyan-500/20' : ''
                      }`}
                      onMouseEnter={() => setHoveredZone(zoneKey)}
                      onMouseLeave={() => setHoveredZone(null)}
                      onClick={() => onSelectZone && onSelectZone(zoneKey)}
                    />

                    {/* Sector Text Label positioned along radius */}
                    {(() => {
                      const pos = polarToCartesian(cx, cy, radius * 0.82, cfg.centerAngle);
                      return (
                        <text
                          x={pos.x}
                          y={pos.y}
                          fill={isSelected ? '#F2D69A' : '#73839B'}
                          fontSize="9"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none uppercase tracking-tighter"
                        >
                          {zStat.runs > 0 ? `${zStat.runs}r` : ''}
                        </text>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Trajectory Shot Lines from Pitch to Boundary */}
              {filteredDeliveries
                .filter((d) => d.runsBat > 0 || d.isWicket)
                .slice(-35) // Recent 35 shots
                .map((d, idx) => {
                  let zone = d.shotZone as WagonWheelZone;
                  if (!zone) {
                    const fallbackZones: WagonWheelZone[] = [
                      'cover_point',
                      'extra_cover',
                      'long_off',
                      'long_on',
                      'mid_wicket',
                      'square_leg',
                      'fine_leg',
                      'third_man',
                    ];
                    zone = fallbackZones[(idx * 3 + d.runsBat) % 8];
                  }

                  const cfg = ZONE_CONFIG[zone] || ZONE_CONFIG.extra_cover;
                  // Jitter angle slightly so multiple shots don't overlap exactly
                  const jitter = ((idx % 7) - 3) * 4;
                  const angle = cfg.centerAngle + jitter;

                  // Distance: 6s reach boundary (radius), 4s reach rope (radius * 0.95), singles inside
                  const dist = d.isSix
                    ? radius * 0.98
                    : d.isFour
                    ? radius * 0.92
                    : d.runsBat >= 2
                    ? radius * 0.72
                    : radius * 0.48;

                  const endPos = polarToCartesian(cx, cy, dist, angle);

                  let strokeColor = '#94A3B8'; // 1-3 singles: slate
                  if (d.isSix) strokeColor = '#EF4444'; // 6: red
                  else if (d.isFour) strokeColor = '#D8AD55'; // 4: gold
                  else if (d.runsBat > 0) strokeColor = '#38BDF8'; // 1-3: sky

                  return (
                    <g key={d.id || idx}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={endPos.x}
                        y2={endPos.y}
                        stroke={strokeColor}
                        strokeWidth={d.isSix ? 2.5 : d.isFour ? 2 : 1.2}
                        strokeLinecap="round"
                        opacity={d.isSix || d.isFour ? 0.9 : 0.65}
                      />
                      <circle
                        cx={endPos.x}
                        cy={endPos.y}
                        r={d.isSix ? 3.5 : d.isFour ? 2.8 : 2}
                        fill={strokeColor}
                      />
                    </g>
                  );
                })}

              {/* Cricket Pitch in the Center */}
              <rect
                x={cx - 5}
                y={cy - 20}
                width={10}
                height={40}
                rx={2}
                fill="#C2A676"
                stroke="#684D2B"
                strokeWidth="1"
              />
              {/* Bowling & Batting Stumps */}
              <line x1={cx - 3} y1={cy - 16} x2={cx + 3} y2={cy - 16} stroke="#FFF" strokeWidth="1" />
              <line x1={cx - 3} y1={cy + 16} x2={cx + 3} y2={cy + 16} stroke="#FFF" strokeWidth="1" />
            </svg>
          </div>

          {/* Shot Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 6s (Maximal)
            </span>
            <span className="flex items-center gap-1.5 text-[#D8AD55] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8AD55]" /> 4s (Boundary)
            </span>
            <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> 1s, 2s, 3s
            </span>
          </div>
        </div>

        {/* Sector Analytics Breakdown List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-display font-black text-white uppercase tracking-wider">
              Field Zone
            </span>
            <span className="text-xs font-display font-black text-white uppercase tracking-wider">
              Runs (Boundaries)
            </span>
          </div>

          <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
            {(Object.keys(ZONE_CONFIG) as WagonWheelZone[]).map((zoneKey) => {
              const cfg = ZONE_CONFIG[zoneKey];
              const zStat = sectorStats.stats[zoneKey];
              const isSelected = selectedZone === zoneKey;
              const isHovered = hoveredZone === zoneKey;

              const pct =
                sectorStats.totalRuns > 0
                  ? Math.round((zStat.runs / sectorStats.totalRuns) * 100)
                  : 0;

              return (
                <div
                  key={zoneKey}
                  onClick={() => onSelectZone && onSelectZone(zoneKey)}
                  onMouseEnter={() => setHoveredZone(zoneKey)}
                  onMouseLeave={() => setHoveredZone(null)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#D8AD55]/15 border-[#D8AD55] text-white shadow-lg'
                      : isHovered
                      ? 'bg-white/10 border-cyan-500/50 text-white'
                      : 'bg-[#08111F] border-white/5 text-gray-300'
                  } ${interactive ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cfg.side === 'off' ? 'bg-cyan-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span className="font-bold">{cfg.label}</span>
                      <span className="text-[10px] text-gray-500 uppercase">({cfg.side})</span>
                    </div>

                    <div className="font-display font-black text-xs text-right">
                      <span className="text-[#F2D69A]">{zStat.runs} runs</span>
                      <span className="text-gray-400 font-normal ml-1 text-[11px]">
                        ({zStat.fours}x4, {zStat.sixes}x6)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        cfg.side === 'off' ? 'bg-cyan-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
