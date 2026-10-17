'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  RotateCcw,
  AlertOctagon,
  Shield,
  Radio,
  ExternalLink,
  Flame,
  Award,
  Layers,
  Info as InfoIcon,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MatchLiveState, InningsData } from '@/types/match.types';
import {
  calculateOversString,
  calculateEconomyRate,
  calculateStrikeRate,
  RecordBallParams,
} from '@/lib/matchEngine';
import { MatchHero } from '@/components/match/MatchHero';
import { SegmentedTabs, MatchCentreTab } from '@/components/match/SegmentedTabs';

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = (params.id as string) || 'ddpl-m1';
  const { isScorer, role, user } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  // Persistent Live State from API
  const [matchState, setMatchState] = useState<MatchLiveState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Segmented Tab Navigation State
  const [activeTab, setActiveTab] = useState<MatchCentreTab>('live');

  // Realtime Sync Status
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Wicket Modal State
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState('caught');
  const [outBatter, setOutBatter] = useState<'striker' | 'nonStriker'>('striker');
  const [newBatterName, setNewBatterName] = useState('');

  // 1. Fetch Live State from Backend
  const loadMatchState = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/state?refresh=${showRefreshSpinner}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.state) {
          setMatchState(json.state);
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      }
    } catch (e) {
      console.error('Failed to load match state:', e);
    } finally {
      setLoading(false);
      if (showRefreshSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatchState();
  }, [matchId]);

  // 2. Setup Supabase Realtime Broadcast Channel
  useEffect(() => {
    const channelName = `match-${matchId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'state_update' }, (payload) => {
        if (payload.payload?.state) {
          setMatchState(payload.payload.state);
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setSyncStatus('offline');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Broadcast state to all spectators in realtime
  const broadcastUpdatedState = (updatedState: MatchLiveState) => {
    if (channelRef.current) {
      setSyncStatus('syncing');
      channelRef.current
        .send({
          type: 'broadcast',
          event: 'state_update',
          payload: { state: updatedState },
        })
        .then(() => {
          setSyncStatus('connected');
          setLastSyncTime(new Date().toLocaleTimeString());
        })
        .catch(() => {
          setSyncStatus('connected');
        });
    }
  };

  // 3. Official Scorer Actions
  const handleRecordBall = async (runsBat: number, extraType: any = 'none') => {
    if (!isScorer) return;
    setSyncStatus('syncing');

    const ballParams: RecordBallParams = {
      runsBat,
      extraType,
    };

    try {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_ball',
          ball: ballParams,
          userEmail: user?.email,
          userRole: role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          setMatchState(data.state);
          broadcastUpdatedState(data.state);
        }
      }
    } catch (e) {
      console.error('Error recording ball:', e);
    } finally {
      setSyncStatus('connected');
    }
  };

  const handleConfirmWicket = async () => {
    if (!isScorer || !currentInnings) return;
    setSyncStatus('syncing');

    const dismissedBatter =
      outBatter === 'striker'
        ? currentInnings.batters[currentInnings.strikerIndex]
        : currentInnings.batters[currentInnings.nonStrikerIndex];

    const currentBowler = currentInnings.bowlers[currentInnings.currentBowlerIndex] || currentInnings.bowlers[0];

    const ballParams: RecordBallParams = {
      runsBat: 0,
      extraType: 'none',
      isWicket: true,
      wicketDetails: {
        type: wicketType as any,
        playerOut: dismissedBatter?.name || 'Batter',
        bowlerCredited: wicketType !== 'run_out',
        description: `${wicketType} b ${currentBowler.name}`,
      },
      newBatterName: newBatterName.trim() || undefined,
    };

    try {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_ball',
          ball: ballParams,
          userEmail: user?.email,
          userRole: role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          setMatchState(data.state);
          broadcastUpdatedState(data.state);
        }
      }
    } catch (e) {
      console.error('Error recording wicket:', e);
    } finally {
      setWicketModalOpen(false);
      setNewBatterName('');
      setSyncStatus('connected');
    }
  };

  const handleUndoBall = async () => {
    if (!isScorer) return;
    setSyncStatus('syncing');

    try {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'undo_ball',
          userEmail: user?.email,
          userRole: role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          setMatchState(data.state);
          broadcastUpdatedState(data.state);
        }
      }
    } catch (e) {
      console.error('Error undoing ball:', e);
    } finally {
      setSyncStatus('connected');
    }
  };

  if (loading || !matchState) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#D8AD55]/20 border-t-[#D8AD55] animate-spin" />
        <div className="text-[#8793A5] font-semibold text-sm">
          Connecting to Match Centre #{matchId}…
        </div>
      </div>
    );
  }

  const currentInnings: InningsData =
    matchState.currentInnings === 1 ? matchState.innings1 : (matchState.innings2 || matchState.innings1);

  const striker = currentInnings.batters[currentInnings.strikerIndex] || currentInnings.batters[0];
  const nonStriker = currentInnings.batters[currentInnings.nonStrikerIndex] || currentInnings.batters[1];
  const bowler = currentInnings.bowlers[currentInnings.currentBowlerIndex] || currentInnings.bowlers[0];

  // Current over delivery symbols
  const currentOverIndex = Math.floor(currentInnings.legalBalls / 6);
  const currentOverDeliveries = currentInnings.deliveries.filter((d) => d.over === currentOverIndex);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
      {/* 1. MATCH HERO HEADER */}
      <MatchHero
        state={matchState}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        onRefresh={() => loadMatchState(true)}
        isRefreshing={isRefreshing}
      />

      {/* 2. SEGMENTED NAVIGATION TABS */}
      <SegmentedTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isLive={matchState.status === 'live'}
      />

      {/* 3. TAB CONTENT */}

      {/* A. LIVE TAB */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Active Pitch Crease & Bowler Spell */}
          <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
              <span className="text-xs font-bold text-[#D8AD55] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Pitch Crease</span>
              </span>
              <span className="text-xs text-[#8793A5]">
                CRR: <strong className="text-[#F2D69A]">{currentInnings.legalBalls > 0 ? ((currentInnings.totalRuns * 6) / currentInnings.legalBalls).toFixed(2) : '0.00'}</strong>
              </span>
            </div>

            <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#08111F]/60">
              {/* Batters */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Batters at the Crease
                </div>

                <div className="space-y-2.5">
                  {/* Striker */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#111D2D] border border-[#D8AD55]/50 shadow-lg shadow-[#D8AD55]/5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#D8AD55] font-black text-base animate-pulse">★</span>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{striker?.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/30 uppercase">
                            Strike
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8793A5] mt-0.5">
                          SR: <strong className="text-[#F2D69A]">{striker?.strikeRate || 0}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-2xl text-[#F2D69A]">
                        {striker?.runs || 0}
                      </div>
                      <div className="text-xs text-[#8793A5]">
                        ({striker?.balls || 0}b, {striker?.fours || 0}x4, {striker?.sixes || 0}x6)
                      </div>
                    </div>
                  </div>

                  {/* Non-Striker */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D1B2A]/70 border border-[#D8AD55]/15">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#8793A5] text-base">•</span>
                      <div>
                        <div className="font-semibold text-gray-200 text-sm">{nonStriker?.name}</div>
                        <div className="text-[11px] text-[#8793A5] mt-0.5">
                          SR: <strong>{nonStriker?.strikeRate || 0}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-xl text-gray-200">
                        {nonStriker?.runs || 0}
                      </div>
                      <div className="text-xs text-[#8793A5]">
                        ({nonStriker?.balls || 0}b, {nonStriker?.fours || 0}x4)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Bowler Spell */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Current Bowler Spell
                </div>

                <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{bowler?.name}</div>
                    <div className="text-xs text-[#8793A5] mt-0.5">
                      Econ: <strong className="text-white">{bowler?.economy || '0.00'}</strong> • Dots: <strong className="text-[#F2D69A]">{bowler?.dots || 0}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-2xl text-[#F2D69A]">
                      {bowler?.wickets || 0} <span className="text-[#D8AD55]/60 text-lg">/</span> {bowler?.runsConceded || 0}
                    </div>
                    <div className="text-xs text-[#8793A5]">
                      {bowler?.oversStr || '0.0'} ov (M: {bowler?.maidens || 0})
                    </div>
                  </div>
                </div>

                {/* Over Deliveries Ball Pills */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-[#8793A5] flex items-center justify-between">
                    <span>This Over ({currentOverIndex + 1}):</span>
                    <span className="text-[11px] text-[#D8AD55] font-bold">
                      {currentOverDeliveries.length} ball(s) bowled
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap min-h-[36px]">
                    {currentOverDeliveries.length === 0 ? (
                      <span className="text-xs text-[#8793A5] italic">Ready for over delivery…</span>
                    ) : (
                      currentOverDeliveries.map((del, idx) => {
                        const isWicket = del.isWicket;
                        const isBoundary = del.isBoundary;
                        return (
                          <span
                            key={idx}
                            title={`${del.ballDisplay}: ${del.commentary}`}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-xs shadow-md transition-transform hover:scale-110 cursor-help ${
                              isWicket
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/30'
                                : isBoundary
                                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-[#D8AD55]/30'
                                : del.extraType !== 'none'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-[#08111F] text-[#F7F5F0] border border-[#D8AD55]/30'
                            }`}
                          >
                            {del.symbol}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Action Strip */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <Link
              href={`/tournaments/${matchState.tournament}`}
              className="p-3.5 rounded-2xl bg-[#0D1B2A]/90 hover:bg-[#111D2D] border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-md group cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#D8AD55] group-hover:scale-110 transition-transform" />
              <span>Points Table</span>
            </Link>

            <Link
              href="/leaderboard"
              className="p-3.5 rounded-2xl bg-[#0D1B2A]/90 hover:bg-[#111D2D] border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-md group cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-[#D8AD55] group-hover:scale-110 transition-transform" />
              <span>Leaderboard</span>
            </Link>

            <button
              onClick={() => setActiveTab('overs')}
              className="p-3.5 rounded-2xl bg-[#0D1B2A]/90 hover:bg-[#111D2D] border border-[#D8AD55]/20 hover:border-[#D8AD55]/50 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-md group cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#D8AD55] group-hover:scale-110 transition-transform" />
              <span>Overs Feed</span>
            </button>
          </div>

          {/* Ball-by-Ball Live Commentary Stream */}
          <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#F2D69A] flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Live Ball-by-Ball Commentary Stream</span>
              </span>
              <span className="text-xs text-[#8793A5]">
                {currentInnings.deliveries.length} balls bowled
              </span>
            </div>

            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {currentInnings.deliveries.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8793A5] italic">
                  Awaiting first delivery of the match…
                </div>
              ) : (
                [...currentInnings.deliveries].reverse().map((del) => (
                  <div
                    key={del.id}
                    className={`p-4 flex items-start gap-3.5 hover:bg-[#111D2D]/60 transition-colors ${
                      del.isWicket ? 'bg-red-500/5' : del.isBoundary ? 'bg-[#D8AD55]/5' : ''
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-display font-black text-xs ${
                        del.isWicket
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/30'
                          : del.isBoundary
                          ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F]'
                          : del.extraType !== 'none'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-[#08111F] text-gray-300 border border-white/10'
                      }`}
                    >
                      {del.symbol}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-black text-white">{del.ballDisplay}</span>
                        <span className="text-[#8793A5]">
                          {del.bowlerName} to {del.strikerName}
                        </span>
                        {del.isWicket && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40 uppercase">
                            WICKET
                          </span>
                        )}
                        {del.isFour && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 uppercase">
                            FOUR
                          </span>
                        )}
                        {del.isSix && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                            SIX
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {del.commentary}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* B. SCORECARD TAB */}
      {activeTab === 'scorecard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-2xl text-white">
              Full Match Scorecard
            </h2>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-bold hover:bg-[#111D2D] transition-all cursor-pointer"
            >
              Export PDF
            </button>
          </div>

          {/* Innings 1 Scorecard */}
          <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#F2D69A]">
                1st Innings — {matchState.innings1.battingTeam}
              </span>
              <span className="font-display font-black text-base text-white">
                {matchState.innings1.totalRuns}/{matchState.innings1.wickets}{' '}
                <span className="text-xs text-[#8793A5] font-normal">
                  ({calculateOversString(matchState.innings1.legalBalls)} ov)
                </span>
              </span>
            </div>

            {/* Batters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-nums">
                <thead className="bg-[#08111F]/90 text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                  <tr>
                    <th className="px-5 py-3.5">Batter</th>
                    <th className="px-5 py-3.5">Dismissal</th>
                    <th className="px-4 py-3.5 text-right">R</th>
                    <th className="px-4 py-3.5 text-right">B</th>
                    <th className="px-4 py-3.5 text-right">4s</th>
                    <th className="px-4 py-3.5 text-right">6s</th>
                    <th className="px-5 py-3.5 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {matchState.innings1.batters.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-[#111D2D]/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                        <span>{b.name}</span>
                        {!b.isOut && idx === matchState.innings1.strikerIndex && (
                          <span className="text-[#D8AD55] text-xs font-black">★</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#8793A5]">
                        {b.isOut ? b.dismissal : <span className="text-emerald-400 font-bold">Not Out</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-display font-black text-base text-white">{b.runs}</td>
                      <td className="px-4 py-3.5 text-right text-gray-400">{b.balls}</td>
                      <td className="px-4 py-3.5 text-right text-gray-400">{b.fours}</td>
                      <td className="px-4 py-3.5 text-right text-gray-400">{b.sixes}</td>
                      <td className="px-5 py-3.5 text-right text-[#F2D69A] font-bold">
                        {calculateStrikeRate(b.runs, b.balls)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Extras Strip */}
            <div className="p-4 bg-[#08111F]/80 border-t border-[#D8AD55]/15 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8793A5]">
              <span>
                Extras: <strong className="text-white">{matchState.innings1.extras.total}</strong> (w {matchState.innings1.extras.wide}, nb {matchState.innings1.extras.noBall}, b {matchState.innings1.extras.bye}, lb {matchState.innings1.extras.legBye})
              </span>
              <span>
                Total: <strong className="text-[#F2D69A] font-black text-sm">{matchState.innings1.totalRuns}/{matchState.innings1.wickets}</strong> ({calculateOversString(matchState.innings1.legalBalls)} ov)
              </span>
            </div>

            {/* Fall of Wickets Timeline */}
            {matchState.innings1.fallOfWickets.length > 0 && (
              <div className="p-4 bg-[#08111F]/50 border-t border-white/5 space-y-2">
                <span className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Fall of Wickets:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {matchState.innings1.fallOfWickets.map((fow) => (
                    <span
                      key={fow.wicketNumber}
                      className="px-2.5 py-1 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/20 text-gray-300"
                    >
                      <strong className="text-[#F2D69A]">{fow.score}-{fow.wicketNumber}</strong> ({fow.batterName}, {fow.overStr} ov)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bowlers Table */}
            <div className="border-t border-[#D8AD55]/15">
              <div className="p-3 bg-[#08111F]/70 text-xs font-bold text-[#8793A5] uppercase tracking-wider px-5">
                Bowling — {matchState.innings1.bowlingTeam}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm table-nums">
                  <thead className="bg-[#08111F]/90 text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="px-5 py-3">Bowler</th>
                      <th className="px-4 py-3 text-right">O</th>
                      <th className="px-4 py-3 text-right">M</th>
                      <th className="px-4 py-3 text-right">R</th>
                      <th className="px-4 py-3 text-right">W</th>
                      <th className="px-4 py-3 text-right">0s</th>
                      <th className="px-5 py-3 text-right">Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {matchState.innings1.bowlers.map((bw) => (
                      <tr key={bw.id} className="hover:bg-[#111D2D]/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white">{bw.name}</td>
                        <td className="px-4 py-3.5 text-right text-gray-300">{bw.oversStr}</td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{bw.maidens}</td>
                        <td className="px-4 py-3.5 text-right font-display font-bold text-white">{bw.runsConceded}</td>
                        <td className="px-4 py-3.5 text-right font-display font-black text-[#F2D69A]">{bw.wickets}</td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{bw.dots}</td>
                        <td className="px-5 py-3.5 text-right text-[#D8AD55] font-bold">{bw.economy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Innings 2 Scorecard (if available) */}
          {matchState.innings2 ? (
            <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#F2D69A]">
                  2nd Innings — {matchState.innings2.battingTeam} (Target: {matchState.targetRuns})
                </span>
                <span className="font-display font-black text-base text-white">
                  {matchState.innings2.totalRuns}/{matchState.innings2.wickets}{' '}
                  <span className="text-xs text-[#8793A5] font-normal">
                    ({calculateOversString(matchState.innings2.legalBalls)} ov)
                  </span>
                </span>
              </div>

              {/* Batters */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm table-nums">
                  <thead className="bg-[#08111F]/90 text-xs font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
                    <tr>
                      <th className="px-5 py-3.5">Batter</th>
                      <th className="px-5 py-3.5">Dismissal</th>
                      <th className="px-4 py-3.5 text-right">R</th>
                      <th className="px-4 py-3.5 text-right">B</th>
                      <th className="px-4 py-3.5 text-right">4s</th>
                      <th className="px-4 py-3.5 text-right">6s</th>
                      <th className="px-5 py-3.5 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {matchState.innings2.batters.map((b, idx) => (
                      <tr key={b.id || idx} className="hover:bg-[#111D2D]/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                          <span>{b.name}</span>
                          {!b.isOut && idx === matchState.innings2?.strikerIndex && (
                            <span className="text-[#D8AD55] text-xs font-black">★</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#8793A5]">
                          {b.isOut ? b.dismissal : <span className="text-emerald-400 font-bold">Not Out</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right font-display font-black text-base text-white">{b.runs}</td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{b.balls}</td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{b.fours}</td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{b.sixes}</td>
                        <td className="px-5 py-3.5 text-right text-[#F2D69A] font-bold">
                          {calculateStrikeRate(b.runs, b.balls)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Extras */}
              <div className="p-4 bg-[#08111F]/80 border-t border-[#D8AD55]/15 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8793A5]">
                <span>
                  Extras: <strong className="text-white">{matchState.innings2.extras.total}</strong> (w {matchState.innings2.extras.wide}, nb {matchState.innings2.extras.noBall}, b {matchState.innings2.extras.bye}, lb {matchState.innings2.extras.legBye})
                </span>
                <span>
                  Total: <strong className="text-[#F2D69A] font-black text-sm">{matchState.innings2.totalRuns}/{matchState.innings2.wickets}</strong> ({calculateOversString(matchState.innings2.legalBalls)} ov)
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#0D1B2A]/60 border border-[#D8AD55]/15 text-center text-xs text-[#8793A5] italic">
              2nd Innings has not yet commenced.
            </div>
          )}
        </div>
      )}

      {/* C. OVERS TAB (Preview shell for Phase 4) */}
      {activeTab === 'overs' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#0D1B2A]/90 border border-[#D8AD55]/25 text-center space-y-3">
            <Layers className="w-8 h-8 text-[#D8AD55] mx-auto" />
            <h3 className="font-display font-black text-xl text-white">
              Over-by-Over Timeline
            </h3>
            <p className="text-xs text-[#8793A5] max-w-md mx-auto">
              Inspect deliveries grouped by over cards with team selector and filters. Complete over cards implementation ready in Phase 4.
            </p>
          </div>
        </div>
      )}

      {/* D. INFO TAB (Preview shell for Phase 6) */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 border border-[#D8AD55]/25 p-6 space-y-4">
            <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
              <InfoIcon className="w-5 h-5 text-[#D8AD55]" />
              <span>Match Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5] font-semibold">Tournament & Stage</span>
                <div className="text-white font-bold">{matchState.tournament.toUpperCase()} • {matchState.stage}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5] font-semibold">Venue</span>
                <div className="text-white font-bold">{matchState.venue}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5] font-semibold">Match Overs Limit</span>
                <div className="text-white font-bold">{matchState.rules.matchOvers} Overs (Max {matchState.rules.maxBowlerOvers} per bowler)</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
                <span className="text-[#8793A5] font-semibold">Official Match Scorer</span>
                <div className="text-white font-bold">{matchState.officials?.scorerName}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E. SQUADS TAB (Preview shell for Phase 6) */}
      {activeTab === 'squads' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#0D1B2A]/90 border border-[#D8AD55]/25 text-center space-y-3">
            <Users className="w-8 h-8 text-[#D8AD55] mx-auto" />
            <h3 className="font-display font-black text-xl text-white">
              Playing XI & Team Squads
            </h3>
            <p className="text-xs text-[#8793A5] max-w-md mx-auto">
              Side-by-side roster comparison with player photos, captains, and wicketkeepers. Complete dual squad view ready in Phase 6.
            </p>
          </div>
        </div>
      )}

      {/* 4. SCORER DIAL KEYPAD VS SPECTATOR MODE */}
      {isScorer ? (
        <div className="rounded-3xl p-6 sm:p-8 space-y-6 bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-4">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#D8AD55]" />
              <span className="font-display font-bold text-xl text-white">
                Official Scorer Console
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/30 uppercase">
                Authorized Ref
              </span>
            </div>
            <button
              onClick={handleUndoBall}
              disabled={currentInnings.deliveries.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-red-500/30 text-red-400 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Ball</span>
            </button>
          </div>

          {/* Primary Runs Row */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <button
                key={run}
                onClick={() => handleRecordBall(run)}
                className={`py-4 sm:py-5 rounded-2xl font-display font-black text-2xl sm:text-3xl transition-all active:scale-95 shadow cursor-pointer ${
                  run === 4 || run === 6
                    ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] hover:brightness-110 shadow-lg shadow-[#D8AD55]/20'
                    : 'bg-[#08111F] hover:bg-[#111D2D] hover:border-[#D8AD55]/60 border border-[#D8AD55]/20 text-white'
                }`}
              >
                {run}
              </button>
            ))}
          </div>

          {/* Extras & Wicket Action Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 pt-2">
            <button
              onClick={() => handleRecordBall(0, 'wide')}
              className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-blue-500/40 text-blue-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Wide (+1)
            </button>
            <button
              onClick={() => handleRecordBall(0, 'noBall')}
              className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-amber-500/40 text-amber-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              No Ball (+1)
            </button>
            <button
              onClick={() => handleRecordBall(1, 'bye')}
              className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/20 text-[#8793A5] hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Bye (1)
            </button>
            <button
              onClick={() => handleRecordBall(1, 'legBye')}
              className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/20 text-[#8793A5] hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Leg Bye (1)
            </button>
            <button
              onClick={() => setWicketModalOpen(true)}
              className="py-3.5 sm:col-span-1 col-span-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
            >
              WICKET (OUT)
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl p-6 sm:p-8 bg-[#0D1B2A]/80 backdrop-blur-md border border-[#D8AD55]/20 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold border border-blue-500/30">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Spectator View • Realtime Connected</span>
          </div>
          <h3 className="font-display font-black text-2xl text-white">
            Live Spectator Broadcast Feed
          </h3>
          <p className="text-xs text-[#8793A5] max-w-md mx-auto leading-relaxed">
            You are watching this match in live spectator mode. Every delivery scored by the match referee synchronizes automatically with zero refresh.
          </p>
        </div>
      )}

      {/* Dismissal Modal */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border border-red-500/40 shadow-2xl space-y-5">
            <h3 className="font-display font-black text-2xl text-white flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-red-500" />
              <span>Record Dismissal</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Who is Out?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutBatter('striker')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      outBatter === 'striker'
                        ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-500/20'
                        : 'bg-[#08111F] border-[#D8AD55]/20 text-[#8793A5] hover:text-white'
                    }`}
                  >
                    Striker: {striker?.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutBatter('nonStriker')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      outBatter === 'nonStriker'
                        ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-500/20'
                        : 'bg-[#08111F] border-[#D8AD55]/20 text-[#8793A5] hover:text-white'
                    }`}
                  >
                    Non-Striker: {nonStriker?.name}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Wicket Mode
                </label>
                <select
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
                >
                  <option value="caught">Caught</option>
                  <option value="bowled">Bowled</option>
                  <option value="lbw">LBW</option>
                  <option value="run_out">Run Out</option>
                  <option value="stumped">Stumped</option>
                  <option value="hit_wicket">Hit Wicket</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Incoming Next Batter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shakil Anowar"
                  value={newBatterName}
                  onChange={(e) => setNewBatterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
                >
                </input>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setWicketModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#08111F] border border-white/10 text-[#8793A5] hover:text-white font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWicket}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
              >
                Confirm Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
