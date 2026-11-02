import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export interface LiveAnnouncementData {
  id: string;
  tournamentSlug?: string;
  tournamentName?: string;
  organizationName?: string;
  badge?: string;
  message: string;
  type: 'breaking' | 'live' | 'championship' | 'alert';
  isActive: boolean;
  linkText?: string;
  linkUrl?: string;
  link?: string;
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_ANNOUNCEMENT: LiveAnnouncementData = {
  id: 'ann-default',
  tournamentName: 'Global Platform',
  message: '🏏 Welcome to CricPlus24! Global Corporate & Club Cricket Platform with Live Multiplayer Auctions & Ball-by-Ball Scoring.',
  type: 'championship',
  isActive: true,
  linkText: 'Explore Tournaments',
  linkUrl: '/tournaments',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Master Super Admin',
};

// GET /api/announcement
// Supports ?tournament=<slug> for admin management and unscoped for public multi-league ticker
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedTournament = searchParams.get('tournament')?.trim().toLowerCase();

    // 1. Load tournament-scoped announcements map
    const tournamentMap = await getStoreData<Record<string, LiveAnnouncementData>>(
      'tournament_announcements',
      'tournament_announcements.json',
      {}
    );

    // 2. Load primary & feed
    const primary = await getStoreData<LiveAnnouncementData | null>(
      'live_announcement',
      'announcement.json',
      null
    );

    const feed = await getStoreData<LiveAnnouncementData[]>(
      'live_announcements_feed',
      'announcements_feed.json',
      []
    );

    // SCENARIO A: Admin requested a specific tournament's broadcast settings
    if (requestedTournament) {
      let announcement: LiveAnnouncementData | undefined = tournamentMap[requestedTournament];

      // Fallback check against primary if matching slug
      if (!announcement && primary && primary.tournamentSlug?.toLowerCase() === requestedTournament) {
        announcement = primary;
      }

      // Fallback check against feed
      if (!announcement) {
        announcement = feed.find((a) => a.tournamentSlug?.toLowerCase() === requestedTournament);
      }

      // If no announcement exists yet for this specific tournament, return a clean blank template
      if (!announcement) {
        announcement = {
          id: `ann-${requestedTournament}`,
          tournamentSlug: requestedTournament,
          tournamentName: requestedTournament.toUpperCase(),
          organizationName: '',
          message: '',
          type: 'championship',
          isActive: false, // Inactive by default
          linkText: 'Register Now',
          linkUrl: `/tournaments/${requestedTournament}`,
          link: `/tournaments/${requestedTournament}`,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Tournament Admin',
        };
      }

      return NextResponse.json(
        {
          success: true,
          tournament: requestedTournament,
          announcement,
          announcements: announcement.isActive ? [announcement] : [],
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // SCENARIO B: Public request for website / app broadcast ticker
    // Gather all active announcements from the tournament map
    const activeTourneyAnnouncements = Object.values(tournamentMap).filter(
      (a) => a.isActive === true && typeof a.message === 'string' && a.message.trim().length > 0
    );

    const candidateList: LiveAnnouncementData[] = [...activeTourneyAnnouncements];

    // Check primary announcement if active and not already represented or explicitly paused
    if (
      primary &&
      primary.isActive === true &&
      primary.message?.trim() &&
      !candidateList.some(
        (c) => c.id === primary.id || (c.tournamentSlug && c.tournamentSlug === primary.tournamentSlug)
      )
    ) {
      const isExplicitlyPaused =
        primary.tournamentSlug && tournamentMap[primary.tournamentSlug.toLowerCase()]?.isActive === false;
      if (!isExplicitlyPaused) {
        candidateList.push(primary);
      }
    }

    // Check feed items: only active, not paused in tournamentMap, not already present
    feed.forEach((f) => {
      if (
        f.isActive === true &&
        f.message?.trim() &&
        !candidateList.some(
          (c) => c.id === f.id || (c.tournamentSlug && f.tournamentSlug && c.tournamentSlug === f.tournamentSlug)
        )
      ) {
        const isExplicitlyPaused =
          f.tournamentSlug && tournamentMap[f.tournamentSlug.toLowerCase()]?.isActive === false;
        if (!isExplicitlyPaused) {
          candidateList.push(f);
        }
      }
    });

    // Auto-generate tournament status announcement ONLY if tournament status is active
    // AND the tournament admin has NOT explicitly paused broadcasts (isActive === false)
    const configs = await getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {});
    Object.values(configs).forEach((cfg: any) => {
      const slug = cfg?.slug?.toLowerCase();
      if (!slug) return;

      // Respect organizer's decision: if explicitly paused, NEVER generate auto-announcements!
      if (tournamentMap[slug]?.isActive === false) {
        return;
      }

      // If tournament already has an active manual announcement, don't duplicate
      if (candidateList.some((c) => c.tournamentSlug?.toLowerCase() === slug)) {
        return;
      }

      if (cfg?.status === 'open' || cfg?.status === 'auction' || cfg?.status === 'ongoing') {
        const statusText =
          cfg.status === 'open'
            ? 'Player registrations are officially open! Join the live player auction pool.'
            : cfg.status === 'auction'
            ? 'Live Multiplayer Franchise Auction is in progress! Watch the bidding war live.'
            : 'Tournament matches are currently underway. Follow ball-by-ball action live.';

        candidateList.push({
          id: `ann-auto-${cfg.slug}`,
          tournamentSlug: cfg.slug,
          tournamentName: cfg.name || cfg.slug.toUpperCase(),
          organizationName: cfg.organizationName || 'Corporate League',
          message: `${cfg.name}: ${statusText}`,
          type: cfg.status === 'auction' ? 'live' : 'championship',
          isActive: true,
          linkText: cfg.status === 'auction' ? 'Live Auction Room' : 'View Tournament',
          linkUrl: cfg.status === 'auction' ? `/auction?tournament=${cfg.slug}` : `/tournaments/${cfg.slug}`,
          link: cfg.status === 'auction' ? `/auction?tournament=${cfg.slug}` : `/tournaments/${cfg.slug}`,
          updatedAt: cfg.createdAt || new Date().toISOString(),
          updatedBy: cfg.organizationName || 'Tournament Host',
        });
      }
    });

    // Strict filter: only active, non-empty announcements
    const finalAnnouncements = candidateList.filter(
      (a) => a.isActive === true && typeof a.message === 'string' && a.message.trim().length > 0
    );

    return NextResponse.json(
      {
        success: true,
        announcement: finalAnnouncements[0] || null,
        announcements: finalAnnouncements,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        announcement: null,
        announcements: [],
        error: err.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/announcement (Tournament Admin & Super Admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      message,
      type = 'championship',
      badge,
      isActive = true,
      linkText = '',
      updatedBy = 'Super Admin',
      tournamentSlug,
      tournamentName,
      organizationName,
    } = body;

    const slug = (tournamentSlug || 'ddpl').trim().toLowerCase();
    const resolvedLinkUrl = (body.linkUrl || body.link || (slug ? `/tournaments/${slug}` : '')).trim();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Announcement message cannot be empty.' },
        { status: 400 }
      );
    }

    const updatedAnnouncement: LiveAnnouncementData = {
      id: `ann-${slug}-${Date.now()}`,
      tournamentSlug: slug,
      tournamentName: tournamentName || slug.toUpperCase(),
      organizationName: organizationName || undefined,
      badge: badge?.trim() || undefined,
      message: message.trim(),
      type: ['breaking', 'live', 'championship', 'alert'].includes(type) ? type : 'championship',
      isActive: Boolean(isActive),
      linkText: linkText?.trim() || 'View League',
      linkUrl: resolvedLinkUrl || `/tournaments/${slug}`,
      link: resolvedLinkUrl || `/tournaments/${slug}`,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Super Admin',
    };

    // 1. Update tournament-specific announcement store map
    const tournamentMap = await getStoreData<Record<string, LiveAnnouncementData>>(
      'tournament_announcements',
      'tournament_announcements.json',
      {}
    );
    tournamentMap[slug] = updatedAnnouncement;
    await setStoreData('tournament_announcements', tournamentMap, 'tournament_announcements.json');

    // 2. Update multi-league feed
    const existingFeed = await getStoreData<LiveAnnouncementData[]>(
      'live_announcements_feed',
      'announcements_feed.json',
      []
    );

    // Remove any previous entry for this tournament
    const filteredFeed = existingFeed.filter((a) => {
      const aSlug = a.tournamentSlug?.toLowerCase();
      if (aSlug && aSlug === slug) return false;
      // Also purge legacy un-slugged global entries if this is ddpl
      if (!aSlug && slug === 'ddpl' && a.id?.startsWith('ann-global')) return false;
      return true;
    });

    // If active, prepend; if paused, it stays removed from active feed
    const updatedFeed = updatedAnnouncement.isActive
      ? [updatedAnnouncement, ...filteredFeed].slice(0, 20)
      : filteredFeed;

    await setStoreData('live_announcements_feed', updatedFeed, 'announcements_feed.json');

    // 3. Update primary announcement
    if (updatedAnnouncement.isActive) {
      await setStoreData('live_announcement', updatedAnnouncement, 'announcement.json');
    } else {
      // If paused, switch primary to another active tournament announcement if one exists
      const otherActive = Object.values(tournamentMap).find(
        (a) => a.tournamentSlug?.toLowerCase() !== slug && a.isActive === true && a.message?.trim().length > 0
      );
      if (otherActive) {
        await setStoreData('live_announcement', otherActive, 'announcement.json');
      } else {
        await setStoreData('live_announcement', updatedAnnouncement, 'announcement.json');
      }
    }

    // 4. Invalidate memory cache
    invalidateStoreCache('tournament_announcements');
    invalidateStoreCache('live_announcement');
    invalidateStoreCache('live_announcements_feed');

    return NextResponse.json({
      success: true,
      announcement: updatedAnnouncement,
      announcements: Object.values(tournamentMap).filter((a) => a.isActive),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
