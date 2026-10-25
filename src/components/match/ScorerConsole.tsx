'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  AlertOctagon,
  Shield,
  ArrowRightLeft,
  FastForward,
  Coins,
  Check,
  UserPlus,
  RefreshCw,
  Trophy,
  CloudRain,
  Compass,
} from 'lucide-react';
import { MatchLiveState, InningsData, WicketType, ExtraType, WagonWheelZone } from '@/types/match.types';
import { RecordBallParams, calculateOversString } from '@/lib/matchEngine';
import { DlsCalculatorModal } from './DlsCalculatorModal';

interface ScorerConsoleProps {
  state: MatchLiveState;
  onRecordBall: (params: RecordBallParams) => Promise<void>;
  onUndoBall: () => Promise<void>;
  onSwitchInnings: () => Promise<void>;
  onUpdateToss: (winner: string, decision: 'bat' | 'bowl') => Promise<void>;
  onApplyDls?: (params: {
    revisedOvers: number;
    revisedTarget: number;
    reason: string;
    method: 'standard_dls' | 'custom_overs';
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function ScorerConsole({
  state,
  onRecordBall,
  onUndoBall,
  onSwitchInnings,
  onUpdateToss,
  onApplyDls,
  isSubmitting = false,
}: ScorerConsoleProps) {
  // Modal states
  const [dlsModalOpen, setDlsModalOpen] = useState(false);
  const [trackWagonWheel, setTrackWagonWheel] = useState(true);
  const [selectedShotZone, setSelectedShotZone] = useState<WagonWheelZone | null>(null);
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState<WicketType>('caught');
  const [outBatter, setOutBatter] = useState<'striker' | 'nonStriker'>('striker');
  const [fielderName, setFielderName] = useState('');
  const [selectedIncomingBatter, setSelectedIncomingBatter] = useState('');
  const [customIncomingBatter, setCustomIncomingBatter] = useState('');

  // Toss Modal state
  const [tossModalOpen, setTossModalOpen] = useState(false);
  const [tossWinner, setTossWinner] = useState(state.innings1.battingTeam);
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  // Bowler selection state
  const [bowlerModalOpen, setBowlerModalOpen] = useState(false);
  const [selectedNextBowler, setSelectedNextBowler] = useState('');
  const [customNextBowler, setCustomNextBowler] = useState('');

  const currentInnings: InningsData =
    state.currentInnings === 1 ? state.innings1 : (state.innings2 || state.innings1);

  const striker = currentInnings.batters[currentInnings.strikerIndex] || currentInnings.batters[0];
  const nonStriker = currentInnings.batters[currentInnings.nonStrikerIndex] || currentInnings.batters[1];
  const bowler = currentInnings.bowlers[currentInnings.currentBowlerIndex] || currentInnings.bowlers[0];

  // Batting and Bowling Squad lists
  const battingSquad = state.currentInnings === 1 ? state.teamASquad : state.teamBSquad;
  const bowlingSquad = state.currentInnings === 1 ? state.teamBSquad : state.teamASquad;

  // Unbatted players for incoming batter selection
  const battedNames = new Set(currentInnings.batters.map((b) => b.name.toLowerCase()));
  const availableIncomingBatters = (battingSquad || []).filter(
    (p) => !battedNames.has(p.name?.toLowerCase())
  );

  // Available bowlers (excluding the current bowler to respect consecutive over rule)
  const availableBowlers = (bowlingSquad || []).filter(
    (p) => p.name.toLowerCase() !== bowler?.name.toLowerCase()
  );

  // Check if over just finished (6 legal balls)
  const isOverComplete = currentInnings.legalBalls > 0 && currentInnings.legalBalls % 6 === 0;

  // Check if 1st innings is complete (overs limit reached or all 10 wickets down)
  const maxBalls = state.rules.matchOvers * 6;
  const isFirstInningsFinished =
    state.currentInnings === 1 &&
    (currentInnings.legalBalls >= maxBalls || currentInnings.wickets >= 10);

  // Quick Action Handlers
  const handleBallPress = (runs: number, extraType: ExtraType = 'none', runsExtras = 0) => {
    if (isSubmitting) return;
    onRecordBall({
      runsBat: runs,
      extraType,
      runsExtras: runsExtras || (extraType === 'wide' || extraType === 'noBall' ? 1 : 0),
      shotZone: selectedShotZone || undefined,
    });
    setSelectedShotZone(null);
  };

  const handleWicketSubmit = async () => {
    const dismissedBatter = outBatter === 'striker' ? striker : nonStriker;
    const finalIncomingName = customIncomingBatter.trim() || selectedIncomingBatter || `Batter ${currentInnings.batters.length + 1}`;

    const fielderDesc = fielderName.trim() ? ` c ${fielderName.trim()}` : '';
    let description = `${wicketType} b ${bowler?.name}`;
    if (wicketType === 'caught') description = `c ${fielderName.trim() || 'fielder'} b ${bowler?.name}`;
    if (wicketType === 'run_out') description = `run out (${fielderName.trim() || 'direct hit'})`;
    if (wicketType === 'stumped') description = `st ${fielderName.trim() || 'keeper'} b ${bowler?.name}`;

    await onRecordBall({
      runsBat: 0,
      extraType: 'none',
      isWicket: true,
      wicketDetails: {
        type: wicketType,
        playerOut: dismissedBatter?.name || 'Batter',
        fielder: fielderName.trim() || undefined,
        bowlerCredited: wicketType !== 'run_out',
        description,
      },
      newBatterName: finalIncomingName,
    });

    setWicketModalOpen(false);
    setFielderName('');
    setSelectedIncomingBatter('');
    setCustomIncomingBatter('');
  };

  const handleBowlerChangeSubmit = async () => {
    const finalBowlerName = customNextBowler.trim() || selectedNextBowler;
    if (finalBowlerName) {
      await onRecordBall({
        runsBat: 0,
        extraType: 'none',
        nextBowlerName: finalBowlerName,
      });
    }
    setBowlerModalOpen(false);
    setSelectedNextBowler('');
    setCustomNextBowler('');
  };

  const handleTossSubmit = async () => {
    await onUpdateToss(tossWinner, tossDecision);
    setTossModalOpen(false);
  };

  return (
    <div className="rounded-3xl p-5 sm:p-7 space-y-5 bg-[#0D1B2A]/95 backdrop-blur-md border border-[#D8AD55]/40 shadow-2xl relative">
      {/* 1. SCORER HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8AD55]/15 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D8AD55] to-[#F2D69A] flex items-center justify-center text-[#08111F] shadow-md">
            <Shield className="w-4 h-4 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg text-white">
                Official Scorer Console
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 uppercase">
                Authorized Ref
              </span>
            </div>
            <div className="text-[11px] text-[#8793A5]">
              {state.currentInnings === 1 ? '1st Innings' : '2nd Innings'} • {currentInnings.battingTeam} Batting
            </div>
          </div>
        </div>

        {/* Console Action Bar */}
        <div className="flex items-center gap-2">
          {/* Toss Setup (if match upcoming or 0 balls) */}
          {currentInnings.deliveries.length === 0 && (
            <button
              onClick={() => setTossModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Set Toss Winner & Decision"
            >
              <Coins className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Set Toss</span>
            </button>
          )}

          {/* Change Bowler */}
          <button
            onClick={() => setBowlerModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-white/10 text-gray-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Change Active Bowler"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span className="hidden sm:inline">Change Bowler</span>
            <span className="sm:hidden">Bowler</span>
          </button>

          {/* Corporate DLS / Rain Target Revision */}
          <button
            onClick={() => setDlsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Rain Disruption & DLS Target Revision"
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Rain / DLS</span>
            <span className="sm:hidden">DLS</span>
          </button>

          {/* Undo Ball Button */}
          <button
            onClick={onUndoBall}
            disabled={currentInnings.deliveries.length === 0 || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-red-500/30 text-red-400 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            title="Deterministic Event-Sourced Undo"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>Undo Ball</span>
          </button>
        </div>
      </div>

      {/* 2. INNINGS TRANSITION NOTIFICATION (if 1st innings complete) */}
      {isFirstInningsFinished && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#08111F] to-amber-500/20 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="font-display font-black text-white text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D8AD55]" />
              <span>1st Innings Concluded!</span>
            </div>
            <div className="text-xs text-[#8793A5] mt-0.5">
              {currentInnings.battingTeam} scored {currentInnings.totalRuns}/{currentInnings.wickets}. Target for {state.innings1.bowlingTeam} is {currentInnings.totalRuns + 1} runs in {state.rules.matchOvers} overs.
            </div>
          </div>

          <button
            onClick={onSwitchInnings}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            Start 2nd Innings
          </button>
        </div>
      )}

      {/* 2.5 WAGON WHEEL SECTOR QUICK-TAGGER */}
      <div className="p-3 rounded-2xl bg-[#08111F] border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTrackWagonWheel(!trackWagonWheel)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                trackWagonWheel
                  ? 'bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40'
                  : 'bg-white/5 text-gray-400 border border-transparent'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Wagon Wheel: {trackWagonWheel ? 'ON' : 'OFF'}</span>
            </button>
            {selectedShotZone && trackWagonWheel && (
              <span className="text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-md font-bold">
                Zone: {selectedShotZone.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>

          {selectedShotZone && trackWagonWheel && (
            <button
              type="button"
              onClick={() => setSelectedShotZone(null)}
              className="text-[11px] text-gray-400 hover:text-white underline cursor-pointer"
            >
              Clear Zone
            </button>
          )}
        </div>

        {trackWagonWheel && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
            {[
              { id: 'third_man', label: 'Third Man', side: 'off' },
              { id: 'cover_point', label: 'Cover Point', side: 'off' },
              { id: 'extra_cover', label: 'Extra Cover', side: 'off' },
              { id: 'long_off', label: 'Long Off', side: 'off' },
              { id: 'long_on', label: 'Long On', side: 'leg' },
              { id: 'mid_wicket', label: 'Mid Wkt', side: 'leg' },
              { id: 'square_leg', label: 'Sq Leg', side: 'leg' },
              { id: 'fine_leg', label: 'Fine Leg', side: 'leg' },
            ].map((z) => {
              const isSelected = selectedShotZone === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedShotZone(isSelected ? null : (z.id as WagonWheelZone))}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-tight text-center transition-all truncate border cursor-pointer ${
                    isSelected
                      ? 'bg-[#D8AD55] text-[#08111F] border-[#D8AD55] shadow font-black'
                      : z.side === 'off'
                      ? 'bg-cyan-950/20 hover:bg-cyan-950/40 border-cyan-500/20 text-cyan-300'
                      : 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/20 text-emerald-300'
                  }`}
                  title={`${z.label} (${z.side.toUpperCase()}-side)`}
                >
                  {z.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. PRIMARY RUNS KEYPAD ROW */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
          <span>Runs off Bat</span>
          <span>Striker: <strong className="text-[#F2D69A]">{striker?.name}</strong></span>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <button
              key={run}
              onClick={() => handleBallPress(run)}
              disabled={isSubmitting}
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
      </div>

      {/* 4. EXTRAS & DISMISSAL ACTION ROW */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
          Extras & Wickets
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <button
            onClick={() => handleBallPress(0, 'wide', 1)}
            disabled={isSubmitting}
            className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-blue-500/40 text-blue-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Wide (+1)
          </button>

          <button
            onClick={() => handleBallPress(0, 'noBall', 1)}
            disabled={isSubmitting}
            className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-amber-500/40 text-amber-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            No Ball (+1)
          </button>

          <button
            onClick={() => handleBallPress(0, 'bye', 1)}
            disabled={isSubmitting}
            className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/25 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Bye (1)
          </button>

          <button
            onClick={() => handleBallPress(0, 'legBye', 1)}
            disabled={isSubmitting}
            className="py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/25 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Leg Bye (1)
          </button>

          <button
            onClick={() => setWicketModalOpen(true)}
            disabled={isSubmitting}
            className="py-3.5 sm:col-span-1 col-span-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
          >
            WICKET (OUT)
          </button>
        </div>
      </div>

      {/* 5. ADVANCED WICKET MODAL */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-[#0D1B2A] border border-red-500/50 shadow-2xl space-y-5">
            <h3 className="font-display font-black text-2xl text-white flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-red-500" />
              <span>Record Wicket Dismissal</span>
            </h3>

            <div className="space-y-4 text-sm">
              {/* Dismissed Batter */}
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

              {/* Wicket Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Dismissal Type
                </label>
                <select
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value as WicketType)}
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

              {/* Fielder Name (Optional for caught/run_out) */}
              {(wicketType === 'caught' || wicketType === 'run_out' || wicketType === 'stumped') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                    Fielder Involved (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faisal / Direct Hit"
                    value={fielderName}
                    onChange={(e) => setFielderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              )}

              {/* Incoming Batter Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Select Incoming Batter from Squad
                </label>

                {availableIncomingBatters.length > 0 && (
                  <select
                    value={selectedIncomingBatter}
                    onChange={(e) => setSelectedIncomingBatter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55] mb-2"
                  >
                    <option value="">-- Choose from Team Squad --</option>
                    {availableIncomingBatters.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.role ? `(${p.role})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Or enter custom batter name…"
                  value={customIncomingBatter}
                  onChange={(e) => setCustomIncomingBatter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-white/10 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
                />
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
                onClick={handleWicketSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
              >
                Confirm Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CHANGE BOWLER MODAL */}
      {bowlerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-[#0D1B2A] border border-[#D8AD55]/40 shadow-2xl space-y-5">
            <h3 className="font-display font-black text-2xl text-white flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-[#D8AD55]" />
              <span>Select Next Bowler</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div className="text-xs text-[#8793A5]">
                Current bowler was <strong className="text-white">{bowler?.name}</strong>. Choose the next bowler for this over spell:
              </div>

              {availableBowlers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                    Choose from Bowling Squad
                  </label>
                  <select
                    value={selectedNextBowler}
                    onChange={(e) => setSelectedNextBowler(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
                  >
                    <option value="">-- Select Bowler --</option>
                    {availableBowlers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.role ? `(${p.role})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Or Enter Bowler Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shakil Anowar"
                  value={customNextBowler}
                  onChange={(e) => setCustomNextBowler(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setBowlerModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#08111F] border border-white/10 text-[#8793A5] hover:text-white font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBowlerChangeSubmit}
                disabled={isSubmitting || (!selectedNextBowler && !customNextBowler.trim())}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-sm shadow-lg shadow-[#D8AD55]/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                Set Bowler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SET TOSS MODAL */}
      {tossModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-[#0D1B2A] border border-[#D8AD55]/40 shadow-2xl space-y-5">
            <h3 className="font-display font-black text-2xl text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-[#D8AD55]" />
              <span>Official Toss Setup</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Toss Winner
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossWinner(state.innings1.battingTeam)}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      tossWinner === state.innings1.battingTeam
                        ? 'bg-[#D8AD55]/20 border-[#D8AD55] text-[#F2D69A]'
                        : 'bg-[#08111F] border-white/10 text-[#8793A5]'
                    }`}
                  >
                    {state.innings1.battingTeam}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossWinner(state.innings1.bowlingTeam)}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      tossWinner === state.innings1.bowlingTeam
                        ? 'bg-[#D8AD55]/20 border-[#D8AD55] text-[#F2D69A]'
                        : 'bg-[#08111F] border-white/10 text-[#8793A5]'
                    }`}
                  >
                    {state.innings1.bowlingTeam}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossDecision('bat')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      tossDecision === 'bat'
                        ? 'bg-[#D8AD55]/20 border-[#D8AD55] text-[#F2D69A]'
                        : 'bg-[#08111F] border-white/10 text-[#8793A5]'
                    }`}
                  >
                    Elected to Bat First
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossDecision('bowl')}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      tossDecision === 'bowl'
                        ? 'bg-[#D8AD55]/20 border-[#D8AD55] text-[#F2D69A]'
                        : 'bg-[#08111F] border-white/10 text-[#8793A5]'
                    }`}
                  >
                    Elected to Bowl First
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setTossModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#08111F] border border-white/10 text-[#8793A5] hover:text-white font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTossSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-sm shadow-lg shadow-[#D8AD55]/30 active:scale-95 transition-all cursor-pointer"
              >
                Confirm Toss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate DLS / Rain Target Revision Modal */}
      {onApplyDls && (
        <DlsCalculatorModal
          state={state}
          isOpen={dlsModalOpen}
          onClose={() => setDlsModalOpen(false)}
          onApplyDls={onApplyDls}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
