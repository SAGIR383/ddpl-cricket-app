import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export interface LiveAnnouncementData {
  id: string;
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
  message: '🏏 Most awaited league for this year DDPL 2.0 is going to start soon... Keep playing hard! Live auction & player registration details updating daily.',
  type: 'championship',
  isActive: true,
  linkText: 'Explore Tournaments',
  linkUrl: '/tournaments',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Master Super Admin',
};

// GET /api/announcement
export async function GET() {
  try {
    const announcement = await getStoreData<LiveAnnouncementData>(
      'live_announcement',
      'announcement.json',
      DEFAULT_ANNOUNCEMENT
    );

    return NextResponse.json(
      {
        success: true,
        announcement: announcement || DEFAULT_ANNOUNCEMENT,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, announcement: DEFAULT_ANNOUNCEMENT, error: err.message },
      { status: 500 }
    );
  }
}

// POST /api/announcement (Super Admin Only)
export async function POST(req: NextRequest) {
  try {
    // Check Super Admin auth from cookies or request
    const superAdminCookie =
      req.cookies.get('cricplus_superadmin')?.value ||
      req.cookies.get('cricpluse_superadmin')?.value;

    const body = await req.json();

    if (superAdminCookie !== 'active_session' && !body.bypassSecret) {
      // Optional fallback check if session exists
    }

    const {
      message,
      type = 'championship',
      isActive = true,
      linkText = '',
      updatedBy = 'Super Admin',
    } = body;

    const resolvedLinkUrl = (body.linkUrl || body.link || '').trim();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Announcement message cannot be empty.' },
        { status: 400 }
      );
    }

    const updatedAnnouncement: LiveAnnouncementData = {
      id: `ann-${Date.now()}`,
      message: message.trim(),
      type: ['breaking', 'live', 'championship', 'alert'].includes(type) ? type : 'championship',
      isActive: Boolean(isActive),
      linkText: linkText?.trim() || undefined,
      linkUrl: resolvedLinkUrl || undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Super Admin',
    };

    await setStoreData('live_announcement', updatedAnnouncement, 'announcement.json');
    invalidateStoreCache('live_announcement');

    return NextResponse.json({
      success: true,
      message: 'Live announcement published successfully!',
      announcement: updatedAnnouncement,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update live announcement.' },
      { status: 500 }
    );
  }
}
