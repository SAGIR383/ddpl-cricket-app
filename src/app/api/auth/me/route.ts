import { NextRequest, NextResponse } from 'next/server';
import { neonQuery } from '@/lib/db/neon';
import { getStoreData } from '@/lib/supabase/store';

export async function GET(req: NextRequest) {
  try {
    const userCookie = req.cookies.get('cricplus_user')?.value;
    const adminCookie = req.cookies.get('cricplus_superadmin')?.value || req.cookies.get('cricpluse_superadmin')?.value;

    let targetEmail = '';
    let isAdminSession = false;
    let tournamentSlug = '';

    if (adminCookie) {
      isAdminSession = true;
      if (adminCookie.startsWith('active_session:')) {
        const parts = adminCookie.split(':');
        if (parts[1]) {
          try {
            targetEmail = Buffer.from(parts[1], 'base64').toString('utf-8').toLowerCase().trim();
          } catch {}
        }
      } else if (adminCookie.startsWith('organizer_session:')) {
        const parts = adminCookie.split(':');
        tournamentSlug = parts[1] || '';
        if (parts[2]) {
          try {
            targetEmail = Buffer.from(parts[2], 'base64').toString('utf-8').toLowerCase().trim();
          } catch {}
        }
      } else if (adminCookie === 'active_session') {
        targetEmail = process.env.SUPERADMIN_IDENTIFIER?.toLowerCase() || 'arindamroyaec2009@gmail.com';
      }
    }

    if (!targetEmail && userCookie) {
      if (userCookie.startsWith('active_session:')) {
        const parts = userCookie.split(':');
        if (parts[1]) {
          try {
            targetEmail = Buffer.from(parts[1], 'base64').toString('utf-8').toLowerCase().trim();
          } catch {}
        }
      } else {
        targetEmail = userCookie.toLowerCase().trim();
      }
    }

    // Support query param ?email= for immediate client hydration if needed
    if (!targetEmail) {
      const { searchParams } = new URL(req.url);
      const qEmail = searchParams.get('email');
      if (qEmail) targetEmail = qEmail.toLowerCase().trim();
    }

    if (!targetEmail) {
      return NextResponse.json(
        { authenticated: false, user: null, profile: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        }
      );
    }

    // Fetch user profile from Neon PostgreSQL
    let dbProfile: any = null;
    try {
      const rows = await neonQuery<any>(
        'SELECT id, full_name, email, avatar_url, phone, employee_id, batting_style, bowling_style, primary_role, system_role, created_at, updated_at FROM profiles WHERE LOWER(email) = $1 LIMIT 1',
        [targetEmail]
      );
      if (rows && rows.length > 0) {
        dbProfile = rows[0];
      }
    } catch (e) {
      console.warn('[Me Route Neon Query Warn]:', e);
    }

    // Fetch user roles store
    const userRoles = await getStoreData<Record<string, string>>('user_roles', 'roles.json', {});
    const adminAccounts = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {});

    const isMasterEmail =
      targetEmail === 'arindamroyaec2009@gmail.com' ||
      targetEmail === 'superadmin@cricplus.com' ||
      targetEmail === 'superadmin@cricpluse.com';

    const finalRole =
      (isMasterEmail || isAdminSession)
        ? 'super_admin'
        : userRoles[targetEmail] || dbProfile?.system_role || adminAccounts[targetEmail]?.role || 'user';

    const resolvedName =
      dbProfile?.full_name ||
      adminAccounts[targetEmail]?.name ||
      targetEmail.split('@')[0];

    const resolvedAvatar =
      dbProfile?.avatar_url ||
      adminAccounts[targetEmail]?.avatar_url ||
      null;

    const fullProfile = {
      id: dbProfile?.id || `user-${Buffer.from(targetEmail).toString('hex').slice(0, 8)}`,
      email: targetEmail,
      full_name: resolvedName,
      avatar_url: resolvedAvatar,
      employee_id: dbProfile?.employee_id || null,
      phone: dbProfile?.phone || null,
      batting_style: dbProfile?.batting_style || 'Right-hand bat',
      bowling_style: dbProfile?.bowling_style || 'Right-arm medium',
      primary_role: dbProfile?.primary_role || 'All-rounder',
      system_role: finalRole,
      created_at: dbProfile?.created_at || new Date().toISOString(),
      updated_at: dbProfile?.updated_at || new Date().toISOString(),
    };

    const userObj = {
      id: fullProfile.id,
      email: targetEmail,
      name: resolvedName,
      role: finalRole,
      avatar_url: resolvedAvatar,
      tournamentSlug: tournamentSlug || adminAccounts[targetEmail]?.tournamentSlug || '',
    };

    return NextResponse.json(
      {
        authenticated: true,
        user: userObj,
        profile: fullProfile,
        role: finalRole,
        tournamentSlug: userObj.tournamentSlug,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, error: err.message },
      { status: 500 }
    );
  }
}
