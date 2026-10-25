import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '@/lib/supabase/store';

const SUPERADMIN_IDENTIFIER = process.env.SUPERADMIN_IDENTIFIER || 'superadmin@cricplus.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const normalizedUser = (username || '').trim().toLowerCase();
    const providedPass = (password || '').trim();

    // 1. Check Master Super Admin credentials
    const isMasterUser =
      normalizedUser === 'superadmin@cricplus.com' ||
      normalizedUser === 'superadmin@cricpluse.com' ||
      normalizedUser === SUPERADMIN_IDENTIFIER.toLowerCase() ||
      normalizedUser === 'admin' ||
      normalizedUser === 'superadmin';

    if (isMasterUser && providedPass === SUPERADMIN_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'super-admin-master-id',
          email: 'superadmin@cricplus.com',
          name: 'Master Super Admin',
          role: 'super_admin',
        },
      });

      // Set cookie for persistence (both cricplus and legacy cricpluse)
      response.cookies.set('cricplus_superadmin', 'active_session', {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      response.cookies.set('cricpluse_superadmin', 'active_session', {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });

      return response;
    }

    // 2. Check Tournament Super Admin (Organization / League Creator) credentials
    const configs = await getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {});

    for (const [slug, cfg] of Object.entries(configs)) {
      const creatorMatch = cfg.creatorEmail && cfg.creatorEmail.trim().toLowerCase() === normalizedUser;
      const passMatch =
        (cfg.adminPassword && cfg.adminPassword === providedPass) ||
        (cfg.adminPin && cfg.adminPin === providedPass) ||
        (providedPass === SUPERADMIN_PASSWORD);

      if (creatorMatch && passMatch) {
        const token = `organizer_session:${slug}:${Buffer.from(cfg.creatorEmail).toString('base64')}`;
        const response = NextResponse.json({
          success: true,
          user: {
            id: `organizer-${slug}`,
            email: cfg.creatorEmail,
            name: `${cfg.name} Super Admin`,
            role: 'organizer',
            tournamentSlug: slug,
          },
          tournamentSlug: slug,
        });

        response.cookies.set('cricplus_superadmin', token, {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
        });
        response.cookies.set('cricpluse_superadmin', token, {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
        });

        return response;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid credentials. Please verify your Super Admin or Tournament Host Admin credentials.',
      },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('cricplus_superadmin') || req.cookies.get('cricpluse_superadmin');
  const cookieVal = cookie?.value || '';

  if (cookieVal === 'active_session') {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'super-admin-master-id',
        email: 'superadmin@cricplus.com',
        name: 'Master Super Admin',
        role: 'super_admin',
      },
    });
  }

  if (cookieVal.startsWith('organizer_session:')) {
    const parts = cookieVal.split(':');
    const slug = parts[1];
    let email = '';
    try {
      if (parts[2]) email = Buffer.from(parts[2], 'base64').toString('utf-8');
    } catch {}

    const configs = await getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {});
    const cfg = configs[slug] || {};

    return NextResponse.json({
      authenticated: true,
      user: {
        id: `organizer-${slug}`,
        email: email || cfg.creatorEmail || 'organizer@cricplus.com',
        name: `${cfg.name || 'Tournament'} Super Admin`,
        role: 'organizer',
        tournamentSlug: slug,
      },
      tournamentSlug: slug,
    });
  }

  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('cricplus_superadmin');
  response.cookies.delete('cricpluse_superadmin');
  return response;
}
