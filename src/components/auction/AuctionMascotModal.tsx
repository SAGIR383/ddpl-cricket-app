'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, HeartCrack, ArrowRight, X, DollarSign, Shield } from 'lucide-react';

interface MascotModalProps {
  isOpen: boolean;
  type: 'sold' | 'unsold';
  playerName: string;
  teamName?: string;
  price?: number;
  role?: string;
  onClose: () => void;
}

export default function AuctionMascotModal({
  isOpen,
  type,
  playerName,
  teamName,
  price,
  role,
  onClose,
}: MascotModalProps) {
  const [countdown, setCountdown] = useState(5);

  // Trigger celebration effects
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(5);

    if (type === 'sold') {
      // 1. Initial big center blast
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'],
      });

      // 2. Left side cannon
      const timerLeft = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.65 },
          colors: ['#F59E0B', '#10B981', '#60A5FA'],
        });
      }, 250);

      // 3. Right side cannon
      const timerRight = setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.65 },
          colors: ['#EC4899', '#8B5CF6', '#10B981'],
        });
      }, 450);

      // 4. Grand shower
      const timerShower = setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 120,
          origin: { y: 0.4 },
        });
      }, 800);

      return () => {
        clearTimeout(timerLeft);
        clearTimeout(timerRight);
        clearTimeout(timerShower);
      };
    }
  }, [isOpen, type]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[6px] animate-fade-in pointer-events-auto">
      {/* ------------------------------------------------------------- */}
      {/* FULL-SCREEN BURSTING CRACKERS & CELEBRATION EFFECTS */}
      {/* ------------------------------------------------------------- */}
      {type === 'sold' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Firecracker Spark Bursts in Corners and Sky */}
          <div className="absolute top-[12%] left-[10%] text-5xl sm:text-7xl animate-cracker" style={{ animationDelay: '0.1s' }}>
            🎆
          </div>
          <div className="absolute top-[18%] right-[12%] text-5xl sm:text-7xl animate-cracker" style={{ animationDelay: '0.35s' }}>
            🎇
          </div>
          <div className="absolute top-[35%] left-[6%] text-4xl sm:text-6xl animate-cracker" style={{ animationDelay: '0.6s' }}>
            ✨
          </div>
          <div className="absolute top-[30%] right-[8%] text-4xl sm:text-6xl animate-cracker" style={{ animationDelay: '0.2s' }}>
            💥
          </div>
          <div className="absolute bottom-[20%] left-[15%] text-5xl sm:text-6xl animate-cracker" style={{ animationDelay: '0.5s' }}>
            🎉
          </div>
          <div className="absolute bottom-[22%] right-[14%] text-5xl sm:text-6xl animate-cracker" style={{ animationDelay: '0.4s' }}>
            🎊
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOATING 3D INTERACTIVE MASCOT CARD ON TOP OF AUCTION ROOM */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`relative max-w-lg w-full rounded-3xl p-6 sm:p-8 text-center shadow-2xl border-2 transition-all transform animate-scale-up ${
          type === 'sold'
            ? 'bg-[#061426]/90 backdrop-blur-2xl border-emerald-400/60 shadow-[0_20px_60px_rgba(16,185,129,0.35)]'
            : 'bg-[#0b1329]/90 backdrop-blur-2xl border-amber-400/50 shadow-[0_20px_60px_rgba(245,158,11,0.25)]'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors z-20"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ============================================================= */}
        {/* CASE 1: SOLD (3D WALKING JOYFUL MASCOT + WELCOME TO THE TEAM) */}
        {/* ============================================================= */}
        {type === 'sold' ? (
          <div className="space-y-6">
            {/* Top Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-xs font-black uppercase tracking-wider animate-pulse shadow-lg">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span>HAMMER HAS FALLEN • PLAYER ACQUIRED!</span>
            </div>

            {/* 3D Walking Joyful Mascot Character */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {/* Radiating 3D Stadium Floodlight Aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400/40 via-teal-300/30 to-amber-300/40 blur-3xl animate-pulse" />

              {/* Floating Celebration Particles */}
              <div className="absolute -top-3 -left-3 text-3xl animate-bounce">✨</div>
              <div className="absolute -top-4 -right-3 text-3xl animate-bounce" style={{ animationDelay: '150ms' }}>🎉</div>
              <div className="absolute -bottom-2 -right-4 text-3xl animate-bounce" style={{ animationDelay: '300ms' }}>⭐</div>
              <div className="absolute -bottom-3 -left-4 text-3xl animate-bounce" style={{ animationDelay: '200ms' }}>🏏</div>

              {/* 3D Shaded Animated Mascot: "Chintu the Cricket Champ" */}
              <div className="animate-mascot-walk filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">
                <svg
                  viewBox="0 0 200 200"
                  className="w-48 h-48 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                >
                  <defs>
                    {/* 3D Gradients for Depth & Shading */}
                    <radialGradient id="head3D" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FFF3C4" />
                      <stop offset="60%" stopColor="#FDE68A" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </radialGradient>
                    <radialGradient id="helmet3D" cx="40%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#047857" />
                      <stop offset="100%" stopColor="#022c22" />
                    </radialGradient>
                    <radialGradient id="jersey3D" cx="40%" cy="35%" r="75%">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="65%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#044e39" />
                    </radialGradient>
                    <linearGradient id="bat3D" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="50%" stopColor="#D97706" />
                      <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                    <filter id="mascotShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.45" />
                    </filter>
                  </defs>

                  {/* 3D Walking Ground Shadow */}
                  <ellipse cx="100" cy="192" rx="44" ry="7" fill="#000000" opacity="0.35" />

                  {/* 3D Walking Pads & Feet */}
                  <g>
                    {/* Left Pad (Stepping forward in walk) */}
                    <rect x="73" y="162" width="20" height="28" rx="7" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="2.5" />
                    <rect x="76" y="184" width="14" height="6" rx="3" fill="#10B981" />
                    <line x1="73" y1="172" x2="93" y2="172" stroke="#D1D5DB" strokeWidth="2" />
                    <line x1="73" y1="180" x2="93" y2="180" stroke="#D1D5DB" strokeWidth="2" />

                    {/* Right Pad (Pushing back in walk) */}
                    <rect x="107" y="164" width="20" height="28" rx="7" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="2.5" />
                    <rect x="110" y="186" width="14" height="6" rx="3" fill="#10B981" />
                    <line x1="107" y1="174" x2="127" y2="174" stroke="#D1D5DB" strokeWidth="2" />
                    <line x1="107" y1="182" x2="127" y2="182" stroke="#D1D5DB" strokeWidth="2" />
                  </g>

                  {/* 3D Torso / Team Jersey */}
                  <ellipse cx="100" cy="148" rx="42" ry="32" fill="url(#jersey3D)" filter="url(#mascotShadow)" />
                  <path d="M 74 138 Q 100 158 126 138" stroke="#022c22" strokeWidth="4" fill="none" opacity="0.6" />
                  {/* Gold Star Medal */}
                  <circle cx="100" cy="146" r="9" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
                  <text x="100" y="150" fontSize="11" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">★</text>

                  {/* Left Arm waving Cricket Bat high */}
                  <path d="M 66 132 Q 38 112 30 84" stroke="#059669" strokeWidth="15" strokeLinecap="round" fill="none" />
                  {/* 3D Willow Bat */}
                  <g transform="translate(14, 46) rotate(-38)">
                    <rect x="0" y="0" width="15" height="46" rx="4" fill="url(#bat3D)" stroke="#78350F" strokeWidth="2" />
                    <rect x="4.5" y="46" width="6" height="20" rx="3" fill="#FDE68A" stroke="#B45309" strokeWidth="1.5" />
                    <ellipse cx="7.5" cy="68" rx="4" ry="2" fill="#78350F" />
                  </g>

                  {/* Right Arm cheering thumbs up / joy */}
                  <path d="M 134 132 Q 162 112 170 86" stroke="#059669" strokeWidth="15" strokeLinecap="round" fill="none" />
                  <circle cx="170" cy="84" r="10" fill="#F59E0B" />
                  {/* Thumbs up badge */}
                  <rect x="166" y="74" width="7" height="13" rx="3.5" fill="#F59E0B" />

                  {/* 3D Cheerful Head */}
                  <circle cx="100" cy="85" r="44" fill="url(#head3D)" filter="url(#mascotShadow)" />

                  {/* 3D Shiny Cricket Helmet */}
                  <path d="M 56 80 C 56 38 144 38 144 80 Z" fill="url(#helmet3D)" stroke="#065F46" strokeWidth="3" />
                  {/* 3D Visor rim */}
                  <path d="M 52 80 Q 100 68 148 80 L 144 87 Q 100 75 56 87 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
                  {/* Steel Face Grill */}
                  <path d="M 66 84 Q 100 96 134 84" stroke="#FFFFFF" strokeWidth="3.5" fill="none" opacity="0.9" />
                  <path d="M 72 91 Q 100 104 128 91" stroke="#FFFFFF" strokeWidth="3.5" fill="none" opacity="0.9" />
                  {/* Top Button */}
                  <circle cx="100" cy="48" r="6" fill="#F59E0B" />

                  {/* Big Sparkling Cheerful Eyes */}
                  <ellipse cx="84" cy="84" rx="6" ry="8" fill="#111827" />
                  <circle cx="82" cy="81" r="2.5" fill="#FFFFFF" />
                  <ellipse cx="116" cy="84" rx="6" ry="8" fill="#111827" />
                  <circle cx="114" cy="81" r="2.5" fill="#FFFFFF" />

                  {/* Rosy Cheerful 3D Cheeks */}
                  <circle cx="73" cy="94" r="8" fill="#F87171" opacity="0.65" />
                  <circle cx="127" cy="94" r="8" fill="#F87171" opacity="0.65" />

                  {/* Wide Happy Smile */}
                  <path d="M 85 96 Q 100 120 115 96 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2.5" />
                  <path d="M 89 98 Q 100 106 111 98" fill="#FFFFFF" />
                </svg>
              </div>
            </div>

            {/* Joyful Speech Bubble & Announcement Note */}
            <div className="space-y-3">
              {/* Mascot 3D Speech Bubble */}
              <div className="relative inline-block px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-cricket-dark font-display font-black text-2xl sm:text-3xl tracking-tight shadow-xl shadow-emerald-500/30 transform hover:scale-105 transition-transform animate-pulse">
                “WELCOME TO THE TEAM!”
                {/* Speech Bubble Arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-teal-400" />
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow">
                {playerName}
              </div>
              {role && (
                <div className="inline-block px-3 py-1 rounded-full bg-cricket-card text-xs font-bold text-cricket-teal border border-cricket-border">
                  {role}
                </div>
              )}
            </div>

            {/* Winning Bid & Franchise Breakdown Card */}
            <div className="p-4 rounded-2xl bg-cricket-dark/95 border border-emerald-500/40 flex items-center justify-around gap-2 text-sm shadow-xl">
              <div className="text-left">
                <span className="text-[11px] font-bold text-cricket-muted uppercase block">New Franchise</span>
                <span className="font-display font-black text-xl text-cricket-teal truncate max-w-[180px] block">
                  {teamName || 'Franchise'}
                </span>
              </div>
              <div className="h-8 w-px bg-cricket-border" />
              <div className="text-right">
                <span className="text-[11px] font-bold text-cricket-muted uppercase block">Winning Bid</span>
                <span className="font-display font-black text-2xl text-cricket-gold">
                  ₹{price?.toLocaleString('en-IN') || 500}
                </span>
              </div>
            </div>

            {/* Interactive Continue Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-cricket-dark font-display font-black text-base shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue Auction ({countdown}s)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* ============================================================= */
          /* CASE 2: UNSOLD (3D SAD MASCOT + BETTER LUCK NEXT TIME) */
          /* ============================================================= */
          <div className="space-y-6">
            {/* Top Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider shadow-lg">
              <HeartCrack className="w-4 h-4 text-amber-400" />
              <span>LOT PASSED • CURRENTLY UNSOLD</span>
            </div>

            {/* 3D Slumping Sad Mascot Character */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {/* Gloomy Rain Clouds Aura */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-700/25 to-slate-600/25 blur-3xl" />

              {/* Rain cloud icon above */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
                🌧️
              </div>
              <div className="absolute top-8 left-4 text-sm text-blue-400 animate-pulse">💧</div>
              <div className="absolute top-10 right-4 text-sm text-blue-400 animate-pulse" style={{ animationDelay: '300ms' }}>💧</div>

              {/* 3D Shaded Animated Sad Mascot: "Droopy the Batsman" */}
              <div className="animate-mascot-sad filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">
                <svg
                  viewBox="0 0 200 200"
                  className="w-48 h-48 cursor-pointer transition-transform hover:scale-105"
                >
                  <defs>
                    <radialGradient id="sadHead3D" cx="40%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FFF7ED" />
                      <stop offset="60%" stopColor="#FED7AA" />
                      <stop offset="100%" stopColor="#FB923C" />
                    </radialGradient>
                    <radialGradient id="sadHelmet3D" cx="40%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#4B5563" />
                      <stop offset="60%" stopColor="#1F2937" />
                      <stop offset="100%" stopColor="#111827" />
                    </radialGradient>
                    <radialGradient id="sadJersey3D" cx="40%" cy="35%" r="75%">
                      <stop offset="0%" stopColor="#64748B" />
                      <stop offset="65%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </radialGradient>
                  </defs>

                  {/* Ground Shadow */}
                  <ellipse cx="100" cy="192" rx="42" ry="7" fill="#000000" opacity="0.4" />

                  {/* Slumped Pads Resting on ground */}
                  <rect x="73" y="166" width="20" height="25" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2.5" />
                  <rect x="107" y="166" width="20" height="25" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2.5" />

                  {/* Slumped Body */}
                  <ellipse cx="100" cy="154" rx="40" ry="32" fill="url(#sadJersey3D)" />
                  <path d="M 80 148 Q 100 138 120 148" stroke="#1E293B" strokeWidth="4" fill="none" />

                  {/* Drooping arms holding bat resting sadly on the floor */}
                  <path d="M 70 142 Q 55 160 48 178" stroke="#334155" strokeWidth="13" strokeLinecap="round" fill="none" />
                  {/* Willow Bat standing face-down */}
                  <g transform="translate(36, 138) rotate(16)">
                    <rect x="0" y="0" width="13" height="42" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="2" />
                    <rect x="3.5" y="-14" width="6" height="15" rx="2" fill="#FDE68A" />
                  </g>

                  <path d="M 130 142 Q 142 160 148 176" stroke="#334155" strokeWidth="13" strokeLinecap="round" fill="none" />

                  {/* Tilted Sad Head */}
                  <g transform="rotate(5, 100, 92)">
                    <circle cx="100" cy="92" r="42" fill="url(#sadHead3D)" />

                    {/* Drooping Dark Helmet */}
                    <path d="M 58 88 C 58 48 142 48 142 88 Z" fill="url(#sadHelmet3D)" stroke="#111827" strokeWidth="3" />
                    <path d="M 54 88 Q 100 78 146 88 L 142 94 Q 100 84 58 94 Z" fill="#6B7280" />

                    {/* Big Cute Puppy-Dog Sad Eyes */}
                    <ellipse cx="83" cy="98" rx="7" ry="9" fill="#0F172A" />
                    <circle cx="81" cy="95" r="3" fill="#FFFFFF" />
                    <ellipse cx="117" cy="98" rx="7" ry="9" fill="#0F172A" />
                    <circle cx="115" cy="95" r="3" fill="#FFFFFF" />

                    {/* Tear Drop */}
                    <path d="M 125 104 Q 130 115 125 120 Q 120 115 125 104 Z" fill="#60A5FA" opacity="0.9" />

                    {/* Sad Wavy Mouth */}
                    <path d="M 86 116 Q 100 106 114 116" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Sad Speech Bubble & Announcement Note */}
            <div className="space-y-3">
              {/* Mascot 3D Speech Bubble */}
              <div className="relative inline-block px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-cricket-dark font-display font-black text-2xl sm:text-3xl tracking-tight shadow-xl shadow-amber-500/30 transform hover:scale-105 transition-transform">
                “BETTER LUCK NEXT TIME!”
                {/* Speech Bubble Arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-yellow-400" />
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {playerName}
              </div>
              <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                No bids placed in this round. {playerName} has been safely moved to the{' '}
                <strong className="text-amber-400">Unsold Player Pool</strong> and can be reintroduced by the organizer in the next round.
              </p>
            </div>

            {/* Interactive Next Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-cricket-dark font-display font-black text-base shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Next Player ({countdown}s)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
