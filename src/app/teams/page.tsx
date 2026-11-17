'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Shield, Trophy, DollarSign, ChevronRight, Award, Gavel, UserCheck, Download, FileSpreadsheet, CheckCircle2, Sparkles } from 'lucide-react';
import FranchiseSquadCardModal, { FranchiseSquadModalData } from '@/components/team/FranchiseSquadCardModal';

interface TeamRosterItem {
  id: string;
  name: string;
  short: string;
  group?: string;
  owner: string;
  captain: string;
  viceCaptain: string;
  squadSize: number;
  budgetAllocated: string;
  budgetSpent: string;
  budgetLeft: string;
  ownerBlockedPrice: number;
  maxSquadCap: number;
  color: string;
  players: { name: string; role: string; price: string; avatarUrl?: string | null }[];
}

import { fetchWithCache } from '@/lib/clientCache';

export default function TeamsPage() {
  const [selectedTournament, setSelectedTournament] = useState<string>('ddpl-3-0');
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
  const [teams, setTeams] = useState<TeamRosterItem[]>([]);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [selectedModalTeam, setSelectedModalTeam] = useState<TeamRosterItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const availableGroups = Array.from(new Set(teams.map((t) => t.group).filter(Boolean))) as string[];
  const filteredTeams = selectedGroup === 'all'
    ? teams
    : teams.filter((t) => t.group === selectedGroup);

  // Sync teams and roster dynamically from auction engine using fast client cache
  useEffect(() => {
    let isMounted = true;

    async function loadTeamsData() {
      if (teams.length === 0) setLoading(true);
      try {
        const activeSlug = (selectedTournament === 'ddpl' ? 'ddpl-3-0' : selectedTournament) || 'ddpl-3-0';
        const [regData, data, rulesData] = await Promise.all([
          fetchWithCache<any>(`/api/tournaments/register?tournament=${activeSlug}`, { ttlMs: 20000 }),
          fetchWithCache<any>(`/api/auction/data?tournament=${activeSlug}`, { ttlMs: 15000 }),
          fetchWithCache<any>(`/api/admin/rules?tournament=${activeSlug}`, { ttlMs: 15000 }),
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

        const globalOwnerBlockedPrice = Number(
          rulesData?.rules?.ownerBlockedPrice !== undefined
            ? rulesData.rules.ownerBlockedPrice
            : (data?.data?.rules?.ownerBlockedPrice !== undefined
                ? data.data.rules.ownerBlockedPrice
                : 100)
        );

        if (data?.success && data.data && data.data.teams) {
          const auctionTeams = data.data.teams;
          const soldTransactions = data.data.soldTransactions || [];

          // Map photos from registration pool
          const photoMap = new Map<string, string>();
          if (Array.isArray(regData?.registrations)) {
            for (const r of regData.registrations) {
              const photo = r.avatarUrl || r.photo;
              if (r.name && photo) {
                photoMap.set(r.name.trim().toLowerCase(), photo);
              }
            }
          }

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
            const remaining = (t.allocated || 10000) - (t.spent || 0);

            const rosterPlayers = teamPurchases.length > 0
              ? teamPurchases.map((tx: any) => ({
                  name: tx.player,
                  role: tx.role,
                  price: `₹${(tx.price || 0).toLocaleString('en-IN')}`,
                  avatarUrl: photoMap.get((tx.player || '').trim().toLowerCase()) || tx.avatarUrl || null,
                }))
              : (t.players || []).map((p: any) => ({
                  name: p.name,
                  role: p.role || 'Player',
                  price: p.price ? `₹${p.price.toLocaleString('en-IN')}` : 'Squad Roster',
                  avatarUrl: photoMap.get((p.name || '').trim().toLowerCase()) || p.avatarUrl || null,
                }));

            const captainName = t.captain || (t.owner ? `${t.owner} (C)` : `${t.name} (C)`);
            const viceCaptainName = t.viceCaptain || (rosterPlayers.length > 1 ? `${rosterPlayers[1]?.name} (VC)` : 'To be appointed');

            // Find individual team owner price if custom, otherwise use tournament rules
            const ownerPlayer = (t.players || []).find((p: any) =>
              p.role?.includes('Franchise Owner') ||
              (t.owner && p.name?.toLowerCase().trim() === t.owner.toLowerCase().trim())
            );

            const teamOwnerPrice = ownerPlayer?.price !== undefined
              ? Number(ownerPlayer.price)
              : (t.ownerBlockedPrice !== undefined
                  ? Number(t.ownerBlockedPrice)
                  : globalOwnerBlockedPrice);

            return {
              id: t.id || `team-${idx}`,
              name: t.name,
              short: t.short,
              group: t.group || undefined,
              owner: t.owner || 'Team Manager',
              captain: captainName,
              viceCaptain: viceCaptainName,
              squadSize: rosterPlayers.length || t.playersBought || 1,
              budgetAllocated: `₹${(t.allocated || 10000).toLocaleString('en-IN')}`,
              budgetSpent: `₹${(t.spent || 0).toLocaleString('en-IN')}`,
              budgetLeft: `₹${remaining.toLocaleString('en-IN')}`,
              ownerBlockedPrice: teamOwnerPrice,
              maxSquadCap: Number(rulesData?.rules?.maxSquadSize || 8),
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

  const handleExportCSV = () => {
    if (!teams || teams.length === 0) return;

    const headers = [
      'Franchise Name',
      'Short Code',
      'Group',
      'Manager / Owner',
      'Captain',
      'Vice-Captain',
      'Purse Allocated',
      'Purse Spent',
      'Purse Remaining',
      'Squad Count',
      'Player Name',
      'Role',
      'Sold Price',
      'Designation',
    ];

    const rows: string[][] = [];

    teams.forEach((t) => {
      if (!t.players || t.players.length === 0) {
        rows.push([
          `"${t.name}"`,
          `"${t.short}"`,
          `"${t.group || 'N/A'}"`,
          `"${t.owner}"`,
          `"${t.captain}"`,
          `"${t.viceCaptain}"`,
          `"${t.budgetAllocated}"`,
          `"${t.budgetSpent}"`,
          `"${t.budgetLeft}"`,
          `"${t.squadSize}/${t.maxSquadCap}"`,
          `"No players acquired"`,
          `""`,
          `""`,
          `""`,
        ]);
      } else {
        t.players.forEach((p) => {
          const isOwner =
            p.role?.includes('Franchise Owner') ||
            (t.owner && p.name?.toLowerCase().trim() === t.owner.toLowerCase().trim());
          const isCaptain = t.captain?.toLowerCase().includes(p.name?.toLowerCase().trim());
          let designation = 'Player';
          if (isOwner && isCaptain) designation = 'Owner & Captain';
          else if (isOwner) designation = 'Franchise Owner';
          else if (isCaptain) designation = 'Captain';

          rows.push([
            `"${t.name}"`,
            `"${t.short}"`,
            `"${t.group || 'N/A'}"`,
            `"${t.owner}"`,
            `"${t.captain}"`,
            `"${t.viceCaptain}"`,
            `"${t.budgetAllocated}"`,
            `"${t.budgetSpent}"`,
            `"${t.budgetLeft}"`,
            `"${t.squadSize}/${t.maxSquadCap}"`,
            `"${p.name}"`,
            `"${p.role}"`,
            `"${p.price}"`,
            `"${designation}"`,
          ]);
        });
      }
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DDPL_3_0_Franchise_Squad_Rosters_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
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

        {/* Action Controls: CSV Export & Tournament Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={teams.length === 0}
            className="btn-press px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download franchise squads & player roster list as CSV"
          >
            <Download className="w-4 h-4 text-[#08111F]" />
            <span>Export Squads (CSV)</span>
          </button>

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
      </div>

      {/* Group Filter Tabs (when groups exist) */}
      {availableGroups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#D8AD55]/15 pb-4">
          <span className="text-xs font-bold text-[#8793A5] uppercase tracking-wider mr-2">Filter Group:</span>
          <button
            type="button"
            onClick={() => setSelectedGroup('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedGroup === 'all'
                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black shadow-md'
                : 'bg-[#08111F] text-[#8793A5] border border-[#D8AD55]/20 hover:text-white'
            }`}
          >
            All Franchises ({teams.length})
          </button>
          {availableGroups.map((grp) => {
            const count = teams.filter((t) => t.group === grp).length;
            const isGroupA = grp === 'Group A';
            return (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedGroup === grp
                    ? isGroupA
                      ? 'bg-teal-500 text-cricket-dark font-black shadow-md'
                      : 'bg-amber-400 text-cricket-dark font-black shadow-md'
                    : 'bg-[#08111F] text-[#8793A5] border border-[#D8AD55]/20 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isGroupA ? 'bg-teal-300' : 'bg-amber-300'}`}></span>
                <span>{grp} ({count} Teams)</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeams.map((t) => {
            const isExpanded = expandedTeamId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedModalTeam(t)}
                className={`rounded-3xl p-6 sm:p-7 bg-[#0D1B2A]/90 backdrop-blur-md border space-y-5 shadow-2xl transition-all cursor-pointer hover:border-[#D8AD55]/60 hover:shadow-2xl hover:shadow-[#D8AD55]/10 ${
                  isExpanded ? 'border-[#D8AD55]/70 ring-1 ring-[#D8AD55]/40' : 'border-[#D8AD55]/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-12 h-12 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 flex items-center justify-center font-display font-black text-lg text-[#F2D69A] shadow-inner">
                        {t.short}
                      </span>
                      {t.group && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/30 text-xs font-bold">
                          {t.group}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-black text-2xl text-white tracking-tight">{t.name}</h3>
                    <div className="text-xs text-[#8793A5] mt-1">
                      Manager / Owner: <span className="text-[#F2D69A] font-semibold">{t.owner}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#8793A5] uppercase tracking-wider font-semibold">
                      Squad Size ({t.maxSquadCap} Cap)
                    </div>
                    <div className="font-display font-black text-2xl text-white mt-0.5">
                      {t.squadSize} / {t.maxSquadCap} Players
                    </div>
                    <div className="text-[11px] text-[#D8AD55] font-bold mt-1.5 px-2.5 py-0.5 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 inline-block">
                      ₹{t.ownerBlockedPrice.toLocaleString('en-IN')} Blocked
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

                {/* Actions: View Official Squad Card & Poster */}
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModalTeam(t);
                    }}
                    className="btn-press flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    title="Open official squad digital poster with player photos to download and share"
                  >
                    <Sparkles className="w-4 h-4 text-[#08111F]" />
                    <span>View Official Squad Card &amp; Poster</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTeamId(isExpanded ? null : t.id);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/20 text-xs font-bold text-[#F2D69A] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide' : 'Quick View'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-[#D8AD55] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {/* Inline Roster Expansion (Optional) */}
                {isExpanded && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 divide-y divide-white/5 rounded-2xl bg-[#08111F]/90 border border-[#D8AD55]/20 p-4 text-xs space-y-2 max-h-96 overflow-y-auto pr-2 shadow-inner"
                  >
                    <div className="flex items-center justify-between pb-2 text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
                      <span>Squad Roster ({t.players.length} Players)</span>
                      <span>Acquisition Price</span>
                    </div>
                    {t.players.length === 0 ? (
                      <div className="py-4 text-center text-[#8793A5] italic">
                        No players acquired in the auction yet.
                      </div>
                    ) : (
                      t.players.map((p, idx) => {
                        const isOwner =
                          p.role?.includes('Franchise Owner') ||
                          (t.owner && p.name?.toLowerCase().trim() === t.owner.toLowerCase().trim());
                        const isCaptain = t.captain?.toLowerCase().includes(p.name?.toLowerCase().trim());

                        return (
                          <div
                            key={idx}
                            className="py-2.5 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-[#0D1B2A] border border-[#D8AD55]/30 text-[#D8AD55] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-white text-sm">{p.name}</span>
                                  {isOwner && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/40 uppercase">
                                      Owner
                                    </span>
                                  )}
                                  {isCaptain && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 uppercase">
                                      Captain
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-[#8793A5]">{p.role}</span>
                              </div>
                            </div>
                            <span className="font-display font-black text-sm text-[#F2D69A] bg-[#0D1B2A] px-2.5 py-1 rounded-lg border border-[#D8AD55]/20 shrink-0">
                              {p.price}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
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

      {/* Official Franchise Squad Digital Card Pop-up Modal */}
      <FranchiseSquadCardModal
        isOpen={!!selectedModalTeam}
        onClose={() => setSelectedModalTeam(null)}
        team={selectedModalTeam}
        tournamentName={
          tournamentsList.find((x) => x.slug === selectedTournament)?.name || 'DDPL 3.0'
        }
      />
    </div>
  );
}
