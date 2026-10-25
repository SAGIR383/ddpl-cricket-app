'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Radio, RefreshCw, Share2, Download, Trophy, MapPin, Calendar, Clock, Flame, Tv } from 'lucide-react';
import { MatchLiveState } from '@/types/match.types';
import { calculateOversString } from '@/lib/matchEngine';

interface MatchHeroProps {
  state: MatchLiveState;
  syncStatus: 'connected' | 'syncing' | 'offline';
  lastSyncTime: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function MatchHero({
  state,
  syncStatus,
  lastSyncTime,
  onRefresh,
  isRefreshing = false,
}: MatchHeroProps) {
  const currentInnings = state.currentInnings === 1 ? state.innings1 : (state.innings2 || state.innings1);
  const isSecondInnings = state.currentInnings === 2 && !!state.innings2;

  // Run rates calculation
  const totalBalls = currentInnings.legalBalls;
  const currentRunRate = totalBalls > 0 ? ((currentInnings.totalRuns * 6) / totalBalls).toFixed(2) : '0.00';

  // 2nd innings chase calculations
  const target = state.targetRuns || 0;
  const neededRuns = Math.max(0, target - currentInnings.totalRuns);
  const maxBalls = state.rules.matchOvers * 6;
  const ballsRemaining = Math.max(0, maxBalls - currentInnings.legalBalls);
  const requiredRunRate = ballsRemaining > 0 ? ((neededRuns * 6) / ballsRemaining).toFixed(2) : '0.00';

  // Team names
  const teamAName = state.innings1.battingTeam;
  const teamAShort = state.innings1.battingTeamShort;
  const teamBName = state.innings1.bowlingTeam;
  const teamBShort = state.innings1.bowlingTeamShort;

  // Status styling
  const statusConfig = {
    live: {
      label: 'LIVE',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
      dotClass: 'bg-red-500 animate-pulse',
    },
    innings_break: {
      label: 'INNINGS BREAK',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotClass: 'bg-amber-400',
    },
    completed: {
      label: 'COMPLETED',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      dotClass: 'bg-emerald-400',
    },
    upcoming: {
      label: 'UPCOMING',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      dotClass: 'bg-blue-400',
    },
    abandoned: {
      label: 'ABANDONED',
      badgeClass: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
      dotClass: 'bg-gray-400',
    },
  }[state.status] || {
    label: state.status.toUpperCase(),
    badgeClass: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    dotClass: 'bg-gray-400',
  };

  const handleShare = () => {
    const text = `🏏 *${state.title}* (${state.tournament.toUpperCase()})\n*${currentInnings.battingTeam}: ${currentInnings.totalRuns}/${currentInnings.wickets}* (${calculateOversString(currentInnings.legalBalls)} ov)\nCRR: ${currentRunRate}${isSecondInnings ? ` | Target: ${target} (Need ${neededRuns} off ${ballsRemaining}b, RRR: ${requiredRunRate})` : ''}\n\nFollow live on CricPlus!`;

    if (navigator.share) {
      navigator.share({ title: state.title, text, url: window.location.href }).catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + window.location.href)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-[#0D1B2A] to-[#08111F] border border-[#D8AD55]/30 shadow-2xl relative">
      {/* Background Stadium Glow Accents */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-[#D8AD55]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP UTILITY ACTION BAR */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#08111F]/80 backdrop-blur-md border-b border-[#D8AD55]/15 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/matches"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-white/10 text-white/80 hover:text-white text-xs font-bold transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-[#D8AD55]" />
            <span className="hidden sm:inline">All Matches</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {/* Tournament & Match Badges */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#111D2D] text-[#F2D69A] border border-[#D8AD55]/30 text-[11px] font-black uppercase tracking-wider">
              {state.tournament.toUpperCase()} • M{state.matchNumber}
            </span>

            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border uppercase tracking-wider ${statusConfig.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Sync Indicator & Quick Actions */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              syncStatus === 'connected'
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : syncStatus === 'syncing'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-red-500/10 text-red-300 border-red-500/30'
            }`}
            title={`Realtime Broadcast Sync: ${syncStatus} (Last updated: ${lastSyncTime})`}
          >
            <Radio className={`w-3 h-3 ${syncStatus === 'connected' ? 'text-blue-400 animate-pulse' : ''}`} />
            <span className="hidden md:inline">Sync: {syncStatus}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-[#D8AD55]/20 text-[#8793A5] hover:text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh Match State"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D8AD55] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href={`/matches/${state.matchId}/overlay`}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all shadow-md shadow-purple-500/20 cursor-pointer"
            title="Open Transparent Live Stream Overlay for OBS / vMix"
          >
            <Tv className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">OBS Overlay</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            title="Share Live Scorecard"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-[#D8AD55]/20 text-[#8793A5] hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Print or Save PDF"
          >
            <Download className="w-3.5 h-3.5 text-[#D8AD55]" />
          </button>
        </div>
      </div>

      {/* 2. MAIN HERO BROADCAST BOARD */}
      <div className="p-5 sm:p-7 space-y-5 relative z-10">
        {/* Teams & Score Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Team A (Innings 1 Batting Team) */}
          <div className="lg:col-span-5 flex items-center justify-between lg:justify-start gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#08111F] to-[#111D2D] border-2 border-[#D8AD55]/40 flex items-center justify-center font-display font-black text-xl text-[#F2D69A] shadow-lg">
                {teamAShort.slice(0, 3)}
              </div>
              <div>
                <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
                  <span>{teamAName}</span>
                  {state.currentInnings === 1 && state.status === 'live' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </h2>
                <div className="text-xs text-[#8793A5] font-semibold flex items-center gap-2 mt-0.5">
                  <span>1st Innings</span>
                  {state.toss?.winner === teamAName && (
                    <span className="text-[#D8AD55] font-bold">• Toss Winner</span>
                  )}
                </div>
              </div>
            </div>

            {/* Innings 1 Score */}
            <div className="text-right lg:ml-auto">
              <div className="font-display font-black text-2xl sm:text-3xl text-white">
                {state.innings1.totalRuns}
                <span className="text-[#D8AD55]/70 font-light text-xl mx-0.5">/</span>
                {state.innings1.wickets}
              </div>
              <div className="text-xs text-[#8793A5] font-medium">
                {calculateOversString(state.innings1.legalBalls)} / {state.rules.matchOvers}.0 ov
              </div>
            </div>
          </div>

          {/* VS Divider Strip */}
          <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-1.5 py-1 border-y lg:border-y-0 lg:border-x border-[#D8AD55]/15">
            <span className="text-xs font-black text-[#D8AD55] uppercase tracking-widest px-3 py-1 rounded-full bg-[#08111F] border border-[#D8AD55]/30">
              VS
            </span>
            <div className="text-[11px] text-[#8793A5] font-semibold hidden lg:block">
              {state.stage}
            </div>
          </div>

          {/* Team B (Innings 2 Batting Team / Bowling Team) */}
          <div className="lg:col-span-5 flex items-center justify-between lg:justify-end gap-4">
            {/* Innings 2 Score */}
            <div className="text-left lg:text-right lg:order-1 order-2">
              {state.innings2 ? (
                <>
                  <div className="font-display font-black text-2xl sm:text-3xl text-[#F2D69A]">
                    {state.innings2.totalRuns}
                    <span className="text-[#D8AD55]/70 font-light text-xl mx-0.5">/</span>
                    {state.innings2.wickets}
                  </div>
                  <div className="text-xs text-[#8793A5] font-medium">
                    {calculateOversString(state.innings2.legalBalls)} / {state.rules.matchOvers}.0 ov
                  </div>
                </>
              ) : (
                <div className="text-xs font-bold text-[#8793A5] italic bg-[#08111F] px-3 py-1.5 rounded-xl border border-white/5">
                  Yet to Bat
                </div>
              )}
            </div>

            <div className="flex items-center gap-3.5 lg:order-2 order-1">
              <div className="lg:text-right">
                <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-tight flex items-center lg:justify-end gap-2">
                  <span>{teamBName}</span>
                  {state.currentInnings === 2 && state.status === 'live' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </h2>
                <div className="text-xs text-[#8793A5] font-semibold flex items-center lg:justify-end gap-2 mt-0.5">
                  <span>2nd Innings</span>
                  {state.toss?.winner === teamBName && (
                    <span className="text-[#D8AD55] font-bold">• Toss Winner</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#08111F] to-[#111D2D] border-2 border-[#D8AD55]/40 flex items-center justify-center font-display font-black text-xl text-[#F2D69A] shadow-lg">
                {teamBShort.slice(0, 3)}
              </div>
            </div>
          </div>
        </div>

        {/* 3. DYNAMIC CHASE BANNER OR MATCH RESULT */}
        {state.result ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#0D1B2A] to-emerald-950/70 border border-emerald-500/40 flex items-center justify-center gap-2.5 text-center shadow-lg">
            <Trophy className="w-5 h-5 text-[#D8AD55] animate-bounce" />
            <span className="font-display font-black text-sm sm:text-base text-white tracking-wide">
              {state.result}
            </span>
          </div>
        ) : isSecondInnings ? (
          <div className="p-3.5 rounded-2xl bg-[#08111F]/90 border border-[#D8AD55]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-[#8793A5]">Target:</span>
              <strong className="text-[#F2D69A] font-black text-sm">{target} Runs</strong>
              <span className="text-[#8793A5] hidden sm:inline">•</span>
              <span className="text-white font-bold hidden sm:inline">
                Need {neededRuns} runs off {ballsRemaining} balls
              </span>
            </div>
            <div className="flex items-center gap-4 ml-auto text-xs font-semibold">
              <span className="text-[#8793A5]">
                CRR: <strong className="text-white font-black">{currentRunRate}</strong>
              </span>
              <span className="text-[#8793A5]">
                RRR: <strong className="text-[#D8AD55] font-black">{requiredRunRate}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#08111F]/70 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8793A5]">
            <div className="flex items-center gap-2">
              <span>CRR: <strong className="text-[#D8AD55] font-black text-sm">{currentRunRate}</strong></span>
              <span>•</span>
              <span>Max: <strong className="text-white font-bold">{state.rules.matchOvers} Ov</strong></span>
              <span>•</span>
              <span>Max Bowler: <strong className="text-[#F2D69A] font-bold">{state.rules.maxBowlerOvers} Ov</strong></span>
            </div>
            {state.toss && (
              <div className="text-xs text-white/90 font-medium italic">
                {state.toss.text}
              </div>
            )}
          </div>
        )}

        {/* 4. VENUE & OFFICIALS METADATA BAR */}
        <div className="pt-2 border-t border-[#D8AD55]/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#8793A5]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>{state.venue}</span>
            </span>
            {state.matchDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>{state.matchDate}</span>
              </span>
            )}
            {state.matchTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>{state.matchTime}</span>
              </span>
            )}
          </div>
          <div>
            Scorer: <strong className="text-white">{state.officials?.scorerName || 'Official Scorer'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
