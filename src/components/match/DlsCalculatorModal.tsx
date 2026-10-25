'use client';

import React, { useState, useMemo } from 'react';
import { CloudRain, AlertTriangle, ArrowRight, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { MatchLiveState } from '@/types/match.types';
import { calculateDlsTarget } from '@/lib/matchEngine';

interface DlsCalculatorModalProps {
  state: MatchLiveState;
  isOpen: boolean;
  onClose: () => void;
  onApplyDls: (params: {
    revisedOvers: number;
    revisedTarget: number;
    reason: string;
    method: 'standard_dls' | 'custom_overs';
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function DlsCalculatorModal({
  state,
  isOpen,
  onClose,
  onApplyDls,
  isSubmitting = false,
}: DlsCalculatorModalProps) {
  const originalOvers = state.rules.matchOvers || 10;
  const inn1Score = state.innings1.totalRuns || 0;
  const inn2Wickets = state.innings2?.wickets || 0;
  const currentInn2Balls = state.innings2?.legalBalls || 0;
  const currentInn2Overs = Math.ceil(currentInn2Balls / 6);

  const [revisedOvers, setRevisedOvers] = useState<number>(
    state.targetOvers ? Math.max(5, state.targetOvers - 2) : Math.max(5, originalOvers - 2)
  );
  const [reason, setReason] = useState<string>('Rain delay during 2nd innings');
  const [customOverride, setCustomOverride] = useState<boolean>(false);
  const [customTarget, setCustomTarget] = useState<number>(0);

  // Compute DLS Target
  const dlsResult = useMemo(() => {
    return calculateDlsTarget(inn1Score, originalOvers, revisedOvers, inn2Wickets);
  }, [inn1Score, originalOvers, revisedOvers, inn2Wickets]);

  const effectiveTarget = customOverride && customTarget > 0 ? customTarget : dlsResult.revisedTarget;
  const effectiveRrr = revisedOvers > 0 ? parseFloat((effectiveTarget / revisedOvers).toFixed(2)) : 0;

  if (!isOpen) return null;

  const handleApply = async () => {
    if (revisedOvers < currentInn2Overs) {
      alert(`Revised overs (${revisedOvers}) cannot be less than overs already bowled (${currentInn2Overs}).`);
      return;
    }

    await onApplyDls({
      revisedOvers,
      revisedTarget: effectiveTarget,
      reason,
      method: customOverride ? 'custom_overs' : 'standard_dls',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border-2 border-cyan-500/40 shadow-2xl space-y-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                Rain & Target Revision (Corporate DLS)
              </h3>
              <p className="text-xs text-cyan-300">
                Recalculate 2nd innings target when overs are shortened
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Summary */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
            <span className="text-gray-400 uppercase font-semibold">1st Innings Score:</span>
            <div className="font-display font-black text-lg text-[#F2D69A]">
              {inn1Score} runs ({originalOvers} ov)
            </div>
            <div className="text-[11px] text-gray-500">{state.innings1.battingTeam}</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#08111F] border border-white/5 space-y-1">
            <span className="text-gray-400 uppercase font-semibold">Original Target:</span>
            <div className="font-display font-black text-lg text-white">
              {inn1Score + 1} runs in {originalOvers} ov
            </div>
            <div className="text-[11px] text-gray-500">
              RRR: {( (inn1Score + 1) / originalOvers ).toFixed(2)} rpo
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Revised 2nd Innings Overs Limit
              </label>
              <span className="text-xs text-cyan-400 font-bold">
                {revisedOvers} Overs ({revisedOvers * 6} Balls)
              </span>
            </div>
            <input
              type="range"
              min={Math.max(5, currentInn2Overs)}
              max={originalOvers}
              step={1}
              value={revisedOvers}
              onChange={(e) => setRevisedOvers(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#08111F] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
              <span>Min {Math.max(5, currentInn2Overs)} ov</span>
              <span>Full {originalOvers} ov</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block mb-1">
              Reason / Stoppage Notes
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Rain shower at 4.2 overs, lost 3 overs"
              className="w-full px-4 py-2.5 rounded-xl bg-[#08111F] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* DLS Result Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#08111F] to-indigo-950/40 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                  Calculated DLS Target
                </span>
                <div className="font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#F2D69A]">
                  {effectiveTarget} Runs
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  New Required Rate
                </span>
                <div className="font-display font-black text-xl text-emerald-400">
                  {effectiveRrr} RRR
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 border-t border-white/5 pt-2">
              Chasing team ({state.innings2?.battingTeam || state.innings1.bowlingTeam}) will need{' '}
              <strong className="text-white">{effectiveTarget} runs</strong> in{' '}
              <strong className="text-cyan-400">{revisedOvers} overs</strong>.
            </p>
          </div>

          {/* Optional Custom Target Manual Override */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setCustomOverride(!customOverride);
                if (!customOverride) setCustomTarget(dlsResult.revisedTarget);
              }}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{customOverride ? 'Use Automatic DLS Formula' : 'Manual Target Override (Custom Points)'}</span>
            </button>

            {customOverride && (
              <div className="mt-2 p-3 rounded-xl bg-[#08111F] border border-white/10 flex items-center gap-3">
                <label className="text-xs text-gray-400">Custom Target Runs:</label>
                <input
                  type="number"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(parseInt(e.target.value, 10) || 1)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-black/40 border border-cyan-500/40 text-white font-bold text-sm text-center"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleApply}
            className="btn-press px-6 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-white shadow-xl shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Updating State...' : 'Apply Revised DLS Target'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
