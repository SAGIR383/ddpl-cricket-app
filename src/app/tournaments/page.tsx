'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Calendar, Users, ChevronRight, Award, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TournamentMeta {
  id: string;
  name: string;
  logo: string;
  fullName: string;
  tagline: string;
  activeSeason: string;
  totalSeasons: number;
  teamsCount: number;
  overs: number;
  bannerColor: string;
  badgeColor: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}

import { fetchWithCache } from '@/lib/clientCache';

export default function TournamentsPage() {
  const { isSuperAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentMeta[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { label: '● Registration Open', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/20 animate-pulse' };
      case 'upcoming':
        return { label: 'Upcoming Tournament', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'auction':
        return { label: '● Auction Live', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse' };
      case 'ongoing':
        return { label: '● Tournament Ongoing', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse' };
      default:
        return { label: 'Upcoming', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadTournamentsData() {
      if (tournaments.length === 0) setLoading(true);
      try {
        const [regData, aData, rulesData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 30000 }),
          fetchWithCache<any>('/api/auction/data?tournament=ddpl', { ttlMs: 15000 }),
          fetchWithCache<any>('/api/admin/rules?tournament=ddpl', { ttlMs: 30000 }),
        ]);

        if (!isMounted) return;

        let configsList: any[] = [];
        if (regData?.tournamentsList && regData.tournamentsList.length > 0) {
          configsList = regData.tournamentsList;
        }

        if (configsList.length === 0) {
          configsList = [
            {
              slug: 'ddpl',
              name: 'DDPL',
              fullName: 'Desk to Dugout Premier League (DDPL)',
              tagline: 'High-octane inter-departmental corporate cricket tournament',
              season: '2026',
              totalSeasons: 2,
              overs: 10,
              bannerColor: 'from-blue-900 via-indigo-950 to-cricket-dark',
              logo: '/images/ddpl-logo.jpg',
              status: 'open',
            },
            {
              slug: 'game-of-run',
              name: 'Game of RUN',
              fullName: 'Game of RUN Championship',
              tagline: 'The official annual corporate cricket championship',
              season: '2026',
              totalSeasons: 2,
              overs: 12,
              bannerColor: 'from-amber-950 via-orange-950 to-cricket-dark',
              logo: '/images/game-of-run-logo.jpg',
              status: 'upcoming',
            },
          ];
        }

        const allAuctionTourneys = aData?.allTournaments || {};
        const allRulesTourneys = rulesData?.tournaments || {};

        const populatedTournaments: TournamentMeta[] = configsList.map((cfg: any) => {
          const slug = cfg.slug || 'ddpl';
          const tourneyAuctionData = allAuctionTourneys[slug] || (slug === 'ddpl' ? aData?.data : null);
          const teamsCount = tourneyAuctionData?.teams?.length || 0;
          const tourneyRules = allRulesTourneys[slug];
          const overs = tourneyRules?.matchOvers || cfg.overs || (slug === 'game-of-run' ? 12 : 10);
          const startDate = cfg.startDate || null;
          const endDate = cfg.endDate || null;

          const badge = getStatusBadge(cfg.status || 'upcoming');
          const logo = cfg.logo || (slug === 'game-of-run' ? '/images/game-of-run-logo.jpg' : '/images/ddpl-logo.jpg');
          const bannerColor = cfg.bannerColor || 'from-blue-900 via-indigo-950 to-cricket-dark';

            return {
              id: slug,
              name: cfg.name || slug.toUpperCase(),
              logo,
              fullName: cfg.fullName || `${cfg.name || slug.toUpperCase()} Championship`,
              tagline: cfg.tagline || 'Official corporate cricket tournament',
              activeSeason: cfg.season || '2026',
              totalSeasons: cfg.totalSeasons || 1,
              teamsCount,
              overs,
              bannerColor,
              badgeColor: badge.color,
              status: badge.label,
              startDate,
              endDate,
            };
          });

        setTournaments(populatedTournaments);
      } catch (err) {
        console.error('Failed to load tournaments directory data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTournamentsData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cricket-border pb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Tournaments Directory
          </h1>
          <p className="text-sm text-cricket-muted mt-1">
            Browse all official corporate cricket tournaments, active seasons, and historical archives.
          </p>
        </div>

        {isSuperAdmin && (
          <Link
            href="/admin"
            className="btn-press shimmer-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-cricket-dark font-display font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Tournament</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="glass-card card-press overflow-hidden flex flex-col justify-between border border-cricket-border"
          >
            {/* Tournament Top Banner */}
            <div className={`p-6 sm:p-8 bg-gradient-to-br ${t.bannerColor} border-b border-cricket-border space-y-4`}>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${t.badgeColor}`}>
                  {t.status}
                </span>
                <span className="text-xs text-cricket-muted font-bold">
                  Season {t.activeSeason}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl shrink-0 bg-[#070d1e]">
                  <Image
                    src={t.logo}
                    alt={`${t.name} Logo`}
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
                    {t.name}
                  </h2>
                  <div className="text-sm font-semibold text-gray-300 mt-0.5">{t.fullName}</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{t.tagline}</p>
            </div>

            {/* Quick Metrics */}
            <div className="p-6 space-y-5">
              {t.startDate && t.endDate && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tournament Schedule: {t.startDate} to {t.endDate}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
                  <div className="text-[11px] text-cricket-muted font-semibold">Match Overs</div>
                  <div className="font-display font-bold text-lg text-white">{t.overs} Overs</div>
                </div>
                <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
                  <div className="text-[11px] text-cricket-muted font-semibold">Teams</div>
                  <div className="font-display font-bold text-lg text-white">{t.teamsCount} Franchises</div>
                </div>
                <div className="p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border">
                  <div className="text-[11px] text-cricket-muted font-semibold">Editions</div>
                  <div className="font-display font-bold text-lg text-white">{t.totalSeasons} Recorded</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/tournaments/${t.id}`}
                  className="btn-press shimmer-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500/20 to-blue-500/20 hover:from-teal-500/30 hover:to-blue-500/30 border border-cricket-teal/40 text-cricket-teal font-bold text-sm shadow transition-all"
                >
                  <span>Explore Tournament</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/archive?tournament=${t.id}`}
                  className="btn-press px-4 py-3 rounded-xl bg-cricket-dark/80 hover:bg-cricket-card border border-cricket-border text-gray-300 text-sm font-semibold transition-colors"
                  title="View Historical Records"
                >
                  <Award className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
