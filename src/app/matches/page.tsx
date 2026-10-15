'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Activity, ChevronRight, Trophy, Clock, Gavel, MapPin, Sparkles } from 'lucide-react';

interface MatchDisplay {
  id: string;
  matchNumber: number;
  tournament: string;
  stage?: string;
  group?: string | null;
  title: string;
  teamA: { name: string; short: string; score: string; overs: string };
  teamB: { name: string; short: string; score: string; overs: string };
  matchDate?: string | null;
  matchTime?: string | null;
  status: 'upcoming' | 'live' | 'completed' | 'postponed' | 'abandoned';
  summary: string;
  venue: string;
}

export default function MatchesPage() {
  const [selectedTournament, setSelectedTournament] = useState<'ddpl' | 'game-of-run'>('ddpl');
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [tournamentStartDate, setTournamentStartDate] = useState<string | null>(null);
  const [tournamentEndDate, setTournamentEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch official tournament schedule & fixtures from /api/matches
  useEffect(() => {
    async function loadMatchesFromApi() {
      setLoading(true);
      try {
        const [matchesRes, rulesRes, auctionRes] = await Promise.all([
          fetch(`/api/matches?tournament=${selectedTournament}`),
          fetch(`/api/admin/rules?tournament=${selectedTournament}`),
          fetch(`/api/auction/data?tournament=${selectedTournament}`),
        ]);

        let tournamentOvers = selectedTournament === 'ddpl' ? 10 : 12;
        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          if (rulesData.success && rulesData.rules?.matchOvers) {
            tournamentOvers = rulesData.rules.matchOvers;
          }
        }

        let loadedOfficial = false;
        if (matchesRes.ok) {
          const mData = await matchesRes.json();
          if (mData.schedule) {
            setTournamentStartDate(mData.schedule.startDate || null);
            setTournamentEndDate(mData.schedule.endDate || null);

            if (mData.schedule.matches && mData.schedule.matches.length > 0) {
              loadedOfficial = true;
              setMatches(
                mData.schedule.matches.map((m: any) => ({
                  id: m.id,
                  matchNumber: m.matchNumber,
                  tournament: selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN 2026',
                  stage: m.stage || 'League',
                  group: m.group || null,
                  title: m.title || `Match ${m.matchNumber}: ${m.teamA?.short || m.teamA} vs ${m.teamB?.short || m.teamB}`,
                  teamA: {
                    name: m.teamA?.name || m.teamA,
                    short: m.teamA?.short || (m.teamA?.name || m.teamA || '').slice(0, 3).toUpperCase(),
                    score: m.teamA?.score || 'Yet to bat',
                    overs: m.teamA?.overs || '',
                  },
                  teamB: {
                    name: m.teamB?.name || m.teamB,
                    short: m.teamB?.short || (m.teamB?.name || m.teamB || '').slice(0, 3).toUpperCase(),
                    score: m.teamB?.score || 'Yet to bat',
                    overs: m.teamB?.overs || '',
                  },
                  matchDate: m.matchDate || null,
                  matchTime: m.matchTime || '10:00 AM',
                  status: m.status || 'upcoming',
                  summary: m.summary || `${tournamentOvers} Overs scheduled fixture between ${m.teamA?.name || m.teamA} and ${m.teamB?.name || m.teamB}.`,
                  venue: m.venue || 'Arena Ground 1',
                }))
              );
            }
          }
        }

        // Fallback: If no schedule has been generated yet, pair from current auction franchises
        if (!loadedOfficial) {
          setTournamentStartDate(null);
          setTournamentEndDate(null);
          const data = await auctionRes.json();
          if (data.success && data.data && data.data.teams && data.data.teams.length >= 2) {
            const auctionTeams = data.data.teams;
            const generated: MatchDisplay[] = [];
            let matchNum = 1;

            for (let i = 0; i < auctionTeams.length; i++) {
              for (let j = i + 1; j < auctionTeams.length; j++) {
                generated.push({
                  id: `match-${matchNum}`,
                  matchNumber: matchNum,
                  tournament: selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN 2026',
                  stage: 'League',
                  title: `Match ${matchNum}: ${auctionTeams[i].short} vs ${auctionTeams[j].short} (${tournamentOvers} Ov)`,
                  teamA: {
                    name: auctionTeams[i].name,
                    short: auctionTeams[i].short,
                    score: 'Yet to bat',
                    overs: '',
                  },
                  teamB: {
                    name: auctionTeams[j].name,
                    short: auctionTeams[j].short,
                    score: 'Yet to bat',
                    overs: '',
                  },
                  matchDate: null,
                  matchTime: '10:00 AM',
                  status: 'upcoming',
                  summary: `${tournamentOvers} Overs scheduled clash between ${auctionTeams[i].name} and ${auctionTeams[j].name}.`,
                  venue: 'Arena Ground 1',
                });
                matchNum++;
              }
            }
            setMatches(generated);
          } else {
            setMatches([]);
          }
        }
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMatchesFromApi();
  }, [selectedTournament]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cricket-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Match Center &amp; Fixtures
            </h1>
          </div>
          <p className="text-sm text-cricket-muted mt-1">
            Tournament fixtures dynamically paired from auction franchises with ball-by-ball scoring controls.
          </p>
        </div>

        {/* Tournament Switcher */}
        <div className="flex rounded-xl bg-cricket-dark border border-cricket-border p-1 text-xs font-bold">
          <button
            onClick={() => setSelectedTournament('ddpl')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTournament === 'ddpl'
                ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                : 'text-cricket-muted hover:text-white'
            }`}
          >
            DDPL 2026 Fixtures
          </button>
          <button
            onClick={() => setSelectedTournament('game-of-run')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTournament === 'game-of-run'
                ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                : 'text-cricket-muted hover:text-white'
            }`}
          >
            Game of RUN Fixtures
          </button>
        </div>
      </div>

      {/* Tournament Dates & Duration Banner (if set by Super Admin) */}
      {tournamentStartDate && tournamentEndDate && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-cricket-card to-cricket-dark border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Official Tournament Schedule Window
              </div>
              <div className="font-display font-extrabold text-lg text-white">
                {selectedTournament === 'ddpl' ? 'DDPL 2026' : 'Game of RUN 2026'}: {tournamentStartDate} to {tournamentEndDate}
              </div>
            </div>
          </div>
          <span className="text-xs text-cricket-muted font-medium">
            Verified by Tournament Super Admin
          </span>
        </div>
      )}

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((m) => {
            const isPlayoff = m.stage && m.stage !== 'League' && m.stage !== 'Group Stage';

            return (
              <div
                key={m.id}
                className={`glass-card p-6 border transition-all ${
                  m.status === 'live'
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : isPlayoff
                    ? 'border-amber-500/40 bg-gradient-to-br from-cricket-card to-amber-950/10 hover:border-amber-400/60'
                    : 'border-cricket-border hover:border-cricket-teal/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Teams & Scores */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
                      <span className="text-xs font-bold text-cricket-gold uppercase">
                        {m.tournament}
                      </span>

                      {/* Stage Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                        isPlayoff
                          ? 'bg-amber-500/20 text-cricket-gold border-amber-500/50 shadow-sm'
                          : 'bg-cricket-dark text-cricket-teal border-cricket-teal/30'
                      }`}>
                        {m.stage || 'League'}
                      </span>

                      {m.group && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                          {m.group}
                        </span>
                      )}

                      <span className="text-xs text-cricket-muted font-medium">{m.title}</span>

                      {m.status === 'live' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 animate-pulse">
                          ● Live Now
                        </span>
                      ) : m.status === 'completed' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-cricket-dark text-cricket-muted text-xs font-bold border border-cricket-border">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Team A */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-cricket-dark/80 border border-cricket-border">
                        <div>
                          <span className="font-display font-bold text-lg text-white">
                            {m.teamA.name}
                          </span>
                          <div className="text-xs text-cricket-muted">{m.teamA.short}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-black text-xl text-cricket-teal">
                            {m.teamA.score}
                          </span>
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-cricket-dark/80 border border-cricket-border">
                        <div>
                          <span className="font-display font-bold text-lg text-white">
                            {m.teamB.name}
                          </span>
                          <div className="text-xs text-cricket-muted">{m.teamB.short}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-black text-xl text-gray-300">
                            {m.teamB.score}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Date, Time & Venue */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-cricket-muted">
                      {m.matchDate && (
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          {m.matchDate}
                        </span>
                      )}

                      {m.matchTime && (
                        <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {m.matchTime}
                        </span>
                      )}

                      <span className="flex items-center gap-1.5 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {m.venue}
                      </span>
                    </div>

                    <div className="text-xs text-cricket-muted">
                      <span className="font-medium text-gray-300">{m.summary}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex md:flex-col justify-end gap-2 shrink-0">
                    <Link
                      href={`/matches/${m.id}`}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow transition-all bg-cricket-card hover:bg-cricket-cardHover text-white border border-cricket-border hover:border-cricket-teal/40 hover:scale-105"
                    >
                      <Activity className="w-4 h-4 text-cricket-teal" />
                      <span>Open Live Scorer Console</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4 border border-cricket-border">
          <Calendar className="w-12 h-12 text-cricket-muted mx-auto" />
          <h3 className="font-display font-black text-2xl text-white">No Match Fixtures Generated Yet</h3>
          <p className="text-sm text-cricket-muted max-w-md mx-auto">
            Fixtures are paired automatically from auction franchises. Complete the auction or import squads to schedule tournament matches.
          </p>
          <Link
            href="/auction"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cricket-teal text-cricket-dark font-display font-bold text-sm shadow transition-all"
          >
            <Gavel className="w-4 h-4" />
            <span>Go to Live Auction</span>
          </Link>
        </div>
      )}
    </div>
  );
}
