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
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
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

        if (regData?.tournamentsList !== undefined && Array.isArray(regData.tournamentsList)) {
          setTournamentsList(regData.tournamentsList);
          if (regData.tournamentsList.length > 0) {
            setSelectedTournament((prev) => {
              const exists = regData.tournamentsList.some((t: any) => t.slug === prev);
              return exists && prev ? prev : regData.tournamentsList[0].slug;
            });
          }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D8AD55]" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Franchise Squad Rosters
            </h1>
          </div>
          <p className="text-sm text-[#8793A5] mt-1 max-w-2xl">
            Dynamic franchise squads, owner deductions, purse allocations, and acquired player rosters synchronized with the live auction.
          </p>
        </div>

        {/* Tournament Selector: Only render if multiple tournaments exist */}
        {tournamentsList.length > 1 && (
          <div className="flex rounded-2xl bg-[#08111F] border border-[#D8AD55]/20 p-1 text-xs font-bold overflow-x-auto max-w-xs sm:max-w-md shadow-inner">
            {tournamentsList.map((t) => (
              <button
                key={t.slug}
                onClick={() => setSelectedTournament(t.slug)}
                className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedTournament === t.slug
                    ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md'
                    : 'text-[#8793A5] hover:text-white'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        {tournamentsList.length === 1 && (
          <div className="px-4 py-2 rounded-xl bg-[#08111F] border border-[#D8AD55]/20 text-[#F2D69A] text-xs font-bold shadow-inner">
            {tournamentsList[0].name}
          </div>
        )}
      </div>

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t) => {
            const isExpanded = expandedTeamId === t.id;
            return (
              <div
                key={t.id}
                className="rounded-3xl p-6 sm:p-7 bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 space-y-5 shadow-2xl transition-all hover:border-[#D8AD55]/50 hover:shadow-[#D8AD55]/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="w-12 h-12 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 flex items-center justify-center font-display font-black text-lg text-[#F2D69A] mb-2 shadow-inner">
                      {t.short}
                    </span>
                    <h3 className="font-display font-black text-2xl text-white tracking-tight">{t.name}</h3>
                    <div className="text-xs text-[#8793A5] mt-1">
                      Franchise Owner: <span className="text-[#F2D69A] font-semibold">{t.owner}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#8793A5] uppercase tracking-wider font-semibold">Squad Size</div>
                    <div className="font-display font-black text-2xl text-white mt-0.5">{t.squadSize} Players</div>
                    <div className="text-[11px] text-[#D8AD55] font-bold mt-1.5 px-2.5 py-0.5 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 inline-block">
                      ₹500 Blocked
                    </div>
                  </div>
                </div>

                {/* Leadership & Purse Metrics */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#08111F]/80 border border-[#D8AD55]/15 text-xs">
                  <div>
                    <span className="text-[#8793A5] block font-semibold">Captain:</span>
                    <span className="font-bold text-white truncate block mt-0.5">{t.captain}</span>
                  </div>
                  <div>
                    <span className="text-[#8793A5] block font-semibold">Vice-Captain:</span>
                    <span className="font-bold text-gray-300 truncate block mt-0.5">{t.viceCaptain}</span>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[#8793A5] block font-semibold">Purse Spent:</span>
                    <span className="font-display font-bold text-sm text-rose-400 mt-0.5 block">{t.budgetSpent}</span>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[#8793A5] block font-semibold">Purse Remaining:</span>
                    <span className="font-display font-black text-sm text-[#F2D69A] mt-0.5 block">{t.budgetLeft}</span>
                  </div>
                </div>

                {/* Squad Roster Accordion */}
                <div className="pt-1">
                  <button
                    onClick={() => setExpandedTeamId(isExpanded ? null : t.id)}
                    className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/20 text-xs font-bold text-[#F2D69A] transition-all cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Squad Roster' : `View Acquired Squad Players (${t.players.length})`}</span>
                    <ChevronRight className={`w-4 h-4 text-[#D8AD55] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 divide-y divide-white/5 rounded-2xl bg-[#08111F]/50 border border-[#D8AD55]/15 p-3 text-xs max-h-60 overflow-y-auto pr-2">
                      {t.players.length === 0 ? (
                        <div className="py-4 text-center text-[#8793A5] italic">
                          No players acquired in the auction yet.
                        </div>
                      ) : (
                        t.players.map((p, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white">{p.name}</span>
                              <span className="text-[11px] text-[#8793A5] ml-2">({p.role})</span>
                            </div>
                            <span className="font-display font-bold text-sm text-[#F2D69A]">{p.price}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl p-12 text-center space-y-4 bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 shadow-2xl">
          <Users className="w-12 h-12 text-[#D8AD55]/60 mx-auto" />
          <h3 className="font-display font-black text-2xl text-white">No Team Rosters Found</h3>
          <p className="text-sm text-[#8793A5] max-w-md mx-auto">
            Import franchises and conduct the live auction to populate squad rosters automatically.
          </p>
          <Link
            href="/auction"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 hover:brightness-110 transition-all cursor-pointer"
          >
            <Gavel className="w-4 h-4" />
            <span>Open Player Auction Room</span>
          </Link>
        </div>
      )}
    </div>
  );
}
