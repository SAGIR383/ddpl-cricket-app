import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export async function GET(req: NextRequest) {
  try {
    const cookie =
      req.cookies.get('cricplus_user') ||
      req.cookies.get('cricplus_superadmin') ||
      req.cookies.get('cricpluse_superadmin');
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

    // 1. Try unified user_profiles store (fastest, guaranteed persistent)
    const userProfiles = await getStoreData<Record<string, any>>('user_profiles', 'user_profiles.json', {});
    const adminAccounts = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {});

    // Strictly require a specific email - NEVER fall back to another user's or super admin's account
    const finalEmail = (queryEmail || userEmail || '').toLowerCase().trim();

    if (!finalEmail) {
      return NextResponse.json({ success: false, error: 'No authenticated email provided' }, { status: 400 });
    }

    const userProf = userProfiles[finalEmail] || {};
    const adminAcc = adminAccounts[finalEmail] || {};

    // 2. Query Supabase Pro profiles table directly
    let dbProfile: any = null;
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', finalEmail)
        .maybeSingle();
      dbProfile = data;
    } catch (e) {
      console.warn('Supabase profile fetch error:', e);
    }

    // 3. Try tournament_configs for creator name
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
      userProf.full_name ||
      dbProfile?.full_name ||
      adminAcc.name ||
      creatorNameFromConfig ||
      (finalEmail ? finalEmail.split('@')[0] : 'Athlete');

    const resolvedAvatar =
      userProf.avatar_url ||
      adminAcc.avatar_url ||
      dbProfile?.avatar_url ||
      null;

    return NextResponse.json({
      success: true,
      profile: {
        id: userProf.id || dbProfile?.id || adminAcc.id || `profile-${finalEmail.replace(/[^a-z0-9]/g, '-')}`,
        email: finalEmail,
        full_name: resolvedFullName,
        avatar_url: resolvedAvatar,
        employee_id: userProf.employee_id || dbProfile?.employee_id || adminAcc.employee_id || null,
        phone: userProf.phone || dbProfile?.phone || adminAcc.phone || null,
        primary_role: userProf.primary_role || dbProfile?.primary_role || 'All-rounder',
        batting_style: userProf.batting_style || dbProfile?.batting_style || 'Right-hand bat',
        bowling_style: userProf.bowling_style || dbProfile?.bowling_style || 'Right-arm medium',
        system_role: userProf.system_role || dbProfile?.system_role || adminAcc.role || 'user',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookie =
      req.cookies.get('cricplus_user') ||
      req.cookies.get('cricplus_superadmin') ||
      req.cookies.get('cricpluse_superadmin');
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

    // 1. Fetch existing stores to avoid overwriting existing fields
    const userProfiles = await getStoreData<Record<string, any>>('user_profiles', 'user_profiles.json', {}, true);
    const existingUserProf = userProfiles[targetEmail] || {};

    const adminAccounts = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {}, true);
    const existingAdminAcc = adminAccounts[targetEmail];

    const resolvedAvatar = body.avatar_url !== undefined ? body.avatar_url : (existingUserProf.avatar_url || existingAdminAcc?.avatar_url || null);

    // 2. Persist to universal user_profiles store in cricpluse_store (100% resilient across all roles)
    userProfiles[targetEmail] = {
      ...existingUserProf,
      id: body.id || existingUserProf.id || `profile-${Date.now()}`,
      email: targetEmail,
      full_name: newFullName,
      avatar_url: resolvedAvatar,
      employee_id: body.employee_id !== undefined ? body.employee_id : (existingUserProf.employee_id || null),
      phone: body.phone !== undefined ? body.phone : (existingUserProf.phone || null),
      primary_role: body.primary_role || existingUserProf.primary_role || 'All-rounder',
      batting_style: body.batting_style || existingUserProf.batting_style || 'Right-hand bat',
      bowling_style: body.bowling_style || existingUserProf.bowling_style || 'Right-arm medium',
      system_role: body.system_role || existingUserProf.system_role || (existingAdminAcc ? 'super_admin' : 'user'),
      updated_at: new Date().toISOString(),
    };
    await setStoreData('user_profiles', userProfiles, 'user_profiles.json');
    invalidateStoreCache('user_profiles');

    // 3. Synchronize super_admin_accounts store if user is an admin
    if (existingAdminAcc) {
      adminAccounts[targetEmail] = {
        ...existingAdminAcc,
        name: newFullName,
        avatar_url: resolvedAvatar || existingAdminAcc.avatar_url,
        employee_id: body.employee_id || existingAdminAcc.employee_id,
        phone: body.phone || existingAdminAcc.phone,
        updatedAt: new Date().toISOString(),
      };
      await setStoreData('super_admin_accounts', adminAccounts, 'super_admin_accounts.json');
      invalidateStoreCache('super_admin_accounts');
    }

    // 4. Update Supabase Pro profiles table directly
    let profileId = body.id || existingUserProf.id;
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', targetEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        profileId = existingProfile.id;
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name: newFullName,
            avatar_url: resolvedAvatar,
            employee_id: body.employee_id,
            phone: body.phone,
            primary_role: body.primary_role || 'All-rounder',
            batting_style: body.batting_style || 'Right-hand bat',
            bowling_style: body.bowling_style || 'Right-arm medium',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);
      } else {
        profileId = profileId || `profile-${Date.now()}`;
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: profileId,
            email: targetEmail,
            full_name: newFullName,
            avatar_url: resolvedAvatar,
            employee_id: body.employee_id,
            phone: body.phone,
            primary_role: body.primary_role || 'All-rounder',
            batting_style: body.batting_style || 'Right-hand bat',
            bowling_style: body.bowling_style || 'Right-arm medium',
            system_role: body.system_role || (existingAdminAcc ? 'super_admin' : 'user'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (e) {
      console.warn('Supabase profile update warning:', e);
    }

    // 5. Synchronize avatar and athlete details into all tournament_registrations_* in cricpluse_store
    try {
      const allStores = await supabaseAdmin.from('cricpluse_store').select('key, data').like('key', 'tournament_registrations_%');
      if (allStores.data && allStores.data.length > 0) {
        for (const item of allStores.data) {
          if (Array.isArray(item.data)) {
            let regUpdated = false;
            const updatedRegs = item.data.map((reg: any) => {
              if (reg.email && reg.email.toLowerCase().trim() === targetEmail) {
                regUpdated = true;
                return {
                  ...reg,
                  name: newFullName,
                  avatarUrl: resolvedAvatar || reg.avatarUrl,
                  role: body.primary_role || reg.role,
                  battingStyle: body.batting_style || reg.battingStyle,
                  bowlingStyle: body.bowling_style || reg.bowlingStyle,
                  employeeId: body.employee_id !== undefined ? body.employee_id : reg.employeeId,
                };
              }
              return reg;
            });
            if (regUpdated) {
              await setStoreData(item.key, updatedRegs);
              invalidateStoreCache(item.key);
            }
          }
        }
      }
    } catch (regErr) {
      console.warn('Tournament registration sync warning:', regErr);
    }

    // 5b. Synchronize avatar into auction_data_ddpl (playerPool, currentLot, and soldTransactions)
    if (resolvedAvatar) {
      try {
        const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
        let auctionUpdated = false;
        if (allAuction?.tournaments) {
          const matchName = newFullName.toLowerCase().trim();
          for (const [tSlug, tData] of Object.entries<any>(allAuction.tournaments)) {
            if (tData?.currentLot && tData.currentLot.name && tData.currentLot.name.toLowerCase().trim() === matchName) {
              tData.currentLot.avatarUrl = resolvedAvatar;
              auctionUpdated = true;
            }
            if (Array.isArray(tData?.playerPool)) {
              for (const p of tData.playerPool) {
                if (p.name && p.name.toLowerCase().trim() === matchName) {
                  p.avatarUrl = resolvedAvatar;
                  auctionUpdated = true;
                }
              }
            }
            if (Array.isArray(tData?.soldTransactions)) {
              for (const tx of tData.soldTransactions) {
                const txName = (tx.player || tx.name)?.toLowerCase().trim();
                if (txName === matchName) {
                  tx.avatarUrl = resolvedAvatar;
                  auctionUpdated = true;
                }
              }
            }
          }
        }
        if (auctionUpdated) {
          await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
          invalidateStoreCache('auction_data_ddpl');
        }
      } catch (aucErr) {
        console.warn('Auction pool photo sync warning:', aucErr);
      }
    }

    // 6. Synchronize tournament_configs creatorName for all tournaments created by this user
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
      avatar_url: resolvedAvatar,
      employee_id: body.employee_id || existingUserProf.employee_id || null,
      phone: body.phone || existingUserProf.phone || null,
      primary_role: body.primary_role || existingUserProf.primary_role || 'All-rounder',
      batting_style: body.batting_style || existingUserProf.batting_style || 'Right-hand bat',
      bowling_style: body.bowling_style || existingUserProf.bowling_style || 'Right-arm medium',
      system_role: body.system_role || existingUserProf.system_role || (existingAdminAcc ? 'super_admin' : 'user'),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Profile and avatar successfully updated across all databases and tournament configurations!',
      profile: updatedProfile,
      user: {
        id: profileId,
        email: targetEmail,
        name: newFullName,
        avatar_url: resolvedAvatar,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
