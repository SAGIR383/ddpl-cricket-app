import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, supabaseAdmin } from '@/lib/supabase/store';
import { createClient } from '@supabase/supabase-js';

import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

const SUPERADMIN_IDENTIFIER = process.env.SUPERADMIN_IDENTIFIER || '';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_SERVICE_KEY = getServiceRoleKey();

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const normalizedUser = (username || '').trim().toLowerCase();
    const providedPass = (password || '').trim();

    // 1. Check Master Super Admin credentials strictly from environment variables
    const isMasterUser = Boolean(
      SUPERADMIN_IDENTIFIER &&
      (normalizedUser === SUPERADMIN_IDENTIFIER.toLowerCase() ||
        normalizedUser === 'admin' ||
        normalizedUser === 'superadmin')
    );

    if (isMasterUser && SUPERADMIN_PASSWORD && providedPass === SUPERADMIN_PASSWORD) {
      const masterEmail = SUPERADMIN_IDENTIFIER || normalizedUser;
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'super-admin-master-id',
          email: masterEmail,
          name: 'Master Super Admin',
          role: 'super_admin',
        },
      });

      const sessionToken = `active_session:${Buffer.from(masterEmail).toString('base64')}`;

      // Set cookie for persistence (both cricplus and legacy cricpluse)
      response.cookies.set('cricplus_superadmin', sessionToken, {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      response.cookies.set('cricpluse_superadmin', sessionToken, {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });

      return response;
    }

    // 2. Check Supabase Auth credentials for users with assigned super_admin or organizer role
    try {
      const roles = await getStoreData<Record<string, string>>('user_roles', 'roles.json', {});
      const assignedRole = roles[normalizedUser];

      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('system_role, full_name')
        .eq('email', normalizedUser)
        .maybeSingle();

      const userRole = assignedRole || prof?.system_role;

      if (userRole === 'super_admin' || userRole === 'organizer') {
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
        const { data: signInData, error: signInErr } = await adminClient.auth.signInWithPassword({
          email: normalizedUser,
          password: providedPass,
        });

        if (!signInErr && signInData?.user) {
          const token = `active_session:${Buffer.from(normalizedUser).toString('base64')}`;
          const resolvedName = prof?.full_name || signInData.user.user_metadata?.full_name || normalizedUser.split('@')[0];

          const response = NextResponse.json({
            success: true,
            user: {
              id: signInData.user.id,
              email: normalizedUser,
              name: resolvedName,
              role: userRole,
            },
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
    } catch (e) {
      console.warn('Supabase auth check in admin route failed:', e);
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

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (cookieVal.startsWith('active_session')) {
    let decodedEmail = '';
    const parts = cookieVal.split(':');
    if (parts[1]) {
      try {
        decodedEmail = Buffer.from(parts[1], 'base64').toString('utf-8');
      } catch {}
    }
    const masterEmail = (decodedEmail || SUPERADMIN_IDENTIFIER || '').toLowerCase().trim();
    let masterName = '';

    if (masterEmail) {
      try {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('email', masterEmail)
          .maybeSingle();
        if (prof?.full_name) {
          masterName = prof.full_name;
        }
      } catch (e) {}
    }

    if (!masterName) {
      const adminAccountsStore = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {});
      const masterAcc = adminAccountsStore[masterEmail] || {};
      masterName = masterAcc.name || (masterEmail ? masterEmail.split('@')[0] : 'Super Admin');
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: 'super-admin-master-id',
          email: masterEmail,
          name: masterName,
          role: 'super_admin',
        },
      },
      { headers: noCacheHeaders }
    );
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
    const resolvedEmail = (email || cfg.creatorEmail || '').toLowerCase().trim();
    let resolvedName = '';

    if (resolvedEmail) {
      try {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('email', resolvedEmail)
          .maybeSingle();
        if (prof?.full_name) {
          resolvedName = prof.full_name;
        }
      } catch (e) {}
    }

    if (!resolvedName) {
      const adminAccountsStore = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {});
      const acc = adminAccountsStore[resolvedEmail] || {};
      resolvedName = cfg.creatorName || acc.name || (resolvedEmail ? resolvedEmail.split('@')[0] : 'Tournament Organizer');
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: `organizer-${slug}`,
          email: resolvedEmail,
          name: resolvedName,
          role: 'super_admin',
          tournamentSlug: slug,
        },
        tournamentSlug: slug,
      },
      { headers: noCacheHeaders }
    );
  }

  return NextResponse.json({ authenticated: false }, { headers: noCacheHeaders });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const expiredOptions = { path: '/', maxAge: 0, expires: new Date(0), sameSite: 'lax' as const };
  response.cookies.set('cricplus_superadmin', '', expiredOptions);
  response.cookies.set('cricpluse_superadmin', '', expiredOptions);
  return response;
}
