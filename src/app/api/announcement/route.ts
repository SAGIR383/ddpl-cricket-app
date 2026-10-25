import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export interface LiveAnnouncementData {
  id: string;
  tournamentSlug?: string;
  tournamentName?: string;
  organizationName?: string;
  message: string;
  type: 'breaking' | 'live' | 'championship' | 'alert';
  isActive: boolean;
  linkText?: string;
  linkUrl?: string;
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_ANNOUNCEMENT: LiveAnnouncementData = {
  id: 'ann-default',
  tournamentName: 'Global Platform',
  message: '🏏 Welcome to CricPlus! Global Corporate & Club Cricket Platform with Live Multiplayer Auctions & Ball-by-Ball Scoring.',
  type: 'championship',
  isActive: true,
  linkText: 'Explore Tournaments',
  linkUrl: '/tournaments',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Master Super Admin',
};

// GET /api/announcement
export async function GET(req: NextRequest) {
  try {
    const primary = await getStoreData<LiveAnnouncementData>(
      'live_announcement',
      'announcement.json',
      DEFAULT_ANNOUNCEMENT
    );

    const feed = await getStoreData<LiveAnnouncementData[]>(
      'live_announcements_feed',
      'announcements_feed.json',
      []
    );

    // Also pull active tournaments to auto-generate news items if feed has few items
    const configs = await getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {});
    const tournamentAnnouncements: LiveAnnouncementData[] = [];

    Object.values(configs).forEach((cfg: any) => {
      if (cfg?.status === 'open' || cfg?.status === 'auction' || cfg?.status === 'ongoing') {
        const statusText =
          cfg.status === 'open'
            ? 'Player registrations are officially open! Join the live player auction pool.'
            : cfg.status === 'auction'
            ? 'Live Multiplayer Franchise Auction is in progress! Watch the bidding war live.'
            : 'Tournament matches are currently underway. Follow ball-by-ball action live.';

        tournamentAnnouncements.push({
          id: `ann-auto-${cfg.slug}`,
          tournamentSlug: cfg.slug,
          tournamentName: cfg.name || cfg.slug.toUpperCase(),
          organizationName: cfg.organizationName || 'Corporate League',
          message: `${cfg.name}: ${statusText}`,
          type: cfg.status === 'auction' ? 'live' : 'championship',
          isActive: true,
          linkText: cfg.status === 'auction' ? 'Live Auction Room' : 'View Tournament',
          linkUrl: cfg.status === 'auction' ? `/auction?tournament=${cfg.slug}` : `/tournaments/${cfg.slug}`,
          updatedAt: cfg.createdAt || new Date().toISOString(),
          updatedBy: cfg.organizationName || 'Tournament Host',
        });
      }
    });

    // Merge manual feed with tournament announcements
    const mergedList = [...feed.filter((a) => a.isActive), ...tournamentAnnouncements];
    if (primary && primary.isActive && !mergedList.some((m) => m.id === primary.id)) {
      mergedList.unshift(primary);
    }

    const finalAnnouncements = mergedList.length > 0 ? mergedList : [DEFAULT_ANNOUNCEMENT];

    return NextResponse.json(
      {
        success: true,
        announcement: primary || finalAnnouncements[0],
        announcements: finalAnnouncements,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        announcement: DEFAULT_ANNOUNCEMENT,
        announcements: [DEFAULT_ANNOUNCEMENT],
        error: err.message,
      },
      { status: 500 }
    );
  }
}

// POST /api/announcement (Super Admin & Tournament Host Super Admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      message,
      type = 'championship',
      isActive = true,
      linkText = '',
      updatedBy = 'Super Admin',
      tournamentSlug,
      tournamentName,
      organizationName,
    } = body;

    const resolvedLinkUrl = (body.linkUrl || body.link || (tournamentSlug ? `/tournaments/${tournamentSlug}` : '')).trim();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Announcement message cannot be empty.' },
        { status: 400 }
      );
    }

    const updatedAnnouncement: LiveAnnouncementData = {
      id: `ann-${tournamentSlug || 'global'}-${Date.now()}`,
      tournamentSlug: tournamentSlug || undefined,
      tournamentName: tournamentName || (tournamentSlug ? tournamentSlug.toUpperCase() : 'Global Platform'),
      organizationName: organizationName || undefined,
      message: message.trim(),
      type: ['breaking', 'live', 'championship', 'alert'].includes(type) ? type : 'championship',
      isActive: Boolean(isActive),
      linkText: linkText?.trim() || (tournamentSlug ? 'View League' : 'Explore'),
      linkUrl: resolvedLinkUrl || (tournamentSlug ? `/tournaments/${tournamentSlug}` : '/tournaments'),
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Super Admin',
    };

    // Update primary announcement
    await setStoreData('live_announcement', updatedAnnouncement, 'announcement.json');

    // Update multi-league feed
    const existingFeed = await getStoreData<LiveAnnouncementData[]>(
      'live_announcements_feed',
      'announcements_feed.json',
      []
    );

    const filtered = existingFeed.filter(
      (a) => a.tournamentSlug !== tournamentSlug || !tournamentSlug
    );
    const updatedFeed = [updatedAnnouncement, ...filtered].slice(0, 20); // keep up to 20 recent announcements

    await setStoreData('live_announcements_feed', updatedFeed, 'announcements_feed.json');

    invalidateStoreCache('live_announcement');
    invalidateStoreCache('live_announcements_feed');

    return NextResponse.json({
      success: true,
      announcement: updatedAnnouncement,
      announcements: updatedFeed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
