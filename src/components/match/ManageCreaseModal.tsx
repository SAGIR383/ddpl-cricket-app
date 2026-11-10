'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ArrowRightLeft,
  UserCheck,
  Shield,
  Zap,
  Check,
  Sparkles,
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

  const [activeTab, setActiveTab] = useState<'batters' | 'bowler'>(initialFocusTab);

  // Form selections
  const [selectedStriker, setSelectedStriker] = useState<string>(currentStriker?.name || '');
  const [selectedNonStriker, setSelectedNonStriker] = useState<string>(currentNonStriker?.name || '');
  const [selectedBowler, setSelectedBowler] = useState<string>(
    currentBowler?.name && currentBowler.name !== 'To be assigned' ? currentBowler.name : ''
  );

  // Search filter terms
  const [batterSearch, setBatterSearch] = useState('');
  const [bowlerSearch, setBowlerSearch] = useState('');
  const [customBatterInput, setCustomBatterInput] = useState('');
  const [customBowlerInput, setCustomBowlerInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtered squads
  const filteredBatters = useMemo(() => {
    if (!batterSearch.trim()) return battingSquad || [];
    const q = batterSearch.toLowerCase();
    return (battingSquad || []).filter(
      (p) => p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q)
    );
  }, [battingSquad, batterSearch]);

  const filteredBowlers = useMemo(() => {
    if (!bowlerSearch.trim()) return bowlingSquad || [];
    const q = bowlerSearch.toLowerCase();
    return (bowlingSquad || []).filter(
      (p) => p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q)
    );
  }, [bowlingSquad, bowlerSearch]);

  if (!isOpen) return null;

  // Swap strike locally
  const handleLocalSwapStrike = () => {
    const temp = selectedStriker;
    setSelectedStriker(selectedNonStriker);
    setSelectedNonStriker(temp);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalStriker = customBatterInput.trim() || selectedStriker;
      const finalBowler = customBowlerInput.trim() || selectedBowler;

      await onUpdateCrease({
        strikerName: finalStriker || undefined,
        nonStrikerName: selectedNonStriker || undefined,
        bowlerName: finalBowler || undefined,
      });
      onClose();
    } catch (e) {
      console.error('Failed to update crease:', e);
      alert('Failed to update crease players. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#08111F] border border-[#D8AD55]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0D1B2A] via-[#111D2D] to-[#0D1B2A] border-b border-[#D8AD55]/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Match #{state.matchNumber} Lineup Manager
              </span>
            </div>
            <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight mt-1">
              Change Batters &amp; Bowling Order
            </h3>
            <p className="text-xs text-[#8793A5] mt-0.5">
              Live adjustment of opening batters, crease strike, and opening bowler with instant match sync.
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
        <div className="p-3 bg-[#0D1B2A] border-b border-white/5 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('batters')}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'batters'
                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-lg'
                : 'text-[#8793A5] hover:text-white bg-white/5'
            }`}
          >
            🏏 Batters at Crease ({currentInnings.battingTeam})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bowler')}
            className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'bowler'
                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-lg'
                : 'text-[#8793A5] hover:text-white bg-white/5'
            }`}
          >
            ⚡ Current Bowler ({currentInnings.bowlingTeam})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BATTERS CONFIGURATION */}
          {activeTab === 'batters' && (
            <div className="space-y-6">
              {/* Active Crease Overview with 1-Click Swap Strike */}
              <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F2D69A] uppercase tracking-wider">
                    Selected Crease Pair
                  </span>
                  <button
                    type="button"
                    onClick={handleLocalSwapStrike}
                    className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold transition-all cursor-pointer"
                    title="Swap who is on strike for the next delivery"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
                    <span>🔄 Swap Strike</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Striker Card */}
                  <div className="p-3 rounded-xl bg-[#08111F] border-2 border-emerald-500/50 space-y-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <span>★ Striker (Facing Next Ball)</span>
                    </span>
                    <div className="font-bold text-sm text-white truncate">
                      {selectedStriker || 'Select Batter'}
                    </div>
                  </div>

                  {/* Non-Striker Card */}
                  <div className="p-3 rounded-xl bg-[#08111F] border border-white/10 space-y-1">
                    <span className="text-[10px] font-black text-[#8793A5] uppercase tracking-widest">
                      Non-Striker (Running End)
                    </span>
                    <div className="font-bold text-sm text-gray-200 truncate">
                      {selectedNonStriker || 'Select Batter'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Search Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase block">
                  Search &amp; Pick Batter from {currentInnings.battingTeam} Squad
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={batterSearch}
                    onChange={(e) => setBatterSearch(e.target.value)}
                    placeholder="Search player name or role (e.g. Arindam, Batter, All-Rounder)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              {/* Squad List */}
              <div className="space-y-2">
                <span className="text-xs text-[#8793A5] block">
                  Click a button to assign a player to the crease:
                </span>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {filteredBatters.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-gray-400">
                      No matching squad player found. You can type a custom player name below.
                    </div>
                  ) : (
                    filteredBatters.map((p) => {
                      const isStriker = selectedStriker.toLowerCase() === p.name.toLowerCase();
                      const isNon = selectedNonStriker.toLowerCase() === p.name.toLowerCase();

                      return (
                        <div
                          key={p.id || p.name}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isStriker
                              ? 'bg-emerald-950/30 border-emerald-500/50'
                              : isNon
                              ? 'bg-teal-950/30 border-teal-500/30'
                              : 'bg-[#0D1B2A] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.avatar ? (
                              <img
                                src={p.avatar}
                                alt={p.name}
                                className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#D8AD55]/20 text-[#F2D69A] font-bold text-xs flex items-center justify-center shrink-0">
                                {p.name.slice(0, 1)}
                              </div>
                            )}
                            <div className="truncate">
                              <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {isStriker && (
                                  <span className="text-[10px] font-black text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/20">
                                    STRIKER
                                  </span>
                                )}
                                {isNon && (
                                  <span className="text-[10px] font-black text-teal-300 px-1.5 py-0.2 rounded bg-teal-500/20">
                                    NON-STRIKER
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#8793A5] block">{p.role || 'Player'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStriker(p.name);
                                setCustomBatterInput('');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isStriker
                                  ? 'bg-emerald-500 text-cricket-dark font-black shadow'
                                  : 'bg-white/10 text-gray-300 hover:text-white'
                              }`}
                            >
                              Set Striker
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNonStriker(p.name);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isNon
                                  ? 'bg-teal-400 text-cricket-dark font-black shadow'
                                  : 'bg-white/10 text-gray-300 hover:text-white'
                              }`}
                            >
                              Set Non-Striker
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Custom Guest Batter fallback */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-[11px] font-semibold text-gray-400">
                  Or Type Custom Substitute Batter Name:
                </label>
                <input
                  type="text"
                  value={customBatterInput}
                  onChange={(e) => {
                    setCustomBatterInput(e.target.value);
                    if (e.target.value.trim()) setSelectedStriker(e.target.value.trim());
                  }}
                  placeholder="e.g. S. Sen (Guest Opener)"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BOWLER CONFIGURATION */}
          {activeTab === 'bowler' && (
            <div className="space-y-6">
              {/* Current Bowler Display Card */}
              <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 space-y-2">
                <span className="text-xs font-bold text-[#F2D69A] uppercase tracking-wider block">
                  Assigned Opening / Active Bowler
                </span>
                <div className="p-3.5 rounded-xl bg-[#08111F] border-2 border-amber-500/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                      ⚡
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        {selectedBowler || currentBowler?.name || 'To be assigned'}
                      </div>
                      <div className="text-[10px] text-[#8793A5]">
                        Bowling Team: {currentInnings.bowlingTeam}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                    Current Spell
                  </span>
                </div>
              </div>

              {/* Bowler Search Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase block">
                  Search &amp; Pick Bowler from {currentInnings.bowlingTeam} Squad
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={bowlerSearch}
                    onChange={(e) => setBowlerSearch(e.target.value)}
                    placeholder="Search bowler by name or role..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              {/* Bowlers Squad List */}
              <div className="space-y-2">
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {filteredBowlers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-gray-400">
                      No matching squad bowler found. Type custom bowler name below.
                    </div>
                  ) : (
                    filteredBowlers.map((p) => {
                      const isSelected = selectedBowler.toLowerCase() === p.name.toLowerCase();

                      return (
                        <div
                          key={p.id || p.name}
                          onClick={() => {
                            setSelectedBowler(p.name);
                            setCustomBowlerInput('');
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950/30 border-amber-400 text-white shadow'
                              : 'bg-[#0D1B2A] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.avatar ? (
                              <img
                                src={p.avatar}
                                alt={p.name}
                                className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {p.name.slice(0, 1)}
                              </div>
                            )}
                            <div className="truncate">
                              <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </div>
                              <span className="text-[10px] text-[#8793A5] block">{p.role || 'Bowler'}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBowler(p.name);
                              setCustomBowlerInput('');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-amber-400 text-cricket-dark font-black shadow'
                                : 'bg-white/10 text-gray-300 hover:text-white'
                            }`}
                          >
                            {isSelected ? 'Active' : 'Assign'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Custom Guest Bowler fallback */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label className="text-[11px] font-semibold text-gray-400">
                  Or Type Custom Bowler Name:
                </label>
                <input
                  type="text"
                  value={customBowlerInput}
                  onChange={(e) => {
                    setCustomBowlerInput(e.target.value);
                    if (e.target.value.trim()) setSelectedBowler(e.target.value.trim());
                  }}
                  placeholder="e.g. M. Sharma (Opening Fast Bowler)"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#0D1B2A] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#8793A5]">
            Changes synchronize instantly to live scorecards, scorer console &amp; overlay.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-press shimmer-btn flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Updating Crease...' : 'Save & Update Crease'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
