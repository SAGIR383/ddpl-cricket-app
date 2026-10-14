'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Activity, RotateCcw, AlertOctagon, UserPlus, Trophy, Check, ArrowRight, Shield, Download, Share2, Radio, Lock } from 'lucide-react';
import { calculateOversString, calculateEconomyRate, calculateStrikeRate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BatterStats {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal: string | null;
}

interface BowlerStats {
  id: string;
  name: string;
  overs: number;
  ballsInOver: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;
  const { isScorer, role } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<any>(null);

  // Active Innings State (Fresh match starts at 0/0)
  const [inningsNumber, setInningsNumber] = useState(1);
  const [totalRuns, setTotalRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [legalBalls, setLegalBalls] = useState(0); // 0.0 overs
  const [extras, setExtras] = useState({ wide: 0, noBall: 0, bye: 0, legBye: 0 });

  // Realtime live sync notification
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Dynamic Tournament Rules & Match Overs
  const [matchRules, setMatchRules] = useState({
    matchOvers: 10,
    maxBowlerOvers: 2,
    wideBallPenalty: '+1 Run & Extra Ball',
    noBallPenalty: '+1 Run + Free Hit',
    pointsPerWin: 2,
  });

  useEffect(() => {
    async function loadRules() {
      try {
        const res = await fetch('/api/admin/rules');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.rules) {
            setMatchRules({
              matchOvers: data.rules.matchOvers || 10,
              maxBowlerOvers: data.rules.maxBowlerOvers || Math.max(1, Math.ceil((data.rules.matchOvers || 10) / 5)),
              wideBallPenalty: data.rules.wideBallPenalty || '+1 Run & Extra Ball',
              noBallPenalty: data.rules.noBallPenalty || '+1 Run + Free Hit',
              pointsPerWin: data.rules.pointsPerWin || 2,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load match rules:', e);
      }
    }
    loadRules();
  }, []);

  // Batters State
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);

  const [batters, setBatters] = useState<BatterStats[]>([
    { id: 'b1', name: 'Opening Batter 1', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: null },
    { id: 'b2', name: 'Opening Batter 2', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: null },
  ]);

  // Current Bowler State
  const [currentBowler, setCurrentBowler] = useState<BowlerStats>({
    id: 'bw1',
    name: 'Opening Bowler',
    overs: 0,
    ballsInOver: 0,
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
  });

  const [bowlersList, setBowlersList] = useState<BowlerStats[]>([
    { id: 'bw1', name: 'Opening Bowler', overs: 0, ballsInOver: 0, maidens: 0, runsConceded: 0, wickets: 0 },
  ]);

  // Over delivery log (e.g. ['1', '4', 'Wd', '0', 'W', '6'])
  const [currentOverDeliveries, setCurrentOverDeliveries] = useState<string[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);

  // Wicket Modal State
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState('caught');
  const [outBatter, setOutBatter] = useState<'striker' | 'nonStriker'>('striker');
  const [newBatterName, setNewBatterName] = useState('');

  // Initialize Realtime Broadcast Channel for Match
  useEffect(() => {
    const channelName = `match-${matchId || 'live'}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'score_update' }, (payload) => {
        const data = payload.payload;
        if (data) {
          setTotalRuns(data.totalRuns);
          setWickets(data.wickets);
          setLegalBalls(data.legalBalls);
          setExtras(data.extras);
          setStrikerIndex(data.strikerIndex);
          setNonStrikerIndex(data.nonStrikerIndex);
          setBatters(data.batters);
          setCurrentBowler(data.currentBowler);
          setCurrentOverDeliveries(data.currentOverDeliveries);
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
  const broadcastScore = (updatedState: any) => {
    if (channelRef.current) {
      setSyncStatus('syncing');
      channelRef.current.send({
        type: 'broadcast',
        event: 'score_update',
        payload: updatedState,
      }).then(() => {
        setSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString());
      }).catch(() => {
        setSyncStatus('connected');
      });
    }
  };

  // Ball Recording Engine
  function recordBall(runs: number, extraType: 'none' | 'wide' | 'noBall' | 'bye' | 'legBye' = 'none') {
    if (!isScorer) return;
    const isLegal = extraType === 'none' || extraType === 'bye' || extraType === 'legBye';
    const runsToAdd = runs + (extraType === 'wide' || extraType === 'noBall' ? 1 : 0);

    // Snapshot for Undo
    const snapshot = {
      totalRuns,
      wickets,
      legalBalls,
      extras: { ...extras },
      strikerIndex,
      nonStrikerIndex,
      batters: JSON.parse(JSON.stringify(batters)),
      currentBowler: { ...currentBowler },
      currentOverDeliveries: [...currentOverDeliveries],
    };
    setDeliveryHistory([...deliveryHistory, snapshot]);

    // Update Totals
    setTotalRuns(totalRuns + runsToAdd);

    if (extraType === 'wide') setExtras({ ...extras, wide: extras.wide + 1 });
    if (extraType === 'noBall') setExtras({ ...extras, noBall: extras.noBall + 1 });
    if (extraType === 'bye') setExtras({ ...extras, bye: extras.bye + runs });
    if (extraType === 'legBye') setExtras({ ...extras, legBye: extras.legBye + runs });

    // Update Batter (if runs came off bat)
    if (extraType === 'none' || extraType === 'noBall') {
      const updatedBatters = [...batters];
      const active = updatedBatters[strikerIndex];
      active.runs += runs;
      active.balls += 1;
      if (runs === 4) active.fours += 1;
      if (runs === 6) active.sixes += 1;
      setBatters(updatedBatters);
    } else if (isLegal) {
      // Bye or Leg-bye still costs a ball faced
      const updatedBatters = [...batters];
      updatedBatters[strikerIndex].balls += 1;
      setBatters(updatedBatters);
    }

    // Update Bowler
    const updatedBowler = { ...currentBowler };
    updatedBowler.runsConceded += runsToAdd;
    if (isLegal) {
      updatedBowler.ballsInOver += 1;
      if (updatedBowler.ballsInOver === 6) {
        updatedBowler.overs += 1;
        updatedBowler.ballsInOver = 0;
      }
    }
    setCurrentBowler(updatedBowler);

    // Delivery Symbol for Over tracker
    let symbol = `${runs}`;
    if (extraType === 'wide') symbol = 'Wd';
    if (extraType === 'noBall') symbol = `Nb${runs > 0 ? '+' + runs : ''}`;
    if (extraType === 'bye') symbol = `B${runs}`;
    if (extraType === 'legBye') symbol = `Lb${runs}`;

    const newOver = [...currentOverDeliveries, symbol];

    // Strike Rotation on Odd Runs
    if (runs % 2 !== 0 && extraType !== 'wide') {
      setStrikerIndex(nonStrikerIndex);
      setNonStrikerIndex(strikerIndex);
    }

    // End of Over (6 Legal Balls)
    let nextDeliveries = newOver;
    let nextStriker = strikerIndex;
    let nextNonStriker = nonStrikerIndex;
    let nextBalls = legalBalls;

    if (runs % 2 !== 0 && extraType !== 'wide') {
      nextStriker = nonStrikerIndex;
      nextNonStriker = strikerIndex;
    }

    if (isLegal) {
      nextBalls = legalBalls + 1;
      setLegalBalls(nextBalls);

      if (nextBalls % 6 === 0) {
        // Rotate strike at end of over
        const temp = nextStriker;
        nextStriker = nextNonStriker;
        nextNonStriker = temp;
        setStrikerIndex(nextStriker);
        setNonStrikerIndex(nextNonStriker);
        nextDeliveries = [];
        setCurrentOverDeliveries([]);
      } else {
        setCurrentOverDeliveries(newOver);
      }
    } else {
      setCurrentOverDeliveries(newOver);
    }

    // Broadcast in realtime to all spectator screens
    broadcastScore({
      totalRuns: totalRuns + runsToAdd,
      wickets,
      legalBalls: nextBalls,
      extras: {
        wide: extras.wide + (extraType === 'wide' ? 1 : 0),
        noBall: extras.noBall + (extraType === 'noBall' ? 1 : 0),
        bye: extras.bye + (extraType === 'bye' ? runs : 0),
        legBye: extras.legBye + (extraType === 'legBye' ? runs : 0),
      },
      strikerIndex: nextStriker,
      nonStrikerIndex: nextNonStriker,
      batters,
      currentBowler: updatedBowler,
      currentOverDeliveries: nextDeliveries,
    });
  }

  // Handle Wicket Confirmation
  function confirmWicket() {
    const dismissedIndex = outBatter === 'striker' ? strikerIndex : nonStrikerIndex;

    const snapshot = {
      totalRuns,
      wickets,
      legalBalls,
      extras: { ...extras },
      strikerIndex,
      nonStrikerIndex,
      batters: JSON.parse(JSON.stringify(batters)),
      currentBowler: { ...currentBowler },
      currentOverDeliveries: [...currentOverDeliveries],
    };
    setDeliveryHistory([...deliveryHistory, snapshot]);

    const updatedBatters = [...batters];
    updatedBatters[dismissedIndex].isOut = true;
    updatedBatters[dismissedIndex].dismissal = `${wicketType} b ${currentBowler.name}`;

    // Add incoming batter
    const newBatterIndex = updatedBatters.length;
    updatedBatters.push({
      id: `b-${Date.now()}`,
      name: newBatterName || `Batter ${newBatterIndex + 1}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissal: null,
    });

    if (outBatter === 'striker') {
      setStrikerIndex(newBatterIndex);
    } else {
      setNonStrikerIndex(newBatterIndex);
    }

    setBatters(updatedBatters);
    setWickets(wickets + 1);
    setLegalBalls(legalBalls + 1);

    // Bowler wicket
    const updatedBowler = { ...currentBowler };
    if (wicketType !== 'run_out') {
      updatedBowler.wickets += 1;
    }
    updatedBowler.ballsInOver += 1;
    if (updatedBowler.ballsInOver === 6) {
      updatedBowler.overs += 1;
      updatedBowler.ballsInOver = 0;
      setStrikerIndex(nonStrikerIndex);
      setNonStrikerIndex(strikerIndex);
      setCurrentOverDeliveries([]);
    } else {
      setCurrentOverDeliveries([...currentOverDeliveries, 'W']);
    }
    setCurrentBowler(updatedBowler);

    setWicketModalOpen(false);
    setNewBatterName('');

    broadcastScore({
      totalRuns,
      wickets: wickets + 1,
      legalBalls: legalBalls + 1,
      extras,
      strikerIndex: outBatter === 'striker' ? newBatterIndex : strikerIndex,
      nonStrikerIndex: outBatter === 'nonStriker' ? newBatterIndex : nonStrikerIndex,
      batters: updatedBatters,
      currentBowler: updatedBowler,
      currentOverDeliveries: updatedBowler.ballsInOver === 0 ? [] : [...currentOverDeliveries, 'W'],
    });
  }

  // Handle Undo
  function handleUndo() {
    if (deliveryHistory.length === 0) return;
    const prev = deliveryHistory[deliveryHistory.length - 1];

    setTotalRuns(prev.totalRuns);
    setWickets(prev.wickets);
    setLegalBalls(prev.legalBalls);
    setExtras(prev.extras);
    setStrikerIndex(prev.strikerIndex);
    setNonStrikerIndex(prev.nonStrikerIndex);
    setBatters(prev.batters);
    setCurrentBowler(prev.currentBowler);
    setCurrentOverDeliveries(prev.currentOverDeliveries);

    setDeliveryHistory(deliveryHistory.slice(0, -1));

    broadcastScore({
      totalRuns: prev.totalRuns,
      wickets: prev.wickets,
      legalBalls: prev.legalBalls,
      extras: prev.extras,
      strikerIndex: prev.strikerIndex,
      nonStrikerIndex: prev.nonStrikerIndex,
      batters: prev.batters,
      currentBowler: prev.currentBowler,
      currentOverDeliveries: prev.currentOverDeliveries,
    });
  }

  const currentRunRate = legalBalls > 0 ? ((totalRuns * 6) / legalBalls).toFixed(2) : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Live Match Top Scoreboard */}
      <div className="glass-card overflow-hidden border border-emerald-500/40 shadow-2xl">
        <div className="p-6 bg-gradient-to-r from-blue-950 via-cricket-card to-cricket-dark flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-cricket-border">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                DDPL 2026 • Match 1 • Live
              </span>

              {/* Supabase Realtime Channel Badge */}
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
                <span>Live Sync: {syncStatus}</span>
              </span>

              <span className="text-[11px] text-cricket-muted">
                Last ball: {lastSyncTime}
              </span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl text-white mt-2">
              Teoco Knight Riders <span className="text-cricket-muted font-normal text-2xl">vs</span> Aircom Avengers
            </h1>
            <div className="text-xs text-cricket-muted mt-1">
              Knight Riders won toss &amp; decided to bat first • {matchRules.matchOvers} Overs Limit • Max {matchRules.maxBowlerOvers} Ov/Bowler
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <div className="text-right">
              <div className="font-display font-black text-5xl sm:text-6xl text-cricket-teal tracking-tight">
                {totalRuns} / {wickets}
              </div>
              <div className="text-sm font-bold text-gray-300">
                Overs: <span className="text-white font-extrabold">{calculateOversString(legalBalls)}</span> ({matchRules.matchOvers}.0) • CRR: <span className="text-cricket-gold">{currentRunRate}</span>
              </div>
            </div>

            {/* Match Reports & Export Buttons (PDF & WhatsApp) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-white text-xs font-bold transition-all shadow"
                title="Download or Print Match Scorecard as PDF"
              >
                <Download className="w-3.5 h-3.5 text-cricket-teal" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => {
                  const shareText = `🏏 *DDPL (Desk to Dugout Premier League) Live Match Update*\n*Teoco Knight Riders vs Aircom Avengers*\nScore: *${totalRuns}/${wickets}* (${calculateOversString(legalBalls)} ov)\nCRR: ${currentRunRate}\nStriker: ${batters[strikerIndex]?.name} ${batters[strikerIndex]?.runs}* (${batters[strikerIndex]?.balls})\nBowler: ${currentBowler.name} ${currentBowler.wickets}/${currentBowler.runsConceded}\n\nLive on CricPluse Platform!`;
                  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow shadow-emerald-600/30"
                title="Share instant scorecard update to WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Players on Pitch */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-cricket-dark/60">
          {/* Batters */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-cricket-muted uppercase tracking-wider">
              Batters at the Crease
            </div>
            <div className="space-y-2">
              {/* Striker */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-cricket-card border border-cricket-teal/40">
                <div className="flex items-center gap-2">
                  <span className="text-cricket-teal font-black text-sm">★</span>
                  <span className="font-bold text-white text-sm">{batters[strikerIndex]?.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-lg text-white">
                    {batters[strikerIndex]?.runs}
                  </span>
                  <span className="text-xs text-cricket-muted ml-1.5">
                    ({batters[strikerIndex]?.balls}b, {batters[strikerIndex]?.fours}x4, {batters[strikerIndex]?.sixes}x6)
                  </span>
                </div>
              </div>

              {/* Non-Striker */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-cricket-card/60 border border-cricket-border">
                <div className="flex items-center gap-2">
                  <span className="text-cricket-muted text-sm">•</span>
                  <span className="font-semibold text-gray-300 text-sm">{batters[nonStrikerIndex]?.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-bold text-lg text-gray-300">
                    {batters[nonStrikerIndex]?.runs}
                  </span>
                  <span className="text-xs text-cricket-muted ml-1.5">
                    ({batters[nonStrikerIndex]?.balls}b, {batters[nonStrikerIndex]?.fours}x4)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Bowler */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-cricket-muted uppercase tracking-wider">
              Current Bowler
            </div>
            <div className="p-3.5 rounded-xl bg-cricket-card border border-cricket-border flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">{currentBowler.name}</div>
                <div className="text-xs text-cricket-muted mt-0.5">Spell Figures</div>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-lg text-white">
                  {currentBowler.wickets} / {currentBowler.runsConceded}
                </div>
                <div className="text-xs text-cricket-muted">
                  {currentBowler.overs}.{currentBowler.ballsInOver} ov • Econ: {calculateEconomyRate(currentBowler.runsConceded, currentBowler.overs * 6 + currentBowler.ballsInOver)}
                </div>
              </div>
            </div>

            {/* This Over Visual Balls */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-cricket-muted">This Over:</span>
              <div className="flex items-center gap-2">
                {currentOverDeliveries.length === 0 ? (
                  <span className="text-xs text-cricket-muted italic">Ready for first delivery…</span>
                ) : (
                  currentOverDeliveries.map((ball, idx) => (
                    <span
                      key={idx}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs ${
                        ball === 'W'
                          ? 'bg-red-500 text-white'
                          : ball.includes('4') || ball.includes('6')
                          ? 'bg-cricket-teal text-cricket-dark'
                          : 'bg-cricket-dark text-gray-200 border border-cricket-border'
                      }`}
                    >
                      {ball}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scorer Dial Keypad vs Spectator Mode (RBAC) */}
      {isScorer ? (
        <div className="glass-card p-6 space-y-4 border border-cricket-border shadow-2xl">
          <div className="flex items-center justify-between border-b border-cricket-border pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cricket-teal" />
              <span className="font-display font-bold text-xl text-white">
                Official Scorer Console
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cricket-teal/20 text-cricket-teal uppercase">
                Authorized
              </span>
            </div>
            <button
              onClick={handleUndo}
              disabled={deliveryHistory.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cricket-dark hover:bg-cricket-card border border-red-500/30 text-red-400 text-xs font-bold disabled:opacity-40 transition-all"
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
              onClick={() => recordBall(run)}
              className="py-4 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-white font-display font-extrabold text-2xl sm:text-3xl transition-transform active:scale-95 shadow"
            >
              {run}
            </button>
          ))}
        </div>

        {/* Extras & Wicket Action Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 pt-2">
          <button
            onClick={() => recordBall(0, 'wide')}
            className="py-3 rounded-xl bg-cricket-dark hover:bg-cricket-card border border-blue-500/40 text-blue-400 font-bold text-sm transition-all"
          >
            Wide (+1)
          </button>
          <button
            onClick={() => recordBall(0, 'noBall')}
            className="py-3 rounded-xl bg-cricket-dark hover:bg-cricket-card border border-amber-500/40 text-amber-400 font-bold text-sm transition-all"
          >
            No Ball (+1)
          </button>
          <button
            onClick={() => recordBall(1, 'bye')}
            className="py-3 rounded-xl bg-cricket-dark hover:bg-cricket-card border border-cricket-border text-gray-300 font-bold text-sm transition-all"
          >
            Bye (1)
          </button>
          <button
            onClick={() => recordBall(1, 'legBye')}
            className="py-3 rounded-xl bg-cricket-dark hover:bg-cricket-card border border-cricket-border text-gray-300 font-bold text-sm transition-all"
          >
            Leg Bye (1)
          </button>
          <button
            onClick={() => setWicketModalOpen(true)}
            className="py-3 sm:col-span-1 col-span-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-display font-extrabold text-lg uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            WICKET (OUT)
          </button>
        </div>
      </div>
      ) : (
        /* Spectator Live Stream Feed (View-Only Mode) */
        <div className="glass-card p-6 border border-cricket-border/80 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Spectator View • Realtime Broadcast Active</span>
          </div>
          <h3 className="font-display font-bold text-xl text-white">
            Live Ball-by-Ball Spectator Feed
          </h3>
          <p className="text-xs text-cricket-muted max-w-md mx-auto">
            You are watching this match in live spectator mode. Every delivery scored by the match referee synchronizes automatically with zero refresh. Scoring controls are reserved for official scorers and tournament organizers.
          </p>
        </div>
      )}

      {/* Full Professional Scorecard Tables */}
      <div className="space-y-6">
        <h2 className="font-display font-bold text-2xl text-white">
          Full Scorecard — 1st Innings
        </h2>

        {/* Batting Scorecard Table */}
        <div className="glass-card overflow-hidden border border-cricket-border">
          <div className="p-4 bg-cricket-card/80 border-b border-cricket-border font-bold text-sm text-gray-200">
            Batting — Teoco Knight Riders (DDPL)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                <tr>
                  <th className="px-4 py-3">Batter</th>
                  <th className="px-4 py-3">Dismissal</th>
                  <th className="px-3 py-3 text-right">R</th>
                  <th className="px-3 py-3 text-right">B</th>
                  <th className="px-3 py-3 text-right">4s</th>
                  <th className="px-3 py-3 text-right">6s</th>
                  <th className="px-4 py-3 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cricket-border">
                {batters.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-cricket-card/30">
                    <td className="px-4 py-3 font-bold text-white">
                      {b.name} {!b.isOut && (idx === strikerIndex ? ' ★' : '')}
                    </td>
                    <td className="px-4 py-3 text-xs text-cricket-muted">
                      {b.isOut ? b.dismissal : <span className="text-emerald-400 font-bold">Not Out</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-display font-bold text-base text-white">{b.runs}</td>
                    <td className="px-3 py-3 text-right text-gray-400">{b.balls}</td>
                    <td className="px-3 py-3 text-right text-gray-400">{b.fours}</td>
                    <td className="px-3 py-3 text-right text-gray-400">{b.sixes}</td>
                    <td className="px-4 py-3 text-right text-cricket-teal font-semibold">
                      {calculateStrikeRate(b.runs, b.balls)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-cricket-dark/60 border-t border-cricket-border flex justify-between text-xs text-cricket-muted">
            <span>Extras: <strong className="text-white">{extras.wide + extras.noBall + extras.bye + extras.legBye}</strong> (w {extras.wide}, nb {extras.noBall}, b {extras.bye}, lb {extras.legBye})</span>
            <span>Total: <strong className="text-cricket-teal font-bold">{totalRuns}/{wickets}</strong> ({calculateOversString(legalBalls)} ov)</span>
          </div>
        </div>

        {/* Bowling Scorecard Table */}
        <div className="glass-card overflow-hidden border border-cricket-border">
          <div className="p-4 bg-cricket-card/80 border-b border-cricket-border font-bold text-sm text-gray-200">
            Bowling — Power Hitters XI
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-nums">
              <thead className="bg-cricket-dark/80 text-xs font-semibold text-cricket-muted uppercase border-b border-cricket-border">
                <tr>
                  <th className="px-4 py-3">Bowler</th>
                  <th className="px-3 py-3 text-right">O</th>
                  <th className="px-3 py-3 text-right">M</th>
                  <th className="px-3 py-3 text-right">R</th>
                  <th className="px-3 py-3 text-right">W</th>
                  <th className="px-4 py-3 text-right">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cricket-border">
                {bowlersList.map((bw) => {
                  const isCurrent = bw.id === currentBowler.id;
                  const activeBw = isCurrent ? currentBowler : bw;
                  return (
                    <tr key={bw.id} className="hover:bg-cricket-card/30">
                      <td className="px-4 py-3 font-bold text-white">
                        {activeBw.name} {isCurrent ? ' •' : ''}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-300">
                        {activeBw.overs}.{activeBw.ballsInOver}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-400">{activeBw.maidens}</td>
                      <td className="px-3 py-3 text-right font-display font-bold text-white">{activeBw.runsConceded}</td>
                      <td className="px-3 py-3 text-right font-display font-bold text-cricket-gold">{activeBw.wickets}</td>
                      <td className="px-4 py-3 text-right text-cricket-teal font-semibold">
                        {calculateEconomyRate(activeBw.runsConceded, activeBw.overs * 6 + activeBw.ballsInOver)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dismissal Modal */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 border-2 border-red-500/40 shadow-2xl space-y-5">
            <h3 className="font-display font-black text-2xl text-white flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-red-500" />
              <span>Record Dismissal</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Who is Out?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutBatter('striker')}
                    className={`p-2.5 rounded-lg text-xs font-bold border ${
                      outBatter === 'striker'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-cricket-dark border-cricket-border text-gray-400'
                    }`}
                  >
                    Striker: {batters[strikerIndex]?.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutBatter('nonStriker')}
                    className={`p-2.5 rounded-lg text-xs font-bold border ${
                      outBatter === 'nonStriker'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-cricket-dark border-cricket-border text-gray-400'
                    }`}
                  >
                    Non-Striker: {batters[nonStrikerIndex]?.name}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Wicket Mode</label>
                <select
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm"
                >
                  <option value="caught">Caught</option>
                  <option value="bowled">Bowled</option>
                  <option value="lbw">LBW</option>
                  <option value="run_out">Run Out</option>
                  <option value="stumped">Stumped</option>
                  <option value="hit_wicket">Hit Wicket</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Incoming Next Batter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shakil Anowar"
                  value={newBatterName}
                  onChange={(e) => setNewBatterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-cricket-dark border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setWicketModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-cricket-dark border border-cricket-border text-gray-300 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmWicket}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow"
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
