'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MatchLiveState, InningsData } from '@/types/match.types';
import { calculateOversString, calculateEconomyRate, calculateStrikeRate } from '@/lib/matchEngine';
import { Radio, Flame, Sparkles, Trophy, Award } from 'lucide-react';

export default function MatchBroadcastOverlayPage() {
  const params = useParams();
  const matchId = (params.id as string) || 'ddpl-m1';
  const supabase = createClient();

  const [matchState, setMatchState] = useState<MatchLiveState | null>(null);
  const [eventBanner, setEventBanner] = useState<{
    type: 'four' | 'six' | 'wicket' | 'fifty' | 'century' | 'dls' | 'result';
    title: string;
    subtitle?: string;
  } | null>(null);

  const prevBallsCountRef = useRef<number>(0);
  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch initial state
  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch(`/api/matches/${matchId}/state?refresh=true`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.state) {
            setMatchState(data.state);
            const inn = data.state.currentInnings === 1 ? data.state.innings1 : data.state.innings2;
            prevBallsCountRef.current = inn?.deliveries?.length || 0;
          }
        }
      } catch (err) {
        console.error('Failed to load match state for overlay:', err);
      }
    }

    fetchState();
  }, [matchId]);

  // Trigger temporary celebration banner
  const triggerBanner = (type: any, title: string, subtitle?: string) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setEventBanner({ type, title, subtitle });
    bannerTimerRef.current = setTimeout(() => {
      setEventBanner(null);
    }, 4500);
  };

  // 2. Realtime listener
  useEffect(() => {
    const channel = supabase.channel(`match-${matchId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'state_update' }, (payload) => {
        if (payload.payload?.state) {
          const newState: MatchLiveState = payload.payload.state;
          const currInn = newState.currentInnings === 1 ? newState.innings1 : newState.innings2;
          const newDeliveries = currInn?.deliveries || [];

          // Detect new ball events for broadcast graphics
          if (newDeliveries.length > prevBallsCountRef.current) {
            const lastBall = newDeliveries[newDeliveries.length - 1];
            if (lastBall) {
              if (lastBall.isSix) {
                triggerBanner('six', 'MAXIMUM! 6 RUNS', `${lastBall.strikerName} launches it into the crowd!`);
              } else if (lastBall.isFour) {
                triggerBanner('four', 'BOUNDARY! 4 RUNS', `Pierces the field with class!`);
              } else if (lastBall.isWicket) {
                triggerBanner('wicket', 'OUT! WICKET FALLS', lastBall.wicketDetails?.description || `${lastBall.strikerName} departs!`);
              }
            }
          }

          // Detect DLS revision
          if (newState.dlsRevision && !matchState?.dlsRevision) {
            triggerBanner('dls', 'TARGET REVISED (DLS)', `Target: ${newState.targetRuns} runs in ${newState.targetOvers} overs`);
          }

          // Detect Match Result
          if (newState.status === 'completed' && newState.result) {
            triggerBanner('result', 'MATCH RESULT', newState.result);
          }

          prevBallsCountRef.current = newDeliveries.length;
          setMatchState(newState);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [matchId, matchState]);

  if (!matchState) {
    return (
      <div className="w-full h-screen bg-transparent flex items-end justify-center pb-8">
        <div className="px-6 py-2.5 rounded-2xl bg-[#08111F]/90 border border-[#D8AD55]/40 text-[#F2D69A] text-xs font-bold font-display uppercase tracking-wider backdrop-blur-md animate-pulse">
          Connecting OBS Live Overlay #{matchId}...
        </div>
      </div>
    );
  }

  const currentInnings: InningsData =
    matchState.currentInnings === 1 ? matchState.innings1 : (matchState.innings2 || matchState.innings1);

  const striker = currentInnings.batters[currentInnings.strikerIndex] || currentInnings.batters[0];
  const nonStriker = currentInnings.batters[currentInnings.nonStrikerIndex] || currentInnings.batters[1];
  const bowler = currentInnings.bowlers[currentInnings.currentBowlerIndex] || currentInnings.bowlers[0];

  const oversLimit = matchState.targetOvers || matchState.rules.matchOvers || 10;
  const currentOverNumber = Math.floor(currentInnings.legalBalls / 6);
  const currentOverDeliveries = currentInnings.deliveries.filter((d) => d.over === currentOverNumber);

  const crr = currentInnings.legalBalls > 0
    ? ((currentInnings.totalRuns * 6) / currentInnings.legalBalls).toFixed(2)
    : '0.00';

  const isChasing = matchState.currentInnings === 2 && matchState.targetRuns;
  const runsNeeded = isChasing ? matchState.targetRuns! - currentInnings.totalRuns : 0;
  const ballsRemaining = isChasing ? Math.max(0, oversLimit * 6 - currentInnings.legalBalls) : 0;
  const rrr = isChasing && ballsRemaining > 0
    ? ((runsNeeded * 6) / ballsRemaining).toFixed(2)
    : '0.00';

  return (
    <div className="w-screen h-screen bg-transparent flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* TOP WATERMARK & LIVE BADGE */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#08111F]/85 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-display font-black text-xs uppercase tracking-wider text-white">
            {matchState.tournament?.toUpperCase() || 'CRICPLUS'} LIVE
          </span>
          <span className="text-[#8793A5] text-xs">• {matchState.stage}</span>
        </div>

        {matchState.dlsRevision && (
          <div className="px-4 py-2 rounded-2xl bg-cyan-950/85 backdrop-blur-md border border-cyan-400/50 shadow-2xl flex items-center gap-2 text-cyan-300 text-xs font-bold">
            <span>🌧️ DLS Target: {matchState.targetRuns} runs ({matchState.targetOvers} ov)</span>
          </div>
        )}
      </div>

      {/* CENTER EVENT BANNER POPUP */}
      {eventBanner && (
        <div className="self-center animate-bounce">
          <div
            className={`px-8 sm:px-12 py-4 rounded-3xl border-2 shadow-2xl backdrop-blur-xl text-center space-y-1 ${
              eventBanner.type === 'six'
                ? 'bg-gradient-to-r from-red-600/90 via-[#08111F]/95 to-red-600/90 border-red-500 shadow-red-500/40'
                : eventBanner.type === 'four'
                ? 'bg-gradient-to-r from-[#D8AD55]/90 via-[#08111F]/95 to-[#D8AD55]/90 border-[#D8AD55] shadow-[#D8AD55]/40 text-[#08111F]'
                : eventBanner.type === 'wicket'
                ? 'bg-gradient-to-r from-rose-700/90 via-[#08111F]/95 to-rose-700/90 border-rose-500 shadow-rose-500/40 text-white'
                : 'bg-gradient-to-r from-cyan-600/90 via-[#08111F]/95 to-blue-600/90 border-cyan-400 shadow-cyan-500/40 text-white'
            }`}
          >
            <div
              className={`font-display font-black text-2xl sm:text-4xl tracking-wider uppercase ${
                eventBanner.type === 'four' ? 'text-[#08111F]' : 'text-white'
              }`}
            >
              {eventBanner.title}
            </div>
            {eventBanner.subtitle && (
              <div
                className={`text-xs sm:text-sm font-bold ${
                  eventBanner.type === 'four' ? 'text-gray-900' : 'text-gray-200'
                }`}
              >
                {eventBanner.subtitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM BROADCAST LOWER-THIRD SCOREBUG */}
      <div className="w-full max-w-6xl mx-auto space-y-2">
        {/* UPPER ROW: ACTIVE BATTERS & CURRENT BOWLER STRIP */}
        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-white">
          {/* Batters Strip (7 cols) */}
          <div className="col-span-7 flex items-center justify-between px-5 py-2.5 rounded-2xl bg-[#08111F]/90 backdrop-blur-md border border-white/10 shadow-xl">
            {/* Striker */}
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#D8AD55] animate-pulse" />
              <span className="text-[#F2D69A] font-black truncate">{striker?.name}</span>
              <span className="text-white text-sm font-extrabold">{striker?.runs || 0}</span>
              <span className="text-gray-400 font-normal text-[11px]">({striker?.balls || 0}b)</span>
              <span className="text-gray-500 font-normal text-[10px]">
                {striker?.fours || 0}x4 {striker?.sixes || 0}x6
              </span>
            </div>

            {/* Non-Striker */}
            <div className="flex items-center gap-2 text-gray-300 truncate pl-3 border-l border-white/10">
              <span className="truncate">{nonStriker?.name}</span>
              <span className="text-white font-extrabold">{nonStriker?.runs || 0}</span>
              <span className="text-gray-400 font-normal text-[11px]">({nonStriker?.balls || 0}b)</span>
            </div>
          </div>

          {/* Bowler Strip (5 cols) */}
          <div className="col-span-5 flex items-center justify-between px-5 py-2.5 rounded-2xl bg-[#08111F]/90 backdrop-blur-md border border-white/10 shadow-xl">
            <div className="flex items-center gap-2 truncate">
              <span className="text-gray-400 uppercase text-[10px]">BOWLER</span>
              <span className="text-white font-black truncate">{bowler?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[#F2D69A] font-extrabold text-sm">
                {bowler?.wickets || 0}-{bowler?.runsConceded || 0}
              </span>
              <span className="text-gray-400 font-normal text-[11px] ml-1.5">
                ({bowler?.oversStr || '0.0'} ov)
              </span>
            </div>
          </div>
        </div>

        {/* LOWER MAIN ROW: TEAMS, SCORE, OVERS & CURRENT OVER BALLS */}
        <div className="grid grid-cols-12 rounded-3xl bg-gradient-to-r from-[#0D1B2A]/95 via-[#08111F]/95 to-[#0D1B2A]/95 backdrop-blur-xl border-2 border-[#D8AD55]/40 shadow-2xl overflow-hidden divide-x divide-white/10">
          {/* 1. Batting Team & Big Score (4 cols) */}
          <div className="col-span-4 p-4 flex items-center justify-between bg-[#08111F]/80">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#D8AD55]">
                {currentInnings.battingTeam}
              </div>
              <div className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                {currentInnings.totalRuns}
                <span className="text-[#D8AD55]">/{currentInnings.wickets}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-gray-400">OVERS</div>
              <div className="font-display font-black text-xl text-[#F2D69A]">
                {calculateOversString(currentInnings.legalBalls)}
                <span className="text-gray-400 text-xs font-normal"> / {oversLimit}</span>
              </div>
            </div>
          </div>

          {/* 2. Target / Run Rates / Equation (4 cols) */}
          <div className="col-span-4 p-4 flex flex-col justify-center">
            {isChasing ? (
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">
                  Need <strong className="text-[#F2D69A] text-sm">{runsNeeded}</strong> runs in{' '}
                  <strong className="text-cyan-400 text-sm">{ballsRemaining}</strong> balls
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>CRR: <strong className="text-white">{crr}</strong></span>
                  <span>RRR: <strong className="text-emerald-400">{rrr}</strong></span>
                  <span>Target: <strong className="text-white">{matchState.targetRuns}</strong></span>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">
                  1st Innings • Projected:{' '}
                  <strong className="text-[#F2D69A] text-sm">
                    {Math.round(parseFloat(crr) * oversLimit)}
                  </strong>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>CRR: <strong className="text-white">{crr}</strong></span>
                  <span>Bowling: <strong className="text-white">{currentInnings.bowlingTeamShort || currentInnings.bowlingTeam}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 3. This Over Balls Sequence (4 cols) */}
          <div className="col-span-4 p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                THIS OVER
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentOverDeliveries.length === 0 ? (
                  <span className="text-xs text-gray-500 italic">Over starting...</span>
                ) : (
                  currentOverDeliveries.map((d, i) => (
                    <span
                      key={d.id || i}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-display font-black text-xs shadow ${
                        d.isWicket
                          ? 'bg-red-600 text-white shadow-red-500/40 animate-pulse'
                          : d.isSix
                          ? 'bg-red-500 text-white'
                          : d.isFour
                          ? 'bg-[#D8AD55] text-[#08111F]'
                          : d.runsBat === 0 && d.isLegal
                          ? 'bg-white/10 text-gray-400'
                          : 'bg-blue-600/80 text-white'
                      }`}
                    >
                      {d.symbol}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-black uppercase text-[#D8AD55] bg-[#D8AD55]/10 px-2.5 py-1 rounded-lg border border-[#D8AD55]/30">
                CRICPLUS HD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
