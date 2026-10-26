'use client';

import React, { useState } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  Trophy,
  Users,
} from 'lucide-react';
import { MatchLiveState, InningsData } from '@/types/match.types';
import { calculateOversString, calculateStrikeRate } from '@/lib/matchEngine';
import { generateMatchScorecardPDF } from '@/lib/pdfGenerator';

interface ScorecardTabProps {
  state: MatchLiveState;
}

export function ScorecardTab({ state }: ScorecardTabProps) {
  // Accordion state: both innings open by default if they exist
  const [innings1Open, setInnings1Open] = useState(true);
  const [innings2Open, setInnings2Open] = useState(true);

  // Helper to render an innings scorecard
  const renderInningsCard = (
    innings: InningsData,
    inningsNumber: 1 | 2,
    isOpen: boolean,
    onToggle: () => void,
    squadPlayers?: any[]
  ) => {
    const isCurrentInnings = state.currentInnings === inningsNumber;
    const runRate = innings.legalBalls > 0
      ? ((innings.totalRuns * 6) / innings.legalBalls).toFixed(2)
      : '0.00';

    // Calculate Did Not Bat (DNB)
    const battedNames = new Set(innings.batters.map((b) => b.name.toLowerCase()));
    const didNotBat = (squadPlayers || [])
      .filter((p) => !battedNames.has(p.name?.toLowerCase()))
      .map((p) => p.name);

    return (
      <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl transition-all">
        {/* Accordion Header */}
        <div
          onClick={onToggle}
          className="p-4 sm:p-6 bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#111D2D]/70 select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#08111F] border border-[#D8AD55]/40 flex items-center justify-center font-display font-black text-base text-[#F2D69A] shadow-md">
              {innings.battingTeamShort.slice(0, 3)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base sm:text-lg text-white">
                  {innings.battingTeam}
                </span>
                <span className="text-xs text-[#8793A5] font-semibold">
                  ({inningsNumber === 1 ? '1st Innings' : '2nd Innings'})
                </span>
                {isCurrentInnings && state.status === 'live' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase animate-pulse">
                    Current
                  </span>
                )}
              </div>
              <div className="text-xs text-[#8793A5] mt-0.5">
                Run Rate: <strong className="text-[#D8AD55] font-black">{runRate}</strong>
                {inningsNumber === 2 && state.targetRuns && (
                  <>
                    {' '}• Target: <strong className="text-[#F2D69A]">{state.targetRuns}</strong>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-display font-black text-2xl sm:text-3xl text-[#F2D69A]">
                {innings.totalRuns}
                <span className="text-[#D8AD55]/60 font-light text-xl mx-0.5">/</span>
                {innings.wickets}
              </div>
              <div className="text-xs text-[#8793A5] font-medium">
                {calculateOversString(innings.legalBalls)} / {innings.oversLimit}.0 ov
              </div>
            </div>

            <div className="p-1 rounded-xl bg-[#08111F] border border-white/5 text-[#8793A5]">
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div>
            {/* 1. BATTING TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-nums">
                <thead className="bg-[#08111F]/95 text-[11px] font-bold text-[#8793A5] uppercase tracking-wider border-b border-[#D8AD55]/15">
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
                  {innings.batters.map((b, idx) => {
                    const isStriker = isCurrentInnings && !b.isOut && idx === innings.strikerIndex;
                    const isNonStriker = isCurrentInnings && !b.isOut && idx === innings.nonStrikerIndex;

                    return (
                      <tr key={b.id || idx} className="hover:bg-[#111D2D]/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                          <span>{b.name}</span>
                          {isStriker && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 uppercase">
                              ★ Strike
                            </span>
                          )}
                          {isNonStriker && (
                            <span className="text-[#8793A5] text-xs font-bold">•</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#8793A5]">
                          {b.isOut ? (
                            <span className="text-gray-300">{b.dismissal}</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">Not Out</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-display font-black text-base text-white">
                          {b.runs}
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{b.balls}</td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{b.fours}</td>
                        <td className="px-4 py-3.5 text-right text-gray-400">{b.sixes}</td>
                        <td className="px-5 py-3.5 text-right text-[#F2D69A] font-bold">
                          {calculateStrikeRate(b.runs, b.balls)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Extras Summary & Total Strip */}
            <div className="p-4 sm:px-5 bg-[#08111F]/80 border-t border-[#D8AD55]/15 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8793A5]">
              <div>
                Extras:{' '}
                <strong className="text-white font-bold">{innings.extras.total}</strong>{' '}
                <span className="text-gray-400">
                  (w {innings.extras.wide}, nb {innings.extras.noBall}, b {innings.extras.bye}, lb {innings.extras.legBye})
                </span>
              </div>
              <div>
                TOTAL:{' '}
                <strong className="text-[#F2D69A] font-black text-sm">
                  {innings.totalRuns}/{innings.wickets}
                </strong>{' '}
                <span className="text-gray-400">
                  ({calculateOversString(innings.legalBalls)} Ov, RR: {runRate})
                </span>
              </div>
            </div>

            {/* Did Not Bat (DNB) List */}
            {didNotBat.length > 0 && (
              <div className="p-3.5 sm:px-5 bg-[#08111F]/50 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-[#8793A5]">Did Not Bat:</span>
                <span className="text-gray-300 font-medium">
                  {didNotBat.join(', ')}
                </span>
              </div>
            )}

            {/* 2. FALL OF WICKETS (FOW) TIMELINE */}
            {innings.fallOfWickets.length > 0 && (
              <div className="p-4 sm:px-5 bg-[#08111F]/60 border-t border-[#D8AD55]/15 space-y-2">
                <div className="text-[11px] font-bold text-[#D8AD55] uppercase tracking-wider">
                  Fall of Wickets:
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {innings.fallOfWickets.map((fow) => (
                    <div
                      key={fow.wicketNumber}
                      className="px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/25 text-gray-200 shadow-sm flex items-center gap-1.5"
                    >
                      <span className="w-5 h-5 rounded-md bg-red-500/20 text-red-400 font-black text-[10px] flex items-center justify-center">
                        {fow.wicketNumber}
                      </span>
                      <span>
                        <strong className="text-white">{fow.batterName}</strong> —{' '}
                        <strong className="text-[#F2D69A]">{fow.score}</strong> ({fow.overStr} ov)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. BOWLING TABLE */}
            <div className="border-t border-[#D8AD55]/15">
              <div className="p-3 sm:px-5 bg-[#08111F]/90 text-[11px] font-bold text-[#D8AD55] uppercase tracking-wider flex items-center justify-between">
                <span>Bowling — {innings.bowlingTeam}</span>
                <span className="text-gray-400 font-normal">O - M - R - W - Econ - 0s</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm table-nums">
                  <thead className="bg-[#08111F]/80 text-[11px] font-bold text-[#8793A5] uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="px-5 py-3">Bowler</th>
                      <th className="px-4 py-3 text-right">O</th>
                      <th className="px-4 py-3 text-right">M</th>
                      <th className="px-4 py-3 text-right">R</th>
                      <th className="px-4 py-3 text-right">W</th>
                      <th className="px-4 py-3 text-right">Econ</th>
                      <th className="px-4 py-3 text-right">0s</th>
                      <th className="px-4 py-3 text-right">WD</th>
                      <th className="px-5 py-3 text-right">NB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {innings.bowlers.map((bw, idx) => {
                      const isCurrentBowler = isCurrentInnings && idx === innings.currentBowlerIndex;

                      return (
                        <tr key={bw.id || idx} className="hover:bg-[#111D2D]/60 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                            <span>{bw.name}</span>
                            {isCurrentBowler && (
                              <span className="w-2 h-2 rounded-full bg-[#D8AD55] animate-ping" />
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right text-gray-200">{bw.oversStr}</td>
                          <td className="px-4 py-3.5 text-right text-gray-400">{bw.maidens}</td>
                          <td className="px-4 py-3.5 text-right font-display font-bold text-white">
                            {bw.runsConceded}
                          </td>
                          <td className="px-4 py-3.5 text-right font-display font-black text-[#F2D69A]">
                            {bw.wickets}
                          </td>
                          <td className="px-4 py-3.5 text-right text-[#D8AD55] font-bold">
                            {bw.economy}
                          </td>
                          <td className="px-4 py-3.5 text-right text-gray-300">{bw.dots}</td>
                          <td className="px-4 py-3.5 text-right text-gray-400">{bw.wides}</td>
                          <td className="px-5 py-3.5 text-right text-gray-400">{bw.noBalls}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Scorecard Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D8AD55]" />
          <h2 className="font-display font-black text-2xl text-white">
            Full Match Scorecard
          </h2>
        </div>

        <button
          onClick={() => generateMatchScorecardPDF(state, state.tournament)}
          className="btn-press shimmer-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] text-xs font-bold transition-all cursor-pointer shadow-md hover:brightness-110"
          title="Download Official Branded PDF Scorecard"
        >
          <Download className="w-3.5 h-3.5 text-[#08111F]" />
          <span>Download PDF Scorecard</span>
        </button>
      </div>

      {/* 1st Innings Accordion */}
      {renderInningsCard(
        state.innings1,
        1,
        innings1Open,
        () => setInnings1Open(!innings1Open),
        state.teamASquad
      )}

      {/* 2nd Innings Accordion */}
      {state.innings2 ? (
        renderInningsCard(
          state.innings2,
          2,
          innings2Open,
          () => setInnings2Open(!innings2Open),
          state.teamBSquad
        )
      ) : (
        <div className="p-8 rounded-3xl bg-[#0D1B2A]/60 border border-[#D8AD55]/15 text-center space-y-2">
          <div className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
            2nd Innings Pending
          </div>
          <div className="text-sm font-semibold text-gray-300">
            {state.innings1.bowlingTeam} has not yet commenced their chase of {state.innings1.totalRuns + 1} runs.
          </div>
        </div>
      )}
    </div>
  );
}
