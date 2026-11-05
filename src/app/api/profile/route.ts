import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('cricplus_superadmin') || req.cookies.get('cricpluse_superadmin');
    const cookieVal = cookie?.value || '';

    let userEmail = '';
    let tournamentSlug = '';

    if (cookieVal.startsWith('active_session')) {
      const parts = cookieVal.split(':');
      if (parts[1]) {
        try {
          userEmail = Buffer.from(parts[1], 'base64').toString('utf-8');
        } catch {}
      }
    } else if (cookieVal.startsWith('organizer_session:')) {
      const parts = cookieVal.split(':');
      tournamentSlug = parts[1] || '';
      try {
        if (parts[2]) userEmail = Buffer.from(parts[2], 'base64').toString('utf-8');
      } catch {}
    }

    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get('email');

    // 2. Try super_admin_accounts store
    const adminAccounts = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {});
    const fallbackEmail = Object.keys(adminAccounts)[0] || '';
    const finalEmail = (queryEmail || userEmail || fallbackEmail).toLowerCase().trim();

    if (!finalEmail) {
      return NextResponse.json({ success: false, error: 'No authenticated email' }, { status: 401 });
    }

    // 1. Try Supabase profiles table
    const { data: dbProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', finalEmail)
      .maybeSingle();

    const adminAcc = adminAccounts[finalEmail] || {};

    // 3. Try tournament_configs
    const configs = await getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {});
    let creatorNameFromConfig = '';
    for (const cfg of Object.values(configs)) {
      if (cfg?.creatorEmail && cfg.creatorEmail.toLowerCase() === finalEmail) {
        if (cfg.creatorName) {
          creatorNameFromConfig = cfg.creatorName;
          break;
        }
      }
    }

    const resolvedFullName =
      dbProfile?.full_name ||
      adminAcc.name ||
      creatorNameFromConfig ||
      (finalEmail ? finalEmail.split('@')[0] : 'Super Admin');

    return NextResponse.json({
      success: true,
      profile: {
        id: dbProfile?.id || adminAcc.id || `profile-${finalEmail.replace(/[^a-z0-9]/g, '-')}`,
        email: finalEmail,
        full_name: resolvedFullName,
        avatar_url: dbProfile?.avatar_url || adminAcc.avatar_url || null,
        employee_id: dbProfile?.employee_id || adminAcc.employee_id || null,
        phone: dbProfile?.phone || adminAcc.phone || null,
        primary_role: dbProfile?.primary_role || 'All-rounder',
        batting_style: dbProfile?.batting_style || 'Right-hand bat',
        bowling_style: dbProfile?.bowling_style || 'Right-arm medium',
        system_role: dbProfile?.system_role || adminAcc.role || 'super_admin',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookie = req.cookies.get('cricplus_superadmin') || req.cookies.get('cricpluse_superadmin');
    const cookieVal = cookie?.value || '';

    let sessionEmail = '';
    let sessionSlug = '';

    if (cookieVal.startsWith('active_session')) {
      const parts = cookieVal.split(':');
      if (parts[1]) {
        try {
          sessionEmail = Buffer.from(parts[1], 'base64').toString('utf-8');
        } catch {}
      }
    } else if (cookieVal.startsWith('organizer_session:')) {
      const parts = cookieVal.split(':');
      sessionSlug = parts[1] || '';
      try {
        if (parts[2]) sessionEmail = Buffer.from(parts[2], 'base64').toString('utf-8');
      } catch {}
    }

    const targetEmail = (body.email || sessionEmail || '').toLowerCase().trim();
    if (!targetEmail) {
      return NextResponse.json({ success: false, error: 'Email identifier required' }, { status: 400 });
    }

    const newFullName = body.full_name?.trim() || targetEmail.split('@')[0];

    // 1. Update or upsert into Supabase profiles table
    let profileId = body.id;
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        profileId = existingProfile.id;
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name: newFullName,
            avatar_url: body.avatar_url,
            employee_id: body.employee_id,
            phone: body.phone,
            primary_role: body.primary_role || 'All-rounder',
            batting_style: body.batting_style || 'Right-hand bat',
            bowling_style: body.bowling_style || 'Right-arm medium',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      } else {
        profileId = profileId || `profile-${Date.now()}`;
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: profileId,
            email: targetEmail,
            full_name: newFullName,
            avatar_url: body.avatar_url,
            employee_id: body.employee_id,
            phone: body.phone,
            primary_role: body.primary_role || 'All-rounder',
            batting_style: body.batting_style || 'Right-hand bat',
            bowling_style: body.bowling_style || 'Right-arm medium',
            system_role: body.system_role || 'super_admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (e) {
      console.warn('Supabase profile update warning:', e);
    }

    // 2. Synchronize super_admin_accounts store while strictly preserving existing credentials and role
    const adminAccounts = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {}, true);
    const existingAcc = adminAccounts[targetEmail] || {};
    adminAccounts[targetEmail] = {
      ...existingAcc,
      email: targetEmail,
      name: newFullName,
      avatar_url: body.avatar_url || existingAcc.avatar_url,
      employee_id: body.employee_id || existingAcc.employee_id,
      phone: body.phone || existingAcc.phone,
      updatedAt: new Date().toISOString(),
    };
    await setStoreData('super_admin_accounts', adminAccounts, 'super_admin_accounts.json');
    invalidateStoreCache('super_admin_accounts');

    // 3. Synchronize tournament_configs creatorName for all tournaments created by this user
    const configs = await getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {});
    let configsUpdated = false;
    for (const [slug, cfg] of Object.entries(configs)) {
      if (
        (cfg?.creatorEmail && cfg.creatorEmail.toLowerCase() === targetEmail) ||
        (sessionSlug && slug === sessionSlug)
      ) {
        cfg.creatorName = newFullName;
        configsUpdated = true;
      }
    }
    if (configsUpdated) {
      await setStoreData('tournament_configs', configs, 'tournament_configs.json');
      invalidateStoreCache('tournament_configs');
    }

    const updatedProfile = {
      id: profileId,
      email: targetEmail,
      full_name: newFullName,
      avatar_url: body.avatar_url,
      employee_id: body.employee_id,
      phone: body.phone,
      primary_role: body.primary_role || 'All-rounder',
      batting_style: body.batting_style || 'Right-hand bat',
      bowling_style: body.bowling_style || 'Right-arm medium',
      system_role: body.system_role || 'super_admin',
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully across all databases and tournament configurations!',
      profile: updatedProfile,
      user: {
        id: profileId,
        email: targetEmail,
        name: newFullName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
