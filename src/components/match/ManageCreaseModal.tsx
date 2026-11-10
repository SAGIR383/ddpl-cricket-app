'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  ArrowRightLeft,
  ChevronUp,
  ChevronDown,
  UserCheck,
  Shield,
  Zap,
  Check,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';
import { MatchLiveState, InningsData, SquadPlayer } from '@/types/match.types';

interface ManageCreaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: MatchLiveState;
  onUpdateCrease: (params: {
    strikerName?: string;
    nonStrikerName?: string;
    bowlerName?: string;
    battingOrder?: string[];
    swapStrike?: boolean;
  }) => Promise<void>;
  initialFocusTab?: 'batters' | 'bowler';
}

export function ManageCreaseModal({
  isOpen,
  onClose,
  state,
  onUpdateCrease,
  initialFocusTab = 'batters',
}: ManageCreaseModalProps) {
  const currentInnings: InningsData =
    state.currentInnings === 1 ? state.innings1 : (state.innings2 || state.innings1);

  const battingSquad: SquadPlayer[] =
    (state.currentInnings === 1 ? state.teamASquad : state.teamBSquad) || [];
  const bowlingSquad: SquadPlayer[] =
    (state.currentInnings === 1 ? state.teamBSquad : state.teamASquad) || [];

  const currentStriker =
    currentInnings.batters[currentInnings.strikerIndex] || currentInnings.batters[0];
  const currentNonStriker =
    currentInnings.batters[currentInnings.nonStrikerIndex] || currentInnings.batters[1];
  const currentBowler =
    currentInnings.bowlers[currentInnings.currentBowlerIndex] || currentInnings.bowlers[0];

  const maxBowlerQuota = state.rules?.maxBowlerOvers || 2;
  const squadCap = state.rules?.maxSquadSize || 8;

  const [activeTab, setActiveTab] = useState<'batters' | 'bowler'>(initialFocusTab);

  // Form selections
  const [selectedStriker, setSelectedStriker] = useState<string>(currentStriker?.name || '');
  const [selectedNonStriker, setSelectedNonStriker] = useState<string>(currentNonStriker?.name || '');
  const [selectedBowler, setSelectedBowler] = useState<string>(
    currentBowler?.name && currentBowler.name !== 'To be assigned' ? currentBowler.name : ''
  );

  // Batting Order List (all 8 players)
  const [battingOrder, setBattingOrder] = useState<SquadPlayer[]>([]);

  // Initialize and synchronize batting order
  useEffect(() => {
    if (battingSquad && battingSquad.length > 0) {
      // Build order starting with current striker and non-striker, then rest of squad
      const strikerName = currentStriker?.name?.toLowerCase();
      const nonStrikerName = currentNonStriker?.name?.toLowerCase();

      const ordered: SquadPlayer[] = [];
      const strikerPlayer = battingSquad.find((p) => p.name?.toLowerCase() === strikerName);
      const nonStrikerPlayer = battingSquad.find((p) => p.name?.toLowerCase() === nonStrikerName);

      if (strikerPlayer) ordered.push(strikerPlayer);
      if (nonStrikerPlayer && nonStrikerPlayer !== strikerPlayer) ordered.push(nonStrikerPlayer);

      for (const p of battingSquad) {
        if (!ordered.some((op) => op.name?.toLowerCase() === p.name?.toLowerCase())) {
          ordered.push(p);
        }
      }
      setBattingOrder(ordered);
      setSelectedStriker(strikerPlayer?.name || ordered[0]?.name || '');
      setSelectedNonStriker(nonStrikerPlayer?.name || ordered[1]?.name || '');
    }
  }, [state.matchId, state.currentInnings, battingSquad.length]);

  // Search filter terms
  const [batterSearch, setBatterSearch] = useState('');
  const [bowlerSearch, setBowlerSearch] = useState('');
  const [customBatterInput, setCustomBatterInput] = useState('');
  const [customBowlerInput, setCustomBowlerInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Shuffle / Move Batter Up
  const moveBatterUp = (index: number) => {
    if (index <= 0) return;
    setBattingOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      if (index === 1) {
        setSelectedStriker(copy[0]?.name || '');
        setSelectedNonStriker(copy[1]?.name || '');
      } else if (index === 2) {
        setSelectedNonStriker(copy[1]?.name || '');
      }
      return copy;
    });
  };

  // Shuffle / Move Batter Down
  const moveBatterDown = (index: number) => {
    if (index >= battingOrder.length - 1) return;
    setBattingOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      if (index === 0) {
        setSelectedStriker(copy[0]?.name || '');
        setSelectedNonStriker(copy[1]?.name || '');
      } else if (index === 1) {
        setSelectedNonStriker(copy[1]?.name || '');
      }
      return copy;
    });
  };

  // Assign direct striker
  const handleSetStriker = (playerName: string) => {
    setSelectedStriker(playerName);
    setBattingOrder((prev) => {
      const targetIdx = prev.findIndex((p) => p.name?.toLowerCase() === playerName.toLowerCase());
      if (targetIdx <= 0) return prev;
      const copy = [...prev];
      const [player] = copy.splice(targetIdx, 1);
      copy.unshift(player);
      return copy;
    });
  };

  // Assign direct non-striker
  const handleSetNonStriker = (playerName: string) => {
    setSelectedNonStriker(playerName);
    setBattingOrder((prev) => {
      const targetIdx = prev.findIndex((p) => p.name?.toLowerCase() === playerName.toLowerCase());
      if (targetIdx === 1 || targetIdx === -1) return prev;
      const copy = [...prev];
      const [player] = copy.splice(targetIdx, 1);
      copy.splice(1, 0, player);
      return copy;
    });
  };

  // Swap strike locally
  const handleLocalSwapStrike = () => {
    const temp = selectedStriker;
    setSelectedStriker(selectedNonStriker);
    setSelectedNonStriker(temp);
    setBattingOrder((prev) => {
      if (prev.length < 2) return prev;
      const copy = [...prev];
      const first = copy[0];
      copy[0] = copy[1];
      copy[1] = first;
      return copy;
    });
  };

  // Filtered lists
  const displayBattingOrder = useMemo(() => {
    if (!batterSearch.trim()) return battingOrder;
    const q = batterSearch.toLowerCase();
    return battingOrder.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q)
    );
  }, [battingOrder, batterSearch]);

  const filteredBowlers = useMemo(() => {
    if (!bowlerSearch.trim()) return bowlingSquad;
    const q = bowlerSearch.toLowerCase();
    return bowlingSquad.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q)
    );
  }, [bowlingSquad, bowlerSearch]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalStriker = customBatterInput.trim() || selectedStriker;
      const finalBowler = customBowlerInput.trim() || selectedBowler;

      await onUpdateCrease({
        strikerName: finalStriker || undefined,
        nonStrikerName: selectedNonStriker || undefined,
        bowlerName: finalBowler || undefined,
        battingOrder: battingOrder.map((p) => p.name),
      });
      onClose();
    } catch (e) {
      console.error('Failed to update crease and lineup:', e);
      alert('Failed to update lineup. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate last over bowler to detect consecutive overs
  const lastDelivery = currentInnings.deliveries[currentInnings.deliveries.length - 1];
  const lastBowlerName = lastDelivery?.bowlerName?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-[#08111F] border border-[#D8AD55]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Strip */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0D1B2A] via-[#111D2D] to-[#0D1B2A] border-b border-[#D8AD55]/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Match #{state.matchNumber} • Lineup &amp; Crease Studio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] text-[10px] font-bold">
                Squad Cap: {squadCap}
              </span>
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight mt-1">
              Shuffle Batting &amp; Bowling Order
            </h3>
            <p className="text-xs text-[#8793A5] mt-0.5">
              Reorder 1 to {squadCap} batting lineup, swap strike, or rotate opening/current bowler with instant sync.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-[#0D1B2A]/90 p-1.5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('batters')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'batters'
                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-lg'
                : 'text-[#8793A5] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏏</span>
            <span>Batting Order &amp; Crease ({currentInnings.battingTeam})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-black">
              {battingOrder.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bowler')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'bowler'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#08111F] shadow-lg'
                : 'text-[#8793A5] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>⚡</span>
            <span>Bowling Rotation ({currentInnings.bowlingTeam})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-black">
              {bowlingSquad.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: BATTING LINEUP & CREASE */}
          {activeTab === 'batters' && (
            <div className="space-y-4">
              {/* Active Crease Summary Box with 1-Click Swap Strike */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#D8AD55] uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Active Crease Batters</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLocalSwapStrike}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 border border-[#D8AD55]/40 text-[#F2D69A] text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                    title="Swap Strike between batters"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>🔄 Swap Strike</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Striker */}
                  <div className="p-3.5 rounded-xl bg-[#08111F] border-2 border-[#D8AD55] flex items-center justify-between shadow-md">
                    <div>
                      <div className="text-[10px] font-black uppercase text-[#D8AD55] tracking-widest flex items-center gap-1">
                        <span>★ Striker (On Strike)</span>
                      </div>
                      <div className="font-bold text-white text-base mt-0.5">
                        {selectedStriker || 'Select Striker'}
                      </div>
                    </div>
                    <span className="w-7 h-7 rounded-lg bg-[#D8AD55] text-[#08111F] font-black flex items-center justify-center text-xs shadow">
                      ★
                    </span>
                  </div>

                  {/* Non-Striker */}
                  <div className="p-3.5 rounded-xl bg-[#08111F] border border-white/20 flex items-center justify-between shadow-md">
                    <div>
                      <div className="text-[10px] font-black uppercase text-teal-400 tracking-widest">
                        Non-Striker (Runner)
                      </div>
                      <div className="font-bold text-gray-200 text-base mt-0.5">
                        {selectedNonStriker || 'Select Non-Striker'}
                      </div>
                    </div>
                    <span className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center text-xs">
                      •
                    </span>
                  </div>
                </div>
              </div>

              {/* Batting Order List with Up / Down Shuffle Controls */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <span>Full Batting Lineup (1 to {squadCap})</span>
                      <span className="text-[11px] text-[#8793A5] font-normal">
                        Use ⬆️ / ⬇️ to shuffle batting positions
                      </span>
                    </h4>
                  </div>

                  {/* Search Filter */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search batter by name..."
                      value={batterSearch}
                      onChange={(e) => setBatterSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#D8AD55]"
                    />
                  </div>
                </div>

                {/* Shuffled Batting Order Rows */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {displayBattingOrder.map((player, idx) => {
                    const originalIdx = battingOrder.findIndex(
                      (p) => p.name?.toLowerCase() === player.name?.toLowerCase()
                    );
                    const isStriker =
                      player.name?.toLowerCase() === selectedStriker?.toLowerCase();
                    const isNonStriker =
                      player.name?.toLowerCase() === selectedNonStriker?.toLowerCase();
                    const isNextIn = !isStriker && !isNonStriker && originalIdx === 2;

                    return (
                      <div
                        key={player.id || `${player.name}-${idx}`}
                        className={`p-3 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                          isStriker
                            ? 'bg-gradient-to-r from-[#D8AD55]/15 via-[#0D1B2A] to-[#0D1B2A] border-[#D8AD55] shadow-md'
                            : isNonStriker
                            ? 'bg-teal-500/10 border-teal-500/40'
                            : isNextIn
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-[#0D1B2A]/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Left: Position Number & Details */}
                        <div className="flex items-center gap-3">
                          {/* Position Badge */}
                          <span
                            className={`w-7 h-7 rounded-xl font-display font-black text-xs flex items-center justify-center shadow-inner ${
                              isStriker
                                ? 'bg-[#D8AD55] text-[#08111F]'
                                : isNonStriker
                                ? 'bg-teal-400 text-[#08111F]'
                                : 'bg-[#08111F] border border-white/15 text-gray-300'
                            }`}
                          >
                            #{originalIdx + 1}
                          </span>

                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 overflow-hidden flex items-center justify-center font-bold text-xs text-[#F2D69A]">
                            {player.avatar || player.photo ? (
                              <img
                                src={(player.avatar || player.photo) as string}
                                alt={player.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{player.name?.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>

                          {/* Name & Role */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {player.name}
                              </span>
                              {isStriker && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/50">
                                  ★ STRIKER
                                </span>
                              )}
                              {isNonStriker && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/50">
                                  NON-STRIKER
                                </span>
                              )}
                              {isNextIn && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  NEXT IN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8793A5] mt-0.5">
                              {player.role || 'Batter'}
                            </div>
                          </div>
                        </div>

                        {/* Right: Reorder Up/Down & Assign Buttons */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Shuffle Up / Down */}
                          <button
                            type="button"
                            onClick={() => moveBatterUp(originalIdx)}
                            disabled={originalIdx === 0}
                            className="p-1.5 rounded-lg bg-[#08111F] hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Move Up in Batting Order"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBatterDown(originalIdx)}
                            disabled={originalIdx === battingOrder.length - 1}
                            className="p-1.5 rounded-lg bg-[#08111F] hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Move Down in Batting Order"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Set Striker */}
                          <button
                            type="button"
                            onClick={() => handleSetStriker(player.name)}
                            disabled={isStriker}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isStriker
                                ? 'bg-[#D8AD55] text-[#08111F] font-black opacity-90'
                                : 'bg-[#08111F] hover:bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30'
                            }`}
                          >
                            {isStriker ? '★ Striker' : 'Set Striker'}
                          </button>

                          {/* Set Non-Striker */}
                          <button
                            type="button"
                            onClick={() => handleSetNonStriker(player.name)}
                            disabled={isNonStriker}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              isNonStriker
                                ? 'bg-teal-500 text-[#08111F] font-black opacity-90'
                                : 'bg-[#08111F] hover:bg-teal-500/15 text-teal-300 border border-teal-500/30'
                            }`}
                          >
                            {isNonStriker ? '✓ Non-Striker' : 'Set Non-Striker'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom / Substitute Batter Input */}
                <div className="pt-2 border-t border-white/10">
                  <label className="text-[11px] font-semibold text-[#8793A5] block mb-1">
                    Or Type Custom / Emergency Substitute Batter Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. S. Sen (Guest Opener)"
                    value={customBatterInput}
                    onChange={(e) => setCustomBatterInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOWLING ORDER & ROTATION */}
          {activeTab === 'bowler' && (
            <div className="space-y-4">
              {/* Active Bowler Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#0D1B2A] to-[#111D2D] border border-amber-500/40 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Current Active Bowler</span>
                  </span>
                  <span className="text-[11px] text-[#8793A5]">
                    Max Quota: <strong className="text-white">{maxBowlerQuota} Ov / Bowler</strong>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#08111F] border border-amber-500/30 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-400 text-[#08111F] font-black flex items-center justify-center text-sm shadow">
                      ⚡
                    </span>
                    <div>
                      <div className="font-bold text-white text-base">
                        {selectedBowler || 'No Bowler Assigned'}
                      </div>
                      <div className="text-xs text-[#8793A5]">
                        Quota Limit: {maxBowlerQuota} overs per bowler
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    Ready to Bowl
                  </span>
                </div>
              </div>

              {/* Bowling Squad List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Bowling Squad ({bowlingSquad.length} Players Available)
                    </h4>
                    <p className="text-[11px] text-[#8793A5]">
                      Click &apos;⚡ Bring to Bowl&apos; to rotate bowler for the active over
                    </p>
                  </div>

                  {/* Search Filter */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search bowler by name..."
                      value={bowlerSearch}
                      onChange={(e) => setBowlerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#D8AD55]"
                    />
                  </div>
                </div>

                {/* Bowler Rows */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredBowlers.map((bowlerPlayer, idx) => {
                    const isSelected =
                      bowlerPlayer.name?.toLowerCase() === selectedBowler?.toLowerCase();

                    // Find bowler match statistics from current innings
                    const bowlerMatchStat = currentInnings.bowlers.find(
                      (b) => b.name?.toLowerCase() === bowlerPlayer.name?.toLowerCase()
                    );
                    const oversBowled = bowlerMatchStat ? bowlerMatchStat.overs : 0;
                    const oversStr = bowlerMatchStat?.oversStr || '0.0';
                    const wickets = bowlerMatchStat?.wickets || 0;
                    const runsConceded = bowlerMatchStat?.runsConceded || 0;
                    const econ = bowlerMatchStat?.economy || '0.00';

                    const isQuotaCompleted = oversBowled >= maxBowlerQuota;
                    const isLastBowler =
                      lastBowlerName &&
                      lastBowlerName === bowlerPlayer.name?.toLowerCase() &&
                      currentInnings.legalBalls > 0 &&
                      currentInnings.legalBalls % 6 === 0;

                    return (
                      <div
                        key={bowlerPlayer.id || `${bowlerPlayer.name}-${idx}`}
                        className={`p-3 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/20 via-[#0D1B2A] to-[#0D1B2A] border-amber-500 shadow-md'
                            : isQuotaCompleted
                            ? 'bg-red-500/5 border-red-500/20 opacity-70'
                            : isLastBowler
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-[#0D1B2A]/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Left: Avatar, Name & Figures */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#08111F] border border-amber-500/30 overflow-hidden flex items-center justify-center font-bold text-xs text-amber-300">
                            {bowlerPlayer.avatar || bowlerPlayer.photo ? (
                              <img
                                src={(bowlerPlayer.avatar || bowlerPlayer.photo) as string}
                                alt={bowlerPlayer.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{bowlerPlayer.name?.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {bowlerPlayer.name}
                              </span>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/50">
                                  ⚡ CURRENT BOWLER
                                </span>
                              )}
                              {isQuotaCompleted && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                                  QUOTA COMPLETED
                                </span>
                              )}
                              {isLastBowler && !isSelected && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                                  JUST BOWLED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8793A5] mt-0.5">
                              {bowlerPlayer.role || 'Bowler'} •{' '}
                              <strong className="text-white">{oversStr}</strong> / {maxBowlerQuota} ov •{' '}
                              <strong className="text-amber-300">{wickets}/{runsConceded}</strong> • Econ: {econ}
                            </div>
                          </div>
                        </div>

                        {/* Right: Action Button */}
                        <div className="ml-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedBowler(bowlerPlayer.name)}
                            disabled={isSelected}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-amber-500 text-[#08111F] font-black shadow-md cursor-default'
                                : 'bg-[#08111F] hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 active:scale-95'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isSelected ? '✓ Active Bowler' : '⚡ Bring to Bowl'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom / Substitute Bowler Input */}
                <div className="pt-2 border-t border-white/10">
                  <label className="text-[11px] font-semibold text-[#8793A5] block mb-1">
                    Or Type Custom / Emergency Bowler Name:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. R. Sharma (Guest Bowler)"
                    value={customBowlerInput}
                    onChange={(e) => setCustomBowlerInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#0D1B2A]/90 border-t border-[#D8AD55]/20 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#8793A5]">
            Changes synchronize instantly to live scorecards, scorer console &amp; overlay.
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#08111F] border-t-transparent rounded-full animate-spin" />
                  <span>Syncing Lineup...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Update Crease</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
