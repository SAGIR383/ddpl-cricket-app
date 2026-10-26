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
  Tv,
  FileDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MatchLiveState, InningsData } from '@/types/match.types';
import { generateMatchScorecardPDF } from '@/lib/pdfGenerator';
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
import { InfoTab } from '@/components/match/InfoTab';
import { SquadsTab } from '@/components/match/SquadsTab';
import { ScorerConsole } from '@/components/match/ScorerConsole';
import { WagonWheel } from '@/components/match/WagonWheel';

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

  // 3. Official Scorer Handlers
  const handleRecordBallAction = async (ballParams: RecordBallParams) => {
    if (!isScorer) return;
    setSyncStatus('syncing');

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

  const handleSwitchInnings = async () => {
    if (!isScorer) return;
    setSyncStatus('syncing');

    try {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch_innings',
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
      console.error('Error switching innings:', e);
    } finally {
      setSyncStatus('connected');
    }
  };

  const handleUpdateToss = async (winner: string, decision: 'bat' | 'bowl') => {
    if (!isScorer) return;
    setSyncStatus('syncing');

    try {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_toss',
          winner,
          decision,
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
      console.error('Error updating toss:', e);
    } finally {
      setSyncStatus('connected');
    }
  };

  const handleApplyDlsAction = async (dlsParams: {
    revisedOvers: number;
    revisedTarget: number;
    reason: string;
    method: 'standard_dls' | 'custom_overs';
  }) => {
    if (!isScorer) return;
    setSyncStatus('syncing');

    try {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise_target_dls',
          ...dlsParams,
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
      console.error('Error applying DLS revision:', e);
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

      {/* 2. SEGMENTED NAVIGATION TABS & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          isLive={matchState.status === 'live'}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => generateMatchScorecardPDF(matchState, matchState.tournament)}
            className="btn-press shimmer-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] text-xs font-bold shadow-md hover:brightness-110 cursor-pointer"
            title="Download Official Branded PDF Scorecard"
          >
            <FileDown className="w-4 h-4 text-[#08111F]" />
            <span>PDF Scorecard</span>
          </button>
          <Link
            href={`/matches/${matchId}/overlay`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold hover:bg-[#111D2D] transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Broadcast Overlay</span>
          </Link>
        </div>
      </div>

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

      {/* D. WAGON WHEEL & PITCH MAP TAB */}
      {activeTab === 'wagon' && (
        <div className="rounded-3xl p-6 sm:p-8 bg-[#0D1B2A]/90 border border-[#D8AD55]/20 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="font-display font-black text-xl text-white">
                Shot Direction & Wagon Wheel
              </h3>
              <p className="text-xs text-[#8793A5]">
                Trajectory mapping, boundary sectors & shot frequency for {currentInnings.battingTeam}
              </p>
            </div>

            <Link
              href={`/matches/${matchId}/overlay`}
              target="_blank"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all"
            >
              <Tv className="w-3.5 h-3.5 text-purple-400" />
              <span>Launch Live OBS Overlay</span>
            </Link>
          </div>

          <WagonWheel deliveries={currentInnings.deliveries} />
        </div>
      )}

      {/* E. INFO TAB */}
      {activeTab === 'info' && (
        <InfoTab state={matchState} />
      )}

      {/* F. SQUADS TAB */}
      {activeTab === 'squads' && (
        <SquadsTab state={matchState} />
      )}

      {/* 4. SCORER DIAL KEYPAD VS SPECTATOR MODE */}
      {isScorer ? (
        <ScorerConsole
          state={matchState}
          onRecordBall={handleRecordBallAction}
          onUndoBall={handleUndoBall}
          onSwitchInnings={handleSwitchInnings}
          onUpdateToss={handleUpdateToss}
          onApplyDls={handleApplyDlsAction}
        />
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
    </div>
  );
}
