'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Calendar, Users, ChevronRight, Award, PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithCache } from '@/lib/clientCache';

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

export default function TournamentsPage() {
  const { isSuperAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const handleDeleteTournament = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete tournament "${name}"? This will delete all its matches, auction data, and registrations.`)) {
      return;
    }
    setDeletingSlug(slug);
    try {
      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_tournament',
          slug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTournaments((prev) => prev.filter((t) => t.id !== slug));
      } else {
        alert(data.error || 'Failed to delete tournament');
      }
    } catch (err: any) {
      alert(`Error deleting tournament: ${err.message}`);
    } finally {
      setDeletingSlug(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { label: '● Registration Open', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/20 animate-pulse' };
      case 'upcoming':
        return { label: 'Upcoming Tournament', color: 'bg-[#D8AD55]/20 text-[#F2D69A] border-[#D8AD55]/40' };
      case 'auction':
        return { label: '● Auction Live', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse' };
      case 'ongoing':
        return { label: '● Tournament Ongoing', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse' };
      default:
        return { label: 'Upcoming', color: 'bg-gray-500/20 text-gray-300 border-gray-500/40' };
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadTournamentsData() {
      if (tournaments.length === 0) setLoading(true);
      try {
        const [regData, aData, rulesData] = await Promise.all([
          fetchWithCache<any>('/api/tournaments/register?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>('/api/auction/data?tournament=ddpl', { ttlMs: 3000 }),
          fetchWithCache<any>('/api/admin/rules?tournament=ddpl', { ttlMs: 3000 }),
        ]);

        if (!isMounted) return;

        let configsList: any[] = [];
        if (regData?.tournamentsList !== undefined) {
          configsList = regData.tournamentsList;
        } else {
          configsList = [
            {
              slug: 'ddpl',
              name: 'DDPL',
              fullName: 'Desk to Dugout Premier League (DDPL)',
              tagline: 'High-octane inter-departmental corporate cricket tournament',
              season: '2026',
              totalSeasons: 2,
              overs: 10,
              bannerColor: 'from-[#08111F] via-[#0D1B2A] to-[#111D2D]',
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
              bannerColor: 'from-[#08111F] via-[#111D2D] to-[#0D1B2A]',
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
          const bannerColor = cfg.bannerColor || 'from-[#08111F] via-[#0D1B2A] to-[#111D2D]';

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

    // Live auto-refresh every 5s & re-sync on window focus
    const interval = setInterval(loadTournamentsData, 5000);
    const handleFocus = () => loadTournamentsData();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-widest flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Official League Hub</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1">
            Tournaments Directory
          </h1>
          <p className="text-sm text-[#8793A5] mt-1.5 max-w-2xl">
            Browse all official corporate cricket tournaments, active seasons, and historical archives running on CricPlus.
          </p>
        </div>

        {isSuperAdmin && (
          <Link
            href="/admin"
            className="btn-press shimmer-btn inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs tracking-wider uppercase shadow-lg shadow-[#D8AD55]/20 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Tournament</span>
          </Link>
        )}
      </div>

      {/* Tournaments Grid */}
      {tournaments.length === 0 ? (
        <div className="rounded-3xl p-10 bg-[#0D1B2A]/90 border border-[#D8AD55]/30 text-center space-y-4 shadow-xl">
          <Trophy className="w-12 h-12 text-[#D8AD55]/60 mx-auto" />
          <h3 className="font-display font-black text-2xl text-white">No Tournaments Found</h3>
          <p className="text-xs sm:text-sm text-[#8793A5] max-w-md mx-auto">
            All previous tournaments have been deleted. You can create a new tournament from the Admin console.
          </p>
          {isSuperAdmin && (
            <Link
              href="/admin"
              className="btn-press shimmer-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Go to Create Tournament</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col justify-between border border-[#D8AD55]/30 shadow-2xl hover:border-[#D8AD55]/60 transition-all"
            >
              {/* Tournament Top Banner */}
              <div className={`p-6 sm:p-8 bg-gradient-to-br ${t.bannerColor} border-b border-[#D8AD55]/20 space-y-5`}>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${t.badgeColor}`}>
                    {t.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8793A5] font-bold">
                      Season {t.activeSeason}
                    </span>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTournament(t.id, t.name)}
                        disabled={deletingSlug === t.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                        title={`Permanently delete ${t.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 shadow-xl shadow-[#D8AD55]/10 shrink-0 bg-[#08111F]">
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
                    <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-wider mt-0.5">
                      {t.fullName}
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">{t.tagline}</p>
              </div>

              {/* Quick Metrics */}
              <div className="p-6 sm:p-8 space-y-6">
                {t.startDate && t.endDate && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Tournament Schedule: {t.startDate} to {t.endDate}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/15">
                    <div className="text-[11px] text-[#8793A5] font-semibold">Match Overs</div>
                    <div className="font-display font-bold text-lg text-white">{t.overs} Overs</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/15">
                    <div className="text-[11px] text-[#8793A5] font-semibold">Franchises</div>
                    <div className="font-display font-bold text-lg text-white">{t.teamsCount} Teams</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/15">
                    <div className="text-[11px] text-[#8793A5] font-semibold">Editions</div>
                    <div className="font-display font-bold text-lg text-[#D8AD55]">{t.totalSeasons} Recorded</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href={`/tournaments/${t.id}`}
                    className="btn-press shimmer-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 transition-all"
                  >
                    <span>Explore Tournament</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/archive?tournament=${t.id}`}
                    className="btn-press px-4 py-3.5 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-sm font-semibold transition-colors flex items-center justify-center"
                    title="View Historical Records"
                  >
                    <Award className="w-5 h-5 text-[#D8AD55]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
