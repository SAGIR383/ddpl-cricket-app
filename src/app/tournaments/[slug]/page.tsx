'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Trophy, Calendar, Users, Gavel, Shield, Award, Settings, CheckCircle2, DollarSign } from 'lucide-react';

export default function TournamentDetailPage() {
  const params = useParams();
  const slug = (params.slug as string) || 'ddpl';
  const isDDPL = slug === 'ddpl';

  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [teams, setTeams] = useState<any[]>([]);
  const [rules, setRules] = useState<any>({
    basePurse: 10000,
    ownerBlockedPrice: 500,
    defaultPlayerBasePrice: 500,
    maxSquadSize: 11,
    minSquadSize: 7,
  });

  // Sync teams and financial state directly from auction data
  useEffect(() => {
    async function loadTournamentData() {
      try {
        const [rulesRes, auctionRes] = await Promise.all([
          fetch(`/api/admin/rules?tournament=${slug}`),
          fetch(`/api/auction/data?tournament=${slug}`),
        ]);

        if (rulesRes.ok) {
          const rData = await rulesRes.json();
          if (rData.rules) setRules(rData.rules);
        }

        if (auctionRes.ok) {
          const aData = await auctionRes.json();
          if (aData.data && aData.data.teams) {
            const soldTransactions = aData.data.soldTransactions || [];
            const mappedTeams = aData.data.teams.map((t: any) => {
              const teamSold = soldTransactions.filter((tx: any) => tx.team === t.name);
              const remainingPurse = t.allocated - t.spent;
              const cap = t.captain || (t.owner ? `${t.owner} (C)` : `${t.name} (C)`);
              return {
                name: t.name,
                short: t.short,
                owner: t.owner || 'Franchise Owner',
                captain: cap,
                viceCaptain: t.viceCaptain || 'To be assigned',
                squadCount: teamSold.length || t.playersBought || 1,
                allocated: t.allocated,
                spent: t.spent,
                left: `₹${remainingPurse.toLocaleString('en-IN')}`,
                players: teamSold,
              };
            });
            setTeams(mappedTeams);
          }
        }
      } catch (err) {
        console.error('Failed to load tournament data:', err);
      }
    }

    loadTournamentData();
  }, [slug, selectedSeason]);

  const matchOvers = rules.matchOvers || (isDDPL ? 10 : 12);

  const tournament = {
    name: isDDPL ? 'DDPL' : 'Game of RUN',
    fullName: isDDPL ? 'Desk to Dugout Premier League (DDPL)' : 'Game of RUN Corporate Championship',
    description: isDDPL
      ? `Desk to Dugout Premier League for corporate cricket enthusiasts, featuring ${matchOvers}-over innings, live player auctions, and ${teams.length} premier franchises.`
      : `The official annual corporate cricket championship, featuring ${matchOvers}-over innings, full team purse allocations, and corporate department rivalry.`,
    seasons: ['2026', '2025'],
    overs: matchOvers,
    status: selectedSeason === '2026' ? (teams.length > 0 ? 'Auction Live / In Progress' : 'Registrations Open') : 'Archive',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-cricket-card to-cricket-dark border border-cricket-border p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cricket-teal border border-blue-500/30 text-xs font-bold uppercase">
              <Trophy className="w-3.5 h-3.5" />
              Tournament Portal
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-[#070d1e]">
                <Image
                  src={isDDPL ? '/images/ddpl-logo.jpg' : '/images/game-of-run-logo.jpg'}
                  alt={`${tournament.name} Logo`}
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-wide">
                {tournament.name}
              </h1>
            </div>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              {tournament.description}
            </p>
          </div>

          {/* Season Selector */}
          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-xs font-semibold text-cricket-muted uppercase tracking-wider">
              Edition / Season
            </span>
            <div className="flex rounded-xl bg-cricket-dark border border-cricket-border p-1">
              {tournament.seasons.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedSeason(year)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSeason === year
                      ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/30 shadow'
                      : 'text-cricket-muted hover:text-white'
                  }`}
                >
                  Season {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Navigation Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/auction?tournament=${slug}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-gold/40 text-sm font-bold text-cricket-gold transition-all shadow-md"
        >
          <Gavel className="w-4 h-4 text-cricket-gold" />
          <span>Live Player Auction Room</span>
        </Link>
        <Link
          href={`/standings?tournament=${slug}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-sm font-bold text-white transition-all hover:border-cricket-teal/40"
        >
          <Trophy className="w-4 h-4 text-purple-400" />
          <span>Points Table &amp; Standings</span>
        </Link>
        <Link
          href={`/teams?tournament=${slug}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-sm font-bold text-white transition-all hover:border-cricket-teal/40"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Franchises &amp; Squads</span>
        </Link>
        <Link
          href={`/matches?tournament=${slug}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-sm font-bold text-white transition-all hover:border-cricket-teal/40"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Fixtures &amp; Schedule</span>
        </Link>
      </div>

      {/* Rules & Playing Conditions Banner */}
      <div className="glass-card p-6 border-l-4 border-l-cricket-teal space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-white">
            <Settings className="w-5 h-5 text-cricket-teal" />
            <span>Tournament Rules &amp; Purse Settings ({selectedSeason})</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
            {tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Overs / Innings</div>
            <div className="font-display font-bold text-lg text-white">{tournament.overs} Overs</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Max Bowler Quota</div>
            <div className="font-display font-bold text-lg text-emerald-400">
              {rules.maxBowlerOvers || Math.max(1, Math.ceil(tournament.overs / 5))} Ov / Bowler
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Franchise Purse</div>
            <div className="font-display font-bold text-lg text-cricket-gold">₹{rules.basePurse?.toLocaleString('en-IN') || '10,000'}</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Owner Blocked</div>
            <div className="font-display font-bold text-lg text-amber-400">₹{rules.ownerBlockedPrice || '500'}</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Squad Limits</div>
            <div className="font-display font-bold text-lg text-white">
              {rules.minSquadSize || 7} - {rules.maxSquadSize || 11}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Base Player Price</div>
            <div className="font-display font-bold text-lg text-white">₹{rules.defaultPlayerBasePrice || '500'}</div>
          </div>
          <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
            <div className="text-[11px] text-cricket-muted">Points / Win</div>
            <div className="font-display font-bold text-lg text-cricket-teal">{rules.pointsPerWin || 2} Pts (Tie {Math.max(1, Math.floor((rules.pointsPerWin || 2) / 2))})</div>
          </div>
        </div>
      </div>

      {/* Participating Franchises & Squad Leadership */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-display font-bold text-2xl text-white">
              Auction Franchises &amp; Current Squads ({teams.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-cricket-muted">
            Synced Live with Auction Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teams.map((t) => (
            <div key={t.short} className="glass-card p-5 space-y-4 border border-cricket-border">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 font-display font-bold text-base flex items-center justify-center">
                  {t.short}
                </span>
                <span className="text-xs font-semibold text-cricket-gold px-2 py-0.5 rounded bg-cricket-dark border border-cricket-border">
                  {t.squadCount} Players
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">{t.name}</h3>
                <div className="text-xs text-cricket-muted mt-0.5">Owner: <span className="text-gray-300 font-medium">{t.owner}</span></div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-cricket-border text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cricket-muted">Captain:</span>
                  <span className="font-bold text-white truncate max-w-[140px]">{t.captain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cricket-muted">Spent in Auction:</span>
                  <span className="font-semibold text-rose-300">₹{t.spent?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-cricket-muted">Remaining Purse:</span>
                  <span className="font-bold text-cricket-teal">{t.left}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
