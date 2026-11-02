import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf';
const SUPABASE_SERVICE_KEY = getServiceRoleKey();
const SUPERADMIN_IDENTIFIER = process.env.SUPERADMIN_IDENTIFIER || '';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = (body.email || body.username || '').trim();
    const password = (body.password || '').trim();

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Email / Username and password are required.' },
        { status: 400 }
      );
    }

    const normalized = rawIdentifier.toLowerCase();

    // 1. Check Super Admin Credentials (strictly from environment variables)
    const isSuperAdminUser = Boolean(
      SUPERADMIN_IDENTIFIER &&
      (normalized === SUPERADMIN_IDENTIFIER.toLowerCase() ||
        normalized === 'superadmin' ||
        normalized === 'admin')
    );

    if (isSuperAdminUser && SUPERADMIN_PASSWORD && password === SUPERADMIN_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'super-admin-master-id',
          email: SUPERADMIN_IDENTIFIER || 'superadmin@cricplus.com',
          name: 'Master Super Admin',
          role: 'super_admin',
        },
        role: 'super_admin',
        profile: {
          id: 'super-admin-master-id',
          email: 'superadmin@cricplus.com',
          full_name: 'Master Super Admin',
          system_role: 'super_admin',
          primary_role: 'All-rounder',
        },
      });

      // Apply Super Admin cookies
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

    // 2. Direct Supabase Auth via SSR (Fastest Path for all registered users)
    const targetEmail = normalized;
    const cookieActions: Array<{ name: string; value: string; options: any }> = [];

    const ssrClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieActions.push({ name, value, options });
        },
        remove(name: string, options: any) {
          cookieActions.push({ name, value: '', options });
        },
      },
    });

    const { data: authData, error: authError } = await ssrClient.auth.signInWithPassword({
      email: targetEmail,
      password: password,
    });

    if (!authError && authData?.user) {
      // 3. Fast parallel fetch of role & profile
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
      });

      const [roleRes, profileRes] = await Promise.allSettled([
        adminClient.from('cricpluse_store').select('data').eq('key', 'user_roles').maybeSingle(),
        adminClient.from('profiles').select('*').eq('id', authData.user.id).maybeSingle(),
      ]);

      let assignedRole = 'user';
      if (roleRes.status === 'fulfilled' && roleRes.value.data?.data?.[targetEmail]) {
        assignedRole = roleRes.value.data.data[targetEmail];
      }

      let profileData = null;
      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        profileData = profileRes.value.data;
      }

      const finalRole = assignedRole || profileData?.system_role || 'user';

      const response = NextResponse.json({
        success: true,
        user: authData.user,
        session: authData.session,
        role: finalRole,
        profile: profileData || {
          id: authData.user.id,
          email: targetEmail,
          full_name: authData.user.user_metadata?.full_name || targetEmail.split('@')[0],
          system_role: finalRole,
        },
      });

      if (finalRole === 'super_admin') {
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
      }

      // Apply Supabase SSR cookies
      for (const c of cookieActions) {
        response.cookies.set(c.name, c.value, { ...c.options, path: '/' });
      }

      return response;
    }

    // 4. Fallback for custom tournament organizer accounts (only executed if standard auth failed)
    try {
      const { getStoreData } = await import('@/lib/supabase/store');
      const [adminAccounts, configs] = await Promise.all([
        getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {}),
        getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
      ]);

      const adminAcc = adminAccounts[normalized];
      if (
        adminAcc &&
        (adminAcc.password === password ||
          (adminAcc.pin && adminAcc.pin === password) ||
          Boolean(SUPERADMIN_PASSWORD && password === SUPERADMIN_PASSWORD))
      ) {
        const slug = adminAcc.tournamentSlug || 'ddpl';
        const token = `organizer_session:${slug}:${Buffer.from(adminAcc.email).toString('base64')}`;
        const response = NextResponse.json({
          success: true,
          user: {
            id: `superadmin-${slug}`,
            email: adminAcc.email,
            name: adminAcc.name || 'Super Admin',
            role: 'super_admin',
            tournamentSlug: slug,
          },
          role: 'super_admin',
          profile: {
            id: `superadmin-${slug}`,
            email: adminAcc.email,
            full_name: adminAcc.name || 'Super Admin',
            system_role: 'super_admin',
            primary_role: 'All-rounder',
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

      for (const [slug, cfg] of Object.entries(configs)) {
        if (cfg.creatorEmail && cfg.creatorEmail.trim().toLowerCase() === normalized) {
          const passMatch =
            (cfg.adminPassword && cfg.adminPassword === password) ||
            (cfg.adminPin && cfg.adminPin === password) ||
            Boolean(SUPERADMIN_PASSWORD && password === SUPERADMIN_PASSWORD);

          if (passMatch) {
            const token = `organizer_session:${slug}:${Buffer.from(cfg.creatorEmail).toString('base64')}`;
            const response = NextResponse.json({
              success: true,
              user: {
                id: `organizer-${slug}`,
                email: cfg.creatorEmail,
                name: `${cfg.name} Super Admin`,
                role: 'super_admin',
                tournamentSlug: slug,
              },
              role: 'super_admin',
              profile: {
                id: `organizer-${slug}`,
                email: cfg.creatorEmail,
                full_name: `${cfg.name} Super Admin`,
                system_role: 'super_admin',
                primary_role: 'All-rounder',
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
      }
    } catch (e) {
      console.warn('Super admin fallback check skipped:', e);
    }

    const message =
      authError?.message === 'Invalid login credentials'
        ? 'Invalid email or password. Please verify your credentials and try again.'
        : authError?.message || 'Authentication failed. Please check your credentials.';

    return NextResponse.json({ success: false, error: message }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
