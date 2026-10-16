'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Shield, Trophy, DollarSign, ChevronRight, Award, Gavel, UserCheck } from 'lucide-react';

interface TeamRosterItem {
  id: string;
  name: string;
  short: string;
  owner: string;
  captain: string;
  viceCaptain: string;
  squadSize: number;
  budgetAllocated: string;
  budgetSpent: string;
  budgetLeft: string;
  color: string;
  players: { name: string; role: string; price: string }[];
}

import { fetchWithCache } from '@/lib/clientCache';

export default function TeamsPage() {
  const [selectedTournament, setSelectedTournament] = useState<string>('ddpl');
  const [tournamentsList, setTournamentsList] = useState<any[]>([
    { slug: 'ddpl', name: 'DDPL', season: '2026' },
    { slug: 'game-of-run', name: 'Game of RUN', season: '2026' },
  ]);
  const [teams, setTeams] = useState<TeamRosterItem[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync teams and roster dynamically from auction engine using fast client cache
  useEffect(() => {
    let isMounted = true;

    async function loadTeamsData() {
      if (teams.length === 0) setLoading(true);
      try {
        const [regData, data] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 30000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${selectedTournament}`, { ttlMs: 10000 }),
        ]);

        if (!isMounted) return;

        if (regData?.tournamentsList && regData.tournamentsList.length > 0) {
          setTournamentsList(regData.tournamentsList);
        }

        if (data?.success && data.data && data.data.teams) {
          const auctionTeams = data.data.teams;
          const soldTransactions = data.data.soldTransactions || [];

          const colors = [
            'border-purple-500',
            'border-red-500',
            'border-blue-500',
            'border-amber-500',
            'border-emerald-500',
            'border-cyan-500',
          ];

          const mapped: TeamRosterItem[] = auctionTeams.map((t: any, idx: number) => {
            const teamPurchases = soldTransactions.filter((tx: any) => tx.team === t.name);
            const remaining = t.allocated - t.spent;

            const rosterPlayers = teamPurchases.map((tx: any) => ({
              name: tx.player,
              role: tx.role,
              price: `₹${tx.price.toLocaleString('en-IN')}`,
            }));

            const captainName = t.captain || (t.owner ? `${t.owner} (C)` : `${t.name} (C)`);
            const viceCaptainName = t.viceCaptain || (teamPurchases.length > 1 ? `${teamPurchases[0].player} (VC)` : 'To be appointed');

            return {
              id: t.id || `team-${idx}`,
              name: t.name,
              short: t.short,
              owner: t.owner || 'Franchise Owner',
              captain: captainName,
              viceCaptain: viceCaptainName,
              squadSize: rosterPlayers.length || t.playersBought || 1,
              budgetAllocated: `₹${t.allocated.toLocaleString('en-IN')}`,
              budgetSpent: `₹${t.spent.toLocaleString('en-IN')}`,
              budgetLeft: `₹${remaining.toLocaleString('en-IN')}`,
              color: colors[idx % colors.length],
              players: rosterPlayers,
            };
          });

          setTeams(mapped);
          if (mapped.length > 0) {
            setExpandedTeamId(mapped[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load teams data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamsData();
  }, [selectedTournament]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cricket-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Teams &amp; Squad Rosters
            </h1>
          </div>
          <p className="text-sm text-cricket-muted mt-1">
            Dynamic franchise squads, owner deductions, purse allocations, and acquired player rosters synchronized with live auction.
          </p>
        </div>

        <div className="flex rounded-xl bg-cricket-dark border border-cricket-border p-1 text-xs font-bold overflow-x-auto max-w-xs sm:max-w-md">
          {tournamentsList.map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedTournament(t.slug)}
              className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedTournament === t.slug
                  ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                  : 'text-cricket-muted hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t) => {
            const isExpanded = expandedTeamId === t.id;
            return (
              <div
                key={t.id}
                className={`glass-card p-6 border-t-4 ${t.color} space-y-5 shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="w-10 h-10 rounded-xl bg-cricket-dark border border-cricket-border flex items-center justify-center font-display font-bold text-lg text-cricket-teal mb-2">
                      {t.short}
                    </span>
                    <h3 className="font-display font-black text-2xl text-white">{t.name}</h3>
                    <div className="text-xs text-cricket-muted mt-0.5">Franchise Owner: <span className="text-gray-300 font-semibold">{t.owner}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-cricket-muted">Squad Size</div>
                    <div className="font-display font-black text-2xl text-white">{t.squadSize} Players</div>
                    <div className="text-[11px] text-amber-400 font-bold mt-1">₹500 Owner Retained</div>
                  </div>
                </div>

                {/* Leadership & Purse Metrics */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-xs">
                  <div>
                    <span className="text-cricket-muted block">Captain:</span>
                    <span className="font-bold text-white truncate block">{t.captain}</span>
                  </div>
                  <div>
                    <span className="text-cricket-muted block">Vice-Captain:</span>
                    <span className="font-bold text-gray-300 truncate block">{t.viceCaptain}</span>
                  </div>
                  <div className="pt-1 border-t border-cricket-border/50">
                    <span className="text-cricket-muted block">Purse Spent:</span>
                    <span className="font-semibold text-rose-400">{t.budgetSpent}</span>
                  </div>
                  <div className="pt-1 border-t border-cricket-border/50">
                    <span className="text-cricket-muted block">Purse Left:</span>
                    <span className="font-bold text-cricket-teal">{t.budgetLeft}</span>
                  </div>
                </div>

                {/* Squad Roster Accordion */}
                <div>
                  <button
                    onClick={() => setExpandedTeamId(isExpanded ? null : t.id)}
                    className="w-full flex items-center justify-between py-2 text-xs font-bold text-cricket-teal hover:underline"
                  >
                    <span>{isExpanded ? 'Hide Squad Roster' : `View Acquired Squad Players (${t.players.length})`}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-2 divide-y divide-cricket-border border-t border-cricket-border text-xs max-h-60 overflow-y-auto pr-1">
                      {t.players.map((p, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="text-[11px] text-cricket-muted ml-2">({p.role})</span>
                          </div>
                          <span className="font-display font-bold text-sm text-cricket-gold">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4 border border-cricket-border">
          <Users className="w-12 h-12 text-cricket-muted mx-auto" />
          <h3 className="font-display font-black text-2xl text-white">No Team Rosters Found</h3>
          <p className="text-sm text-cricket-muted max-w-md mx-auto">
            Import franchises and conduct the live auction to populate squad rosters automatically.
          </p>
          <Link
            href="/auction"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cricket-teal text-cricket-dark font-display font-bold text-sm shadow transition-all"
          >
            <Gavel className="w-4 h-4" />
            <span>Open Player Auction Room</span>
          </Link>
        </div>
      )}
    </div>
  );
}
