'use client';

import React from 'react';
import {
  Info,
  Shield,
  MapPin,
  Calendar,
  Clock,
  Award,
  Layers,
  Sparkles,
  UserCheck,
  Flag,
} from 'lucide-react';
import { MatchLiveState } from '@/types/match.types';

interface InfoTabProps {
  state: MatchLiveState;
}

export function InfoTab({ state }: InfoTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. MATCH DETAILS CARD */}
      <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#D8AD55]" />
            <h3 className="font-display font-bold text-sm text-[#F2D69A]">
              Match Details & Tournament Specifications
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/30 uppercase">
            Official Fixture
          </span>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#08111F]/70 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Tournament & Season</span>
            </span>
            <div className="font-display font-bold text-white text-sm">
              {state.tournament.toUpperCase()} Premier League (2026)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#08111F]/70 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Stage & Format</span>
            </span>
            <div className="font-display font-bold text-white text-sm">
              {state.stage} {state.group ? `(${state.group})` : '• Round Robin'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#08111F]/70 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Venue Ground</span>
            </span>
            <div className="font-display font-bold text-white text-sm">
              {state.venue || 'Arena Ground 1'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#08111F]/70 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Match Overs & Quota</span>
            </span>
            <div className="font-display font-bold text-white text-sm">
              {state.rules.matchOvers} Overs per Side (Max {state.rules.maxBowlerOvers} Ov/Bowler)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#08111F]/70 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Match Schedule</span>
            </span>
            <div className="font-display font-bold text-white text-sm">
              {state.matchDate || 'Official League Day'} • {state.matchTime || '10:00 AM'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#08111F]/70 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Tournament Rules</span>
            </span>
            <div className="text-xs text-gray-200">
              Wides: <strong className="text-[#F2D69A]">{state.rules.wideBallPenalty}</strong> • No-ball:{' '}
              <strong className="text-[#F2D69A]">{state.rules.noBallPenalty}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MATCH OFFICIALS CARD */}
      <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-bold text-sm text-[#F2D69A]">
              Match Officials & Referee Roster
            </h3>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Official Scorer */}
          <div className="p-4 rounded-2xl bg-[#08111F]/80 border border-[#D8AD55]/20 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/40 flex items-center justify-center font-display font-black text-sm text-[#F2D69A]">
              SC
            </div>
            <div>
              <span className="text-[10px] font-black text-[#D8AD55] uppercase tracking-wider block">
                Official Match Scorer
              </span>
              <div className="font-bold text-white text-sm">
                {state.officials?.scorerName || 'Tournament Ref'}
              </div>
              <div className="text-[11px] text-[#8793A5]">Verified Scorer Console</div>
            </div>
          </div>

          {/* Umpires */}
          <div className="p-4 rounded-2xl bg-[#08111F]/80 border border-white/5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0D1B2A] border border-white/10 flex items-center justify-center font-display font-black text-sm text-gray-300">
              UM
            </div>
            <div>
              <span className="text-[10px] font-black text-[#8793A5] uppercase tracking-wider block">
                On-Field Umpires
              </span>
              <div className="font-bold text-white text-sm">
                {state.officials?.umpires?.join(', ') || 'Field Umpire 1, Field Umpire 2'}
              </div>
              <div className="text-[11px] text-[#8793A5]">Accredited Officials</div>
            </div>
          </div>

          {/* Tournament Technical Director */}
          <div className="p-4 rounded-2xl bg-[#08111F]/80 border border-white/5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0D1B2A] border border-white/10 flex items-center justify-center font-display font-black text-sm text-gray-300">
              TD
            </div>
            <div>
              <span className="text-[10px] font-black text-[#8793A5] uppercase tracking-wider block">
                Tournament Director
              </span>
              <div className="font-bold text-white text-sm">
                {state.officials?.referee || 'Technical Committee'}
              </div>
              <div className="text-[11px] text-[#8793A5]">Rules & Disciplinary Panel</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MATCH NOTES & MILESTONES LOG */}
      <div className="rounded-3xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-xl">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#08111F] to-[#111D2D] border-b border-[#D8AD55]/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D8AD55]" />
            <h3 className="font-display font-bold text-sm text-[#F2D69A]">
              Match Notes & Event Milestones
            </h3>
          </div>
          <span className="text-xs text-[#8793A5]">
            {state.matchNotes?.length || 0} event(s) logged
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          {(!state.matchNotes || state.matchNotes.length === 0) ? (
            <div className="text-xs text-[#8793A5] italic py-3 text-center">
              No milestones recorded yet. Match notes will automatically log toss, fifties, innings breaks, and results.
            </div>
          ) : (
            state.matchNotes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-2xl bg-[#08111F]/70 border border-white/5 flex items-start gap-3 hover:bg-[#111D2D]/60 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#D8AD55] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium leading-relaxed">
                    {note.text}
                  </div>
                  <div className="text-[10px] text-[#8793A5] mt-0.5">
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
