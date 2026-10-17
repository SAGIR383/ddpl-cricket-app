'use client';

import React, { useState } from 'react';
import { Users, ArrowUpDown, UserCheck, Shield, Award } from 'lucide-react';
import { MatchLiveState, SquadPlayer } from '@/types/match.types';

interface SquadsTabProps {
  state: MatchLiveState;
}

export function SquadsTab({ state }: SquadsTabProps) {
  const [sortOrder, setSortOrder] = useState<'batting_order' | 'alphabetical'>('batting_order');

  const teamAName = state.innings1.battingTeam;
  const teamAShort = state.innings1.battingTeamShort;
  const teamBName = state.innings1.bowlingTeam;
  const teamBShort = state.innings1.bowlingTeamShort;

  // Build team A roster (starting with batters that appeared in the innings, followed by remaining squad members)
  const buildTeamRoster = (
    squad: SquadPlayer[] = [],
    battersInInnings: { name: string; runs?: number; balls?: number; isOut?: boolean }[] = []
  ) => {
    const list: Array<SquadPlayer & { runs?: number; balls?: number; hasBatted: boolean }> = [];
    const addedNames = new Set<string>();

    // 1. Add batters who have batted or are batting first
    battersInInnings.forEach((b) => {
      const matchSquad = squad.find((s) => s.name?.toLowerCase() === b.name?.toLowerCase());
      addedNames.add(b.name?.toLowerCase());
      list.push({
        id: matchSquad?.id || `p-${b.name}`,
        name: b.name,
        role: matchSquad?.role || 'Batter',
        isCaptain: matchSquad?.isCaptain,
        isWicketKeeper: matchSquad?.isWicketKeeper,
        avatar: matchSquad?.avatar,
        runs: b.runs,
        balls: b.balls,
        hasBatted: true,
      });
    });

    // 2. Add remaining squad members
    squad.forEach((s) => {
      if (!addedNames.has(s.name?.toLowerCase())) {
        list.push({
          ...s,
          hasBatted: false,
        });
      }
    });

    // Apply sorting
    if (sortOrder === 'alphabetical') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  };

  const teamARoster = buildTeamRoster(
    state.teamASquad,
    state.innings1.batters
  );

  const teamBRoster = buildTeamRoster(
    state.teamBSquad,
    state.innings2?.batters || []
  );

  const renderRosterColumn = (
    teamName: string,
    teamShort: string,
    roster: Array<SquadPlayer & { runs?: number; balls?: number; hasBatted: boolean }>
  ) => {
    return (
      <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl flex-1 flex flex-col">
        {/* Team Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#08111F] border border-[#D8AD55]/40 flex items-center justify-center font-display font-black text-sm text-[#F2D69A]">
              {teamShort.slice(0, 3)}
            </div>
            <div>
              <h4 className="font-display font-bold text-white text-base">
                {teamName}
              </h4>
              <div className="text-[11px] text-[#8793A5]">
                {roster.length} Players Registered
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#08111F] border border-white/10 text-[10px] font-black text-[#D8AD55] uppercase">
            Playing XI
          </span>
        </div>

        {/* Players List */}
        <div className="divide-y divide-white/5 p-2 sm:p-3 flex-1">
          {roster.map((player, idx) => {
            const role = player.role || 'Player';
            const isCaptain = player.isCaptain || player.role?.toLowerCase().includes('captain');
            const isKeeper = player.isWicketKeeper || player.role?.toLowerCase().includes('keeper') || player.role?.toLowerCase().includes('wk');

            return (
              <div
                key={player.id || idx}
                className="p-3 sm:px-4 rounded-2xl flex items-center justify-between gap-3 hover:bg-[#111D2D]/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Player Avatar / Number */}
                  <div className="w-9 h-9 rounded-xl bg-[#08111F] border border-white/10 flex items-center justify-center font-display font-bold text-xs text-[#F2D69A]">
                    {player.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-sm">
                        {player.name}
                      </span>
                      {isCaptain && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40">
                          (c)
                        </span>
                      )}
                      {isKeeper && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          (wk)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8793A5] capitalize">
                      {role}
                    </div>
                  </div>
                </div>

                {/* Match Performance or Status */}
                <div className="text-right">
                  {player.hasBatted && player.runs !== undefined ? (
                    <div>
                      <div className="font-display font-bold text-sm text-[#F2D69A]">
                        {player.runs} <span className="text-[10px] text-[#8793A5]">({player.balls}b)</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        Batted
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#8793A5] italic">
                      Yet to bat
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D8AD55]" />
          <h3 className="font-display font-black text-xl text-white">
            Official Dual Squads
          </h3>
        </div>

        {/* Sort Toggle */}
        <div className="flex items-center gap-1.5 bg-[#08111F] p-1 rounded-2xl border border-white/5 text-xs">
          <button
            onClick={() => setSortOrder('batting_order')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              sortOrder === 'batting_order'
                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md shadow-[#D8AD55]/20'
                : 'text-[#8793A5] hover:text-white'
            }`}
          >
            Batting Order
          </button>
          <button
            onClick={() => setSortOrder('alphabetical')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              sortOrder === 'alphabetical'
                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md shadow-[#D8AD55]/20'
                : 'text-[#8793A5] hover:text-white'
            }`}
          >
            A to Z
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Squad Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderRosterColumn(teamAName, teamAShort, teamARoster)}
        {renderRosterColumn(teamBName, teamBShort, teamBRoster)}
      </div>
    </div>
  );
}
