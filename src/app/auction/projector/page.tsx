'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Gavel,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Trophy,
  Users,
  Sparkles,
  Flame,
  Clock,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createClient } from '@/lib/supabase/client';
import { auctionAudio } from '@/lib/auctionAudio';
import { fetchWithCache } from '@/lib/clientCache';

function AuctionProjectorContent() {
  const searchParams = useSearchParams();
  const activeTournament = (searchParams.get('tournament') || 'ddpl').toLowerCase();
  const supabase = createClient();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [tournamentConfig, setTournamentConfig] = useState<any>({
    name: activeTournament.toUpperCase(),
    currencySymbol: activeTournament === 'game-of-run' ? 'د.إ' : '₹',
  });

  const [currentLot, setCurrentLot] = useState<any | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [soldTransactions, setSoldTransactions] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<number>(30);
  const [auctionStatus, setAuctionStatus] = useState<'live' | 'paused' | 'stopped'>('live');
  const [lastSoldEvent, setLastSoldEvent] = useState<any | null>(null);

  const prevBidRef = useRef<number>(0);
  const prevCountdownRef = useRef<number>(30);

  // Initialize audio mute state
  useEffect(() => {
    setIsMuted(auctionAudio.isMuted());
  }, []);

  const toggleSound = () => {
    const next = auctionAudio.toggleMute();
    setIsMuted(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 1. Initial Load of Tournament & Auction State
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [regRes, auctionRes] = await Promise.all([
          fetchWithCache<any>(`/api/tournaments/register?tournament=${activeTournament}`, { ttlMs: 15000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${activeTournament}`, { ttlMs: 3000 }),
        ]);

        if (!isMounted) return;

        if (regRes?.config) {
          setTournamentConfig(regRes.config);
        }

        if (auctionRes?.data) {
          const d = auctionRes.data;
          setTeams(Array.isArray(d.teams) ? d.teams : []);
          setSoldTransactions(Array.isArray(d.soldTransactions) ? d.soldTransactions : []);
          if (d.auctionStatus) setAuctionStatus(d.auctionStatus);
          if (d.timerSeconds !== undefined) setCountdown(d.timerSeconds);
          if (d.currentLot) setCurrentLot(d.currentLot);
        }
      } catch (e) {
        console.error('Failed to load projector auction data:', e);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTournament]);

  // 2. Realtime Broadcast Synchronization & Audio Triggers
  useEffect(() => {
    const channelName = `auction-${activeTournament}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'auction_update' }, (payload) => {
        const data = payload.payload;
        if (!data) return;

        if (data.currentLot !== undefined) {
          // Play bid chime if bid increased
          if (data.currentLot && data.currentLot.currentBid > prevBidRef.current) {
            auctionAudio.playBidChime();
          }
          setCurrentLot(data.currentLot);
          if (data.currentLot) {
            prevBidRef.current = data.currentLot.currentBid;
          }
        }

        if (data.teams !== undefined) setTeams(data.teams);
        if (data.soldTransactions !== undefined) setSoldTransactions(data.soldTransactions);
        if (data.countdown !== undefined) {
          setCountdown(data.countdown);

          // Audio countdown beeps for final 5 seconds
          if (data.countdown <= 5 && data.countdown > 0 && data.countdown !== prevCountdownRef.current) {
            auctionAudio.playCountdownBeep(data.countdown === 1);
          }
          prevCountdownRef.current = data.countdown;
        }

        if (data.auctionStatus !== undefined) setAuctionStatus(data.auctionStatus);

        // Sold / Unsold sound effects
        if (data.mascotEvent) {
          if (data.mascotEvent.type === 'sold') {
            auctionAudio.playGavelStrike();
            confetti({
              particleCount: 120,
              spread: 90,
              origin: { y: 0.6 },
              colors: ['#D8AD55', '#F2D69A', '#10B981', '#ffffff'],
            });
            setLastSoldEvent(data.mascotEvent);
            setTimeout(() => setLastSoldEvent(null), 6000);
          } else if (data.mascotEvent.type === 'unsold') {
            auctionAudio.playUnsoldBuzzer();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTournament, supabase]);

  const currencySymbol = tournamentConfig.currencySymbol || '₹';

  return (
    <div className="min-h-screen bg-[#040814] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      
      {/* Background Lighting Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-[#D8AD55]/15 via-[#0E1F35]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP AUDITORIUM BROADCAST HEADER */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#D8AD55]/20 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/auction?tournament=${activeTournament}`}
            className="p-2.5 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-[#8793A5] hover:text-white transition-all cursor-pointer"
            title="Exit Big Screen Mode"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span>{auctionStatus === 'live' ? 'AUDITORIUM BROADCAST' : 'AUCTION PAUSED'}</span>
              </span>
              <span className="text-xs text-[#D8AD55] font-bold uppercase tracking-widest hidden sm:inline">
                • {tournamentConfig.name}
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-0.5">
              Grand Player Auction Arena
            </h1>
          </div>
        </div>

        {/* Presenter Controls (Sound & Fullscreen) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSound}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-[#08111F] border-[#D8AD55]/30 text-[#F2D69A] hover:bg-[#111D2D]'
            }`}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-[#F2D69A] hover:bg-[#111D2D] transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* CENTER STAGE: CURRENT LOT & LIVE BID ARENA */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-4">
        
        {/* Left: Player Presentation Card (Cols 1-5) */}
        <div className="lg:col-span-5 rounded-3xl bg-gradient-to-b from-[#0D1B2A] to-[#08111F] border-2 border-[#D8AD55]/40 p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-[#D8AD55]/20 pb-4">
            <span className="px-3.5 py-1 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/40 text-[#F2D69A] font-display font-bold text-xs uppercase tracking-wider">
              {currentLot?.role || 'All-Rounder'}
            </span>
            <span className="text-xs font-mono text-[#8793A5]">
              Base Price: <b className="text-white">{currencySymbol}{(currentLot?.basePrice || 500).toLocaleString()}</b>
            </span>
          </div>

          {/* Player Graphic Avatar */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden bg-gradient-to-tr from-[#08111F] via-[#111D2D] to-[#1A2D44] border-2 border-[#D8AD55]/50 shadow-2xl flex items-center justify-center p-2">
            {currentLot?.avatarUrl ? (
              <Image
                src={currentLot.avatarUrl}
                alt={currentLot.name}
                fill
                className="object-cover object-top"
              />
            ) : (
              <div className="text-center space-y-2">
                <Users className="w-20 h-20 text-[#D8AD55]/70 mx-auto" />
                <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-widest block">
                  CricPlus Pro
                </span>
              </div>
            )}
          </div>

          {/* Player Identity */}
          <div className="text-center space-y-1.5">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
              {currentLot?.name || 'Waiting for Lot…'}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs text-[#8793A5]">
              <span>Bat: <b className="text-white">{currentLot?.battingStyle || 'Right-hand bat'}</b></span>
              <span>•</span>
              <span>Bowl: <b className="text-white">{currentLot?.bowlingStyle || 'Right-arm medium'}</b></span>
            </div>
          </div>
        </div>

        {/* Right: Live Bidding Battle Arena & Countdown (Cols 6-12) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Top Live Highest Bid Display */}
          <div className="rounded-3xl bg-gradient-to-r from-[#0D1B2A] via-[#14253A] to-[#0D1B2A] border-2 border-[#D8AD55]/50 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8793A5] uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Current Highest Bid</span>
              </span>

              {/* 30-Second Countdown Radial */}
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono font-black text-lg ${
                countdown <= 5
                  ? 'bg-rose-500/25 border-rose-500 text-rose-300 animate-pulse'
                  : countdown <= 10
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}>
                <Clock className="w-5 h-5" />
                <span>{countdown}s</span>
              </div>
            </div>

            {/* Giant Currency & Price Amount */}
            <div className="my-6">
              <div className="font-display font-black text-6xl sm:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-[#D8AD55] via-[#FFF] to-[#F2D69A] tracking-tight drop-shadow-[0_0_35px_rgba(216,173,85,0.4)]">
                {currencySymbol}{(currentLot?.currentBid || currentLot?.basePrice || 500).toLocaleString()}
              </div>
            </div>

            {/* Leading Franchise Card */}
            <div className="pt-4 border-t border-[#D8AD55]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#8793A5] font-bold uppercase tracking-wider block">
                  Leading Franchise:
                </span>
                <span className="font-display font-black text-2xl sm:text-3xl text-emerald-400 tracking-wide">
                  {currentLot?.leadingTeam || 'No Bids Yet (Opening at Base)'}
                </span>
              </div>

              {currentLot?.leadingTeam && (
                <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>In Front</span>
                </div>
              )}
            </div>
          </div>

          {/* Live Bid History Stream Ticker */}
          <div className="rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 p-4 sm:p-5 shadow-xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8793A5] block">
              Live Bidding War Stream:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {currentLot?.history && currentLot.history.length > 0 ? (
                currentLot.history.slice(-4).reverse().map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 shrink-0 space-y-0.5"
                  >
                    <div className="font-bold text-white truncate">{h.team}</div>
                    <div className="font-mono text-[#F2D69A] font-bold">
                      {currencySymbol}{h.bid.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-xs text-[#8793A5] italic py-2">
                  Waiting for franchise owners to place first bid…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FRANCHISE PURSE WALL (All Teams Live Budgets) */}
      <div className="relative z-10 border-t border-[#D8AD55]/20 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Franchise Purse &amp; Squad Wall ({teams.length} Teams)</span>
          </span>
          <span className="text-[11px] text-[#F2D69A] font-mono">
            Recently Sold: {soldTransactions.length} Players
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {teams.map((t) => {
            const isLeading = currentLot?.leadingTeam === t.name;
            const remaining = (t.allocated || 10000) - (t.spent || 0);
            return (
              <div
                key={t.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isLeading
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-[#08111F] border-[#D8AD55]/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white truncate">{t.short || t.name}</span>
                  <span className="text-[10px] text-[#8793A5] font-mono">{t.playersBought || 1}/11</span>
                </div>
                <div className="font-display font-black text-sm text-[#F2D69A] mt-1">
                  {currencySymbol}{remaining.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SOLD CELEBRATION OVERLAY */}
      {lastSoldEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-none">
          <div className="rounded-3xl bg-gradient-to-b from-[#0D1B2A] to-[#08111F] border-2 border-[#D8AD55] p-8 sm:p-12 text-center space-y-4 shadow-2xl max-w-lg">
            <div className="text-5xl">🔨</div>
            <div className="font-display font-black text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#D8AD55] via-[#FFF] to-[#F2D69A] tracking-wider uppercase drop-shadow">
              SOLD!
            </div>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              {lastSoldEvent.player}
            </h3>
            <p className="text-lg text-emerald-400 font-bold">
              Bought by {lastSoldEvent.team} for {currencySymbol}{(lastSoldEvent.price || 0).toLocaleString()}!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuctionProjectorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center text-[#D8AD55]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-[#D8AD55]/20 border-t-[#D8AD55] animate-spin" />
            <span className="text-sm font-bold tracking-wider uppercase font-display">Loading Auditorium Display...</span>
          </div>
        </div>
      }
    >
      <AuctionProjectorContent />
    </Suspense>
  );
}
