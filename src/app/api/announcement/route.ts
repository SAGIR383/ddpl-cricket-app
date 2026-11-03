import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// GET /api/announcement
// Supports:
// - ?all=true -> returns all announcements (both active and paused) for admin management
// - ?tournament=<slug> -> returns announcement for specific tournament
// - default -> returns only active, non-empty announcements for public ticker
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedTournament = searchParams.get('tournament')?.trim().toLowerCase();
    const returnAll = searchParams.get('all') === 'true';

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

    // Gather all unique stored announcements
    const allStoredMap = new Map<string, LiveAnnouncementData>();

    // Add feed items
    (Array.isArray(feed) ? feed : []).forEach((item) => {
      if (item && item.id) allStoredMap.set(item.id, item);
    });

    // Add tournament map items
    Object.values(tournamentMap || {}).forEach((item) => {
      if (item && item.id) allStoredMap.set(item.id, item);
      else if (item && item.tournamentSlug) allStoredMap.set(`ann-${item.tournamentSlug}`, item);
    });

    // Add primary item
    if (primary && primary.id) {
      allStoredMap.set(primary.id, primary);
    }

    const allList = Array.from(allStoredMap.values());

    // SCENARIO A: Admin requests full list of all announcements (active & paused)
    if (returnAll) {
      return NextResponse.json({
        success: true,
        allAnnouncements: allList,
        activeAnnouncements: allList.filter((a) => a.isActive && a.message?.trim()),
      });
    }

    // SCENARIO B: Admin requested a specific tournament's broadcast settings
    if (requestedTournament) {
      let announcement: LiveAnnouncementData | undefined = tournamentMap[requestedTournament];

      if (!announcement && primary && primary.tournamentSlug?.toLowerCase() === requestedTournament) {
        announcement = primary;
      }

      if (!announcement) {
        announcement = feed.find((a) => a.tournamentSlug?.toLowerCase() === requestedTournament);
      }

      if (!announcement) {
        announcement = {
          id: `ann-${requestedTournament}`,
          tournamentSlug: requestedTournament,
          tournamentName: requestedTournament.toUpperCase(),
          organizationName: '',
          message: '',
          type: 'championship',
          isActive: false,
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
          announcements: announcement.isActive && announcement.message?.trim() ? [announcement] : [],
          allAnnouncements: allList,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // SCENARIO C: Public request for website & app ticker
    // STRICT RULE: Only return explicitly published announcements that are active and non-empty.
    // Zero auto-generated fake announcements!
    const activeAnnouncements = allList.filter(
      (a) => a.isActive === true && typeof a.message === 'string' && a.message.trim().length > 0
    );

    return NextResponse.json(
      {
        success: true,
        announcement: activeAnnouncements[0] || null,
        announcements: activeAnnouncements,
        allAnnouncements: allList,
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
        allAnnouncements: [],
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
      id,
      action,
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

    // Handle action: 'delete' inside POST for convenience
    if (action === 'delete') {
      return executeDelete(body);
    }

    const slug = (tournamentSlug || '').trim().toLowerCase();
    const resolvedLinkUrl = (body.linkUrl || body.link || (slug ? `/tournaments/${slug}` : '')).trim();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Announcement message cannot be empty.' },
        { status: 400 }
      );
    }

    const annId = id || `ann-${slug || 'global'}-${Date.now()}`;

    const updatedAnnouncement: LiveAnnouncementData = {
      id: annId,
      tournamentSlug: slug || undefined,
      tournamentName: tournamentName || (slug ? slug.toUpperCase() : 'Global'),
      organizationName: organizationName || undefined,
      badge: badge?.trim() || undefined,
      message: message.trim(),
      type: ['breaking', 'live', 'championship', 'alert'].includes(type) ? type : 'championship',
      isActive: Boolean(isActive),
      linkText: linkText?.trim() || 'View League',
      linkUrl: resolvedLinkUrl || (slug ? `/tournaments/${slug}` : '/tournaments'),
      link: resolvedLinkUrl || (slug ? `/tournaments/${slug}` : '/tournaments'),
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Super Admin',
    };

    // 1. Update tournament-specific announcement store map
    const tournamentMap = await getStoreData<Record<string, LiveAnnouncementData>>(
      'tournament_announcements',
      'tournament_announcements.json',
      {}
    );
    if (slug) {
      tournamentMap[slug] = updatedAnnouncement;
      await setStoreData('tournament_announcements', tournamentMap, 'tournament_announcements.json');
    }

    // 2. Update multi-league feed
    const existingFeed = await getStoreData<LiveAnnouncementData[]>(
      'live_announcements_feed',
      'announcements_feed.json',
      []
    );

    // Remove any previous entry for this announcement ID or tournament
    const filteredFeed = existingFeed.filter((a) => {
      if (a.id === annId) return false;
      if (slug && a.tournamentSlug?.toLowerCase() === slug) return false;
      return true;
    });

    // If active, prepend; if paused, it stays out of active feed
    const updatedFeed = updatedAnnouncement.isActive
      ? [updatedAnnouncement, ...filteredFeed].slice(0, 20)
      : filteredFeed;

    await setStoreData('live_announcements_feed', updatedFeed, 'announcements_feed.json');

    // 3. Update primary announcement
    if (updatedAnnouncement.isActive) {
      await setStoreData('live_announcement', updatedAnnouncement, 'announcement.json');
    } else {
      // If paused, switch primary to another active announcement or null
      const otherActive = updatedFeed.find((a) => a.isActive && a.message?.trim());
      await setStoreData('live_announcement', otherActive || null, 'announcement.json');
    }

    // 4. Invalidate memory cache
    invalidateStoreCache('tournament_announcements');
    invalidateStoreCache('live_announcement');
    invalidateStoreCache('live_announcements_feed');

    return NextResponse.json({
      success: true,
      message: updatedAnnouncement.isActive ? 'Broadcast published and live!' : 'Broadcast saved and paused.',
      announcement: updatedAnnouncement,
      announcements: updatedFeed.filter((a) => a.isActive),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// Helper to execute clean deletion of an announcement
async function executeDelete(params: { id?: string; tournamentSlug?: string; action?: string }) {
  const { id, tournamentSlug, action } = params;

  // Option A: Delete all broadcasts completely
  if (action === 'delete_all') {
    await Promise.all([
      setStoreData('tournament_announcements', {}, 'tournament_announcements.json'),
      setStoreData('live_announcements_feed', [], 'announcements_feed.json'),
      setStoreData('live_announcement', null, 'announcement.json'),
    ]);

    invalidateStoreCache('tournament_announcements');
    invalidateStoreCache('live_announcement');
    invalidateStoreCache('live_announcements_feed');

    return NextResponse.json({
      success: true,
      message: 'All live broadcasts deleted permanently.',
      allAnnouncements: [],
      announcements: [],
    });
  }

  const targetId = id?.trim();
  const targetSlug = tournamentSlug?.trim().toLowerCase();

  if (!targetId && !targetSlug) {
    return NextResponse.json({ success: false, error: 'Broadcast ID or Tournament Slug required for deletion' }, { status: 400 });
  }

  // 1. Clean tournament map
  const tournamentMap = await getStoreData<Record<string, LiveAnnouncementData>>(
    'tournament_announcements',
    'tournament_announcements.json',
    {}
  );

  if (targetSlug && tournamentMap[targetSlug]) {
    delete tournamentMap[targetSlug];
  }
  Object.keys(tournamentMap).forEach((k) => {
    if (tournamentMap[k]?.id === targetId || (targetSlug && tournamentMap[k]?.tournamentSlug?.toLowerCase() === targetSlug)) {
      delete tournamentMap[k];
    }
  });

  await setStoreData('tournament_announcements', tournamentMap, 'tournament_announcements.json');

  // 2. Clean feed
  const existingFeed = await getStoreData<LiveAnnouncementData[]>(
    'live_announcements_feed',
    'announcements_feed.json',
    []
  );

  const updatedFeed = existingFeed.filter((a) => {
    if (targetId && a.id === targetId) return false;
    if (targetSlug && a.tournamentSlug?.toLowerCase() === targetSlug) return false;
    return true;
  });

  await setStoreData('live_announcements_feed', updatedFeed, 'announcements_feed.json');

  // 3. Clean primary
  const primary = await getStoreData<LiveAnnouncementData | null>(
    'live_announcement',
    'announcement.json',
    null
  );

  if (primary && (primary.id === targetId || (targetSlug && primary.tournamentSlug?.toLowerCase() === targetSlug))) {
    const nextPrimary = updatedFeed.find((a) => a.isActive && a.message?.trim()) || null;
    await setStoreData('live_announcement', nextPrimary, 'announcement.json');
  }

  invalidateStoreCache('tournament_announcements');
  invalidateStoreCache('live_announcement');
  invalidateStoreCache('live_announcements_feed');

  return NextResponse.json({
    success: true,
    message: 'Broadcast deleted permanently.',
    announcements: updatedFeed.filter((a) => a.isActive),
    allAnnouncements: updatedFeed,
  });
}

// DELETE /api/announcement
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tournamentSlug = searchParams.get('tournament');
    const action = searchParams.get('action');

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const resolvedId = id || body.id;
    const resolvedSlug = tournamentSlug || body.tournamentSlug || body.slug;
    const resolvedAction = action || body.action;

    return executeDelete({ id: resolvedId, tournamentSlug: resolvedSlug, action: resolvedAction });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
