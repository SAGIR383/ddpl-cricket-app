'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Calendar, Users, ChevronRight, Award, PlusCircle } from 'lucide-react';

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
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentMeta[]>([
    {
      id: 'ddpl',
      name: 'DDPL',
      logo: '/images/ddpl-logo.jpg',
      fullName: 'Desk to Dugout Premier League (DDPL)',
      tagline: 'High-octane inter-departmental cricket tournament',
      activeSeason: '2026',
      totalSeasons: 2,
      teamsCount: 0,
      overs: 10,
      bannerColor: 'from-blue-900 to-indigo-950',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      status: 'Live & Active',
    },
    {
      id: 'game-of-run',
      name: 'Game of RUN',
      logo: '/images/game-of-run-logo.jpg',
      fullName: 'Game of RUN Championship',
      tagline: 'The official annual corporate cricket championship',
      activeSeason: '2026',
      totalSeasons: 2,
      teamsCount: 0,
      overs: 12,
      bannerColor: 'from-amber-950 to-orange-950',
      badgeColor: 'bg-amber-500/20 text-cricket-gold border-amber-500/30',
      status: 'Registrations Open',
    },
  ]);

  useEffect(() => {
    async function loadTournamentsData() {
      try {
        const [ddplRulesRes, gorRulesRes, ddplRes, gorRes, ddplRegRes, gorRegRes] = await Promise.all([
          fetch('/api/admin/rules?tournament=ddpl'),
          fetch('/api/admin/rules?tournament=game-of-run'),
          fetch('/api/auction/data?tournament=ddpl'),
          fetch('/api/auction/data?tournament=game-of-run'),
          fetch('/api/tournaments/register?tournament=ddpl'),
          fetch('/api/tournaments/register?tournament=game-of-run'),
        ]);

        let ddplOvers = 10;
        let gorOvers = 12;

        if (ddplRulesRes.ok) {
          const ddplRulesData = await ddplRulesRes.json();
          if (ddplRulesData.rules?.matchOvers) {
            ddplOvers = ddplRulesData.rules.matchOvers;
          }
        }

        if (gorRulesRes.ok) {
          const gorRulesData = await gorRulesRes.json();
          if (gorRulesData.rules?.matchOvers) {
            gorOvers = gorRulesData.rules.matchOvers;
          }
        }

        let ddplTeamsCount = 0;
        if (ddplRes.ok) {
          const ddplData = await ddplRes.json();
          ddplTeamsCount = ddplData.data?.teams?.length || 0;
        }

        let gorTeamsCount = 0;
        if (gorRes.ok) {
          const gorData = await gorRes.json();
          gorTeamsCount = gorData.data?.teams?.length || 0;
        }

        let ddplConfigStatus = 'open';
        let gorConfigStatus = 'upcoming';

        if (ddplRegRes.ok) {
          const ddplRegData = await ddplRegRes.json();
          if (ddplRegData.config?.status) ddplConfigStatus = ddplRegData.config.status;
        }

        if (gorRegRes.ok) {
          const gorRegData = await gorRegRes.json();
          if (gorRegData.config?.status) gorConfigStatus = gorRegData.config.status;
        }

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

        const ddplBadge = getStatusBadge(ddplConfigStatus);
        const gorBadge = getStatusBadge(gorConfigStatus);

        setTournaments([
          {
            id: 'ddpl',
            name: 'DDPL',
            logo: '/images/ddpl-logo.jpg',
            fullName: 'Desk to Dugout Premier League (DDPL)',
            tagline: 'High-octane inter-departmental corporate cricket tournament',
            activeSeason: '2026',
            totalSeasons: 2,
            teamsCount: ddplTeamsCount,
            overs: ddplOvers,
            bannerColor: 'from-blue-900 via-indigo-950 to-cricket-dark',
            badgeColor: ddplBadge.color,
            status: ddplBadge.label,
          },
          {
            id: 'game-of-run',
            name: 'Game of RUN',
            logo: '/images/game-of-run-logo.jpg',
            fullName: 'Game of RUN Championship',
            tagline: 'The official annual corporate cricket championship',
            activeSeason: '2026',
            totalSeasons: 2,
            teamsCount: gorTeamsCount,
            overs: gorOvers,
            bannerColor: 'from-amber-950 via-orange-950 to-cricket-dark',
            badgeColor: gorBadge.color,
            status: gorBadge.label,
          },
        ]);
      } catch (err) {
        console.error('Failed to load tournaments directory data:', err);
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="glass-card glass-card-hover overflow-hidden flex flex-col justify-between border border-cricket-border"
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
            <div className="p-6 space-y-6">
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
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-teal/40 text-cricket-teal font-bold text-sm shadow transition-all hover:scale-[1.02]"
                >
                  <span>Explore Tournament</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/archive?tournament=${t.id}`}
                  className="px-4 py-3 rounded-xl bg-cricket-dark/80 hover:bg-cricket-card border border-cricket-border text-gray-300 text-sm font-semibold transition-colors"
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
