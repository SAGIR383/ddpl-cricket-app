'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Shield, Play, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { MatchLiveState, SquadPlayer } from '@/types/match.types';

interface ConductTossModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: MatchLiveState;
  onConductToss: (params: {
    winner: string;
    decision: 'bat' | 'bowl';
    strikerName: string;
    nonStrikerName: string;
    openingBowlerName: string;
    startLive: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function ConductTossModal({
  isOpen,
  onClose,
  state,
  onConductToss,
  isSubmitting = false,
}: ConductTossModalProps) {
  const teamAName = state.innings1.battingTeam;
  const teamAShort = state.innings1.battingTeamShort;
  const teamBName = state.innings1.bowlingTeam;
  const teamBShort = state.innings1.bowlingTeamShort;

  const squadA: SquadPlayer[] = state.teamASquad || [];
  const squadB: SquadPlayer[] = state.teamBSquad || [];

  const [tossWinner, setTossWinner] = useState<string>(teamAName);
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [startLive, setStartLive] = useState<boolean>(true);

  // Derived batting and bowling teams
  const isWinnerTeamA = tossWinner.trim().toLowerCase() === teamAName.trim().toLowerCase();
  const battingTeamName = tossDecision === 'bat' ? (isWinnerTeamA ? teamAName : teamBName) : (isWinnerTeamA ? teamBName : teamAName);
  const bowlingTeamName = battingTeamName === teamAName ? teamBName : teamAName;
  const battingSquad = battingTeamName === teamAName ? squadA : squadB;
  const bowlingSquad = battingTeamName === teamAName ? squadB : squadA;

  const [selectedStriker, setSelectedStriker] = useState<string>('');
  const [selectedNonStriker, setSelectedNonStriker] = useState<string>('');
  const [selectedBowler, setSelectedBowler] = useState<string>('');

  // Auto-initialize player selectors when batting / bowling team changes
  useEffect(() => {
    if (battingSquad.length >= 2) {
      setSelectedStriker(battingSquad[0]?.name || '');
      setSelectedNonStriker(battingSquad[1]?.name || '');
    } else if (battingSquad.length === 1) {
      setSelectedStriker(battingSquad[0]?.name || '');
      setSelectedNonStriker('');
    }

    if (bowlingSquad.length > 0) {
      // Pick owner/bowler or last player
      const bowler = bowlingSquad[bowlingSquad.length - 1] || bowlingSquad[0];
      setSelectedBowler(bowler?.name || '');
    }
  }, [battingTeamName, bowlingTeamName, battingSquad, bowlingSquad]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tossWinner) return;

    await onConductToss({
      winner: tossWinner,
      decision: tossDecision,
      strikerName: selectedStriker || battingSquad[0]?.name || '',
      nonStrikerName: selectedNonStriker || battingSquad[1]?.name || '',
      openingBowlerName: selectedBowler || bowlingSquad[0]?.name || '',
      startLive,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-gradient-to-b from-[#0D1B2A] to-[#08111F] border border-[#D8AD55]/40 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative my-8">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-[#8793A5] hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#D8AD55]/15 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D8AD55]/15 border border-[#D8AD55]/40 flex items-center justify-center text-2xl shadow-lg">
            🪙
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-white">
              Official Match Coin Toss
            </h3>
            <div className="text-xs text-[#8793A5] font-medium">
              Match {state.matchNumber} • {teamAName} vs {teamBName}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: SELECT TOSS WINNER */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#D8AD55] uppercase tracking-wider block">
              Step 1: Select Coin Toss Winner
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTossWinner(teamAName)}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tossWinner === teamAName
                    ? 'border-[#D8AD55] bg-[#D8AD55]/15 shadow-lg shadow-[#D8AD55]/15 text-white'
                    : 'border-white/10 bg-[#08111F] text-[#8793A5] hover:border-white/20'
                }`}
              >
                <span className="font-display font-black text-base">{teamAName}</span>
                <span className="text-[11px] font-bold text-[#F2D69A]">({teamAShort})</span>
              </button>

              <button
                type="button"
                onClick={() => setTossWinner(teamBName)}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  tossWinner === teamBName
                    ? 'border-[#D8AD55] bg-[#D8AD55]/15 shadow-lg shadow-[#D8AD55]/15 text-white'
                    : 'border-white/10 bg-[#08111F] text-[#8793A5] hover:border-white/20'
                }`}
              >
                <span className="font-display font-black text-base">{teamBName}</span>
                <span className="text-[11px] font-bold text-[#F2D69A]">({teamBShort})</span>
              </button>
            </div>
          </div>

          {/* STEP 2: SELECT DECISION */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#D8AD55] uppercase tracking-wider block">
              Step 2: Toss Winner Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTossDecision('bat')}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tossDecision === 'bat'
                    ? 'border-[#D8AD55] bg-[#D8AD55]/15 text-white font-bold'
                    : 'border-white/10 bg-[#08111F] text-[#8793A5] hover:border-white/20'
                }`}
              >
                <span className="text-lg">🏏</span>
                <span className="text-sm font-display font-bold">Elected to Bat</span>
              </button>

              <button
                type="button"
                onClick={() => setTossDecision('bowl')}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tossDecision === 'bowl'
                    ? 'border-[#D8AD55] bg-[#D8AD55]/15 text-white font-bold'
                    : 'border-white/10 bg-[#08111F] text-[#8793A5] hover:border-white/20'
                }`}
              >
                <span className="text-lg">⚾</span>
                <span className="text-sm font-display font-bold">Elected to Bowl</span>
              </button>
            </div>
          </div>

          {/* INNINGS PREVIEW HIGHLIGHT CARD */}
          <div className="p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#8793A5]">
              Match Alignment Summary
            </div>
            <div className="text-sm font-bold text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">1st Innings Batting:</span>
                <span className="text-[#F2D69A] font-black">{battingTeamName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">Bowling:</span>
                <span className="text-[#F2D69A] font-black">{bowlingTeamName}</span>
              </div>
            </div>
            <div className="text-xs text-[#8793A5] italic">
              📢 &quot;{tossWinner} won the toss &amp; elected to {tossDecision === 'bat' ? 'bat' : 'bowl'} first.&quot;
            </div>
          </div>

          {/* STEP 3: SELECT OPENING CREASE LINEUP */}
          <div className="space-y-3 pt-1">
            <label className="text-xs font-black text-[#D8AD55] uppercase tracking-wider block">
              Step 3: Select Opening Crease Lineup
            </label>

            {/* Striker Batter */}
            <div className="space-y-1">
              <label className="text-xs text-[#8793A5] font-semibold flex items-center justify-between">
                <span>Opening Batter 1 (On Strike)</span>
                <span className="text-[#F2D69A] font-bold text-[11px]">{battingTeamName}</span>
              </label>
              <select
                value={selectedStriker}
                onChange={(e) => setSelectedStriker(e.target.value)}
                className="w-full bg-[#08111F] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D8AD55]"
              >
                {battingSquad.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} {p.role ? `(${p.role})` : ''} {p.isCaptain ? '★ Captain' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker Batter */}
            <div className="space-y-1">
              <label className="text-xs text-[#8793A5] font-semibold flex items-center justify-between">
                <span>Opening Batter 2 (Non-Striker)</span>
                <span className="text-[#F2D69A] font-bold text-[11px]">{battingTeamName}</span>
              </label>
              <select
                value={selectedNonStriker}
                onChange={(e) => setSelectedNonStriker(e.target.value)}
                className="w-full bg-[#08111F] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D8AD55]"
              >
                {battingSquad
                  .filter((p) => p.name !== selectedStriker)
                  .map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.role ? `(${p.role})` : ''} {p.isCaptain ? '★ Captain' : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Opening Bowler */}
            <div className="space-y-1">
              <label className="text-xs text-[#8793A5] font-semibold flex items-center justify-between">
                <span>Opening Bowler (Over 1)</span>
                <span className="text-[#F2D69A] font-bold text-[11px]">{bowlingTeamName}</span>
              </label>
              <select
                value={selectedBowler}
                onChange={(e) => setSelectedBowler(e.target.value)}
                className="w-full bg-[#08111F] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D8AD55]"
              >
                {bowlingSquad.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} {p.role ? `(${p.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 4: GO LIVE OPTION */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Go Live on Website &amp; App
              </span>
              <p className="text-[11px] text-[#8793A5]">
                Switches match status from UPCOMING to LIVE immediately.
              </p>
            </div>
            <input
              type="checkbox"
              checked={startLive}
              onChange={(e) => setStartLive(e.target.checked)}
              className="w-5 h-5 accent-[#D8AD55] cursor-pointer"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8AD55]/15">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#8793A5] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !tossWinner}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-display font-black text-sm bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] shadow-lg shadow-[#D8AD55]/20 hover:opacity-95 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span>Confirm Toss &amp; Start Match</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
