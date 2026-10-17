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
import { LiveTab } from '@/components/match/LiveTab';
import { OversTab } from '@/components/match/OversTab';
import { ScorecardTab } from '@/components/match/ScorecardTab';

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
        <LiveTab state={matchState} onNavigateToTab={setActiveTab} />
      )}

      {/* B. SCORECARD TAB */}
      {activeTab === 'scorecard' && (
        <ScorecardTab state={matchState} />
      )}

      {/* C. OVERS TAB */}
      {activeTab === 'overs' && (
        <OversTab state={matchState} />
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
