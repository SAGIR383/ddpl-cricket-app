'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Calendar,
  Users,
  ChevronRight,
  Award,
  PlusCircle,
  Sparkles,
  Trash2,
  Globe2,
  Building2,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
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
  organizationSlug?: string;
  organizationName?: string;
  country?: string;
  currency?: string;
  currencySymbol?: string;
}

export default function TournamentsPage() {
  const { isSuperAdmin, isOrganizer, refreshProfile } = useAuth();
  const hasAdminRights = isSuperAdmin || isOrganizer;
  const [tournaments, setTournaments] = useState<TournamentMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const [wipeModalOpen, setWipeModalOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // Super Admin Verification State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminAuthInput, setAdminAuthInput] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'wipe'; slug?: string; name?: string } | null>(null);

  const handleAdminVerifyAndExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const authRes = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminAuthInput),
      });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.success) {
        setAuthError(authData.error || 'Invalid Super Admin credentials.');
        return;
      }

      await refreshProfile();
      setAuthModalOpen(false);

      if (pendingAction?.type === 'delete' && pendingAction.slug) {
        await executeDelete(pendingAction.slug, pendingAction.name || pendingAction.slug);
      } else if (pendingAction?.type === 'wipe') {
        await executeWipe();
      }
      setPendingAction(null);
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed');
    }
  };

  const executeWipe = async () => {
    setIsWiping(true);
    try {
      const res = await fetch('/api/tournaments/register?wipeAll=true', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTournaments([]);
        setWipeModalOpen(false);
        alert('All test tournaments and data wiped cleanly by Super Admin.');
      } else {
        alert(data.error || 'Failed to wipe tournaments');
      }
    } catch (err: any) {
      alert(`Error wiping tournaments: ${err.message}`);
    } finally {
      setIsWiping(false);
    }
  };

  const executeDelete = async (slug: string, name: string) => {
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

  const handleDeleteTournament = async (slug: string, name: string) => {
    if (!hasAdminRights) {
      setPendingAction({ type: 'delete', slug, name });
      setAuthModalOpen(true);
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete tournament "${name}"? This action can only be performed by Super Admin.`)) {
      return;
    }
    await executeDelete(slug, name);
  };

  const handleWipeAllTournaments = async () => {
    if (!hasAdminRights) {
      setPendingAction({ type: 'wipe' });
      setWipeModalOpen(false);
      setAuthModalOpen(true);
      return;
    }
    await executeWipe();
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
        if (regData?.tournamentsList !== undefined && Array.isArray(regData.tournamentsList)) {
          configsList = regData.tournamentsList;
        }

        const allAuctionTourneys = aData?.allTournaments || {};
        const allRulesTourneys = rulesData?.tournaments || {};

        const populatedTournaments: TournamentMeta[] = configsList.map((cfg: any) => {
          const slug = cfg.slug || 'ddpl';
          const tourneyAuctionData = allAuctionTourneys[slug] || (slug === 'ddpl' ? aData?.data : null);
          const teamsCount = tourneyAuctionData?.teams?.length || 0;
          const tourneyRules = allRulesTourneys[slug];
          const overs = tourneyRules?.matchOvers || cfg.overs || 10;
          const startDate = cfg.startDate || null;
          const endDate = cfg.endDate || null;

          const badge = getStatusBadge(cfg.status || 'upcoming');
          const logo = cfg.logo || '/images/default-tournament.svg';
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
            organizationSlug: cfg.organizationSlug || undefined,
            organizationName: cfg.organizationName || undefined,
            country: cfg.country || 'Global',
            currency: cfg.currency || 'INR',
            currencySymbol: cfg.currencySymbol || '₹',
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

  // Filter tournaments by search and organization
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.organizationName && t.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.country && t.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesOrg =
      selectedOrgFilter === 'all' ||
      t.organizationSlug === selectedOrgFilter ||
      (t.organizationName && t.organizationName.toLowerCase() === selectedOrgFilter.toLowerCase());

    return matchesSearch && matchesOrg;
  });

  // Extract unique organizations for filter pills
  const orgList = Array.from(
    new Set(
      tournaments
        .map((t) => t.organizationName)
        .filter(Boolean) as string[]
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8AD55]/15 pb-6">
        <div>
          <div className="text-xs font-bold text-[#D8AD55] uppercase tracking-widest flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Global Multi-Tenant Cricket Platform</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mt-1">
            Tournaments Directory
          </h1>
          <p className="text-sm text-[#8793A5] mt-1.5 max-w-2xl">
            Browse all corporate cricket tournaments, inter-tech championships, and corporate sporting leagues powered by CricPlus.
          </p>
        </div>

        {/* Global CTAs */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {tournaments.length > 0 && (
            <button
              type="button"
              onClick={() => setWipeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Wipe test tournaments to start clean"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clean Slate / Wipe Test Data</span>
            </button>
          )}
          <Link
            href="/tournaments/create"
            className="btn-press shimmer-btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-[#D8AD55]/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Host Your Tournament</span>
          </Link>
        </div>
      </div>

      {/* Corporate Self-Service Invitation Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0E1F35] to-[#142946] border border-[#D8AD55]/30 p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D8AD55]/20 border border-[#D8AD55]/40 text-[#F2D69A] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#D8AD55]" />
            <span>Open to Global Organizations</span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
            Want to Host a Tournament for Your Company or Club?
          </h3>
          <p className="text-xs sm:text-sm text-[#8793A5] leading-relaxed">
            Launch a dedicated tournament portal with multiplayer live auctions, ball-by-ball digital scoring, team purse management, and WhatsApp shareable player cards.
          </p>
        </div>

        <Link
          href="/tournaments/create"
          className="btn-press shrink-0 px-6 py-3 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/50 text-[#F2D69A] hover:text-white font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <span>Launch Your League in 2 Mins</span>
          <ChevronRight className="w-4 h-4 text-[#D8AD55]" />
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8793A5] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tournament, company, or country…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#08111F] border border-[#D8AD55]/20 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
          />
        </div>

        {/* Organization Filter Pills */}
        {orgList.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedOrgFilter('all')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                selectedOrgFilter === 'all'
                  ? 'border-[#D8AD55] bg-[#D8AD55]/20 text-[#F2D69A]'
                  : 'border-[#D8AD55]/20 bg-[#08111F] text-[#8793A5] hover:text-white'
              }`}
            >
              All Hosts ({tournaments.length})
            </button>
            {orgList.map((org) => (
              <button
                key={org}
                type="button"
                onClick={() => setSelectedOrgFilter(org)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  selectedOrgFilter === org
                    ? 'border-[#D8AD55] bg-[#D8AD55]/20 text-[#F2D69A]'
                    : 'border-[#D8AD55]/20 bg-[#08111F] text-[#8793A5] hover:text-white'
                }`}
              >
                {org}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tournaments Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="rounded-3xl p-10 bg-[#0D1B2A]/90 border border-[#D8AD55]/30 text-center space-y-4 shadow-xl">
          <Trophy className="w-12 h-12 text-[#D8AD55]/60 mx-auto" />
          <h3 className="font-display font-black text-2xl text-white">
            {searchQuery ? 'No Tournaments Match Your Search' : 'No Tournaments Found'}
          </h3>
          <p className="text-xs sm:text-sm text-[#8793A5] max-w-md mx-auto">
            {searchQuery
              ? 'Try searching with a different tournament name or corporate host keyword.'
              : 'Launch your first corporate cricket tournament today with live auctions & scoring.'}
          </p>
          <Link
            href="/tournaments/create"
            className="btn-press shimmer-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Host New Tournament</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredTournaments.map((t) => (
            <div
              key={t.id}
              className="bg-[#0D1B2A]/90 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col justify-between border border-[#D8AD55]/30 shadow-2xl hover:border-[#D8AD55]/60 transition-all group"
            >
              {/* Tournament Top Banner */}
              <div className={`p-6 sm:p-8 bg-gradient-to-br ${t.bannerColor} border-b border-[#D8AD55]/20 space-y-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${t.badgeColor}`}>
                      {t.status}
                    </span>
                    {t.country && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#08111F]/70 border border-[#D8AD55]/30 text-[#F2D69A] text-[10px] font-bold uppercase">
                        <Globe2 className="w-3 h-3 text-[#D8AD55]" />
                        <span>{t.country}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8793A5] font-bold">
                      Season {t.activeSeason}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTournament(t.id, t.name)}
                      disabled={deletingSlug === t.id}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                      title={`Permanently delete ${t.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{deletingSlug === t.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
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
                  <div className="space-y-1">
                    <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-wide group-hover:text-[#F2D69A] transition-colors">
                      {t.name}
                    </h2>
                    
                    {/* Organization Link */}
                    {t.organizationName && (
                      <div className="flex items-center gap-1.5 text-xs text-[#8793A5]">
                        <Building2 className="w-3.5 h-3.5 text-[#D8AD55]" />
                        <span>Host: </span>
                        {t.organizationSlug ? (
                          <Link
                            href={`/org/${t.organizationSlug}`}
                            className="text-[#F2D69A] hover:underline font-bold"
                          >
                            {t.organizationName}
                          </Link>
                        ) : (
                          <span className="text-white font-bold">{t.organizationName}</span>
                        )}
                      </div>
                    )}
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
                    <div className="text-[11px] text-[#8793A5] font-semibold">Currency</div>
                    <div className="font-display font-bold text-lg text-[#D8AD55]">{t.currency} ({t.currencySymbol})</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                  <Link
                    href={`/tournaments/${t.id}`}
                    className="btn-press shimmer-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 transition-all text-center"
                  >
                    <span>Explore</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/tournaments/${t.id}/register`}
                    className="btn-press flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
                    title="Player Registration Portal"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Register</span>
                  </Link>

                  <Link
                    href={`/auction?tournament=${t.id}`}
                    className="btn-press px-4 py-3 rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-sm font-semibold transition-colors flex items-center justify-center"
                    title="Live Auction Room"
                  >
                    <Trophy className="w-4 h-4 text-[#D8AD55]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wipe Confirmation Modal */}
      {wipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0D1B2A] border-2 border-rose-500/40 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">Clean Slate / Wipe All Data</h3>
                <p className="text-xs text-[#8793A5]">Reset application for fresh tournament testing</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#08111F] border border-rose-500/20 p-4 text-xs text-rose-200/90 leading-relaxed space-y-2">
              <p>
                ⚠️ <strong>Warning:</strong> This will permanently delete <strong>all existing tournaments</strong> ({tournaments.map((t) => t.name).join(', ') || 'all'}), along with their auction pools, franchises, match schedules, and player registrations.
              </p>
              <p>
                Use this to clean dummy test data so you can test hosting your own corporate tournament from a 100% clean slate.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWipeModalOpen(false)}
                disabled={isWiping}
                className="px-4 py-2.5 rounded-xl border border-[#D8AD55]/20 bg-[#08111F] text-[#8793A5] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeAllTournaments}
                disabled={isWiping}
                className="btn-press flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isWiping ? 'Wiping All Data...' : 'Yes, Wipe Everything Clean'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Authorization Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <form
            onSubmit={handleAdminVerifyAndExecute}
            className="w-full max-w-md rounded-3xl bg-[#0D1B2A] border-2 border-[#D8AD55]/40 p-6 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#D8AD55]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">Super Admin Authorization</h3>
                <p className="text-xs text-[#8793A5]">Tournament deletion is restricted to Super Admins</p>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                {authError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-bold block">Super Admin Email / Username</label>
                <input
                  type="text"
                  required
                  placeholder="admin@company.com or superadmin@cricplus.com"
                  value={adminAuthInput.username}
                  onChange={(e) => setAdminAuthInput({ ...adminAuthInput, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-bold block">Super Admin Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter admin password"
                  value={adminAuthInput.password}
                  onChange={(e) => setAdminAuthInput({ ...adminAuthInput, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(false);
                  setPendingAction(null);
                  setAuthError('');
                }}
                className="px-4 py-2.5 rounded-xl border border-[#D8AD55]/20 bg-[#08111F] text-[#8793A5] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-press flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] hover:brightness-110 text-[#08111F] text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#08111F]" />
                <span>Verify &amp; Authorize</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
