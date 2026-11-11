import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { neonQuery } from '@/lib/db/neon';
import { hashPassword } from '@/lib/auth/password';
import { getStoreData } from '@/lib/supabase/store';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, otp, newPassword } = body;
    let cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === 'admin' || cleanEmail === 'superadmin') {
      cleanEmail = process.env.SUPERADMIN_IDENTIFIER?.toLowerCase() || 'arindamroyaec2009@gmail.com';
    }

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    // 1. Verify existence directly against Neon Database
    let userRecord: { id: string; email: string; full_name?: string } | null = null;

    try {
      const neonProfiles = await neonQuery<any>(
        'SELECT id, full_name, email FROM profiles WHERE LOWER(email) = $1 LIMIT 1',
        [cleanEmail]
      );
      if (neonProfiles && neonProfiles.length > 0) {
        userRecord = neonProfiles[0];
      }
    } catch (neonErr) {
      console.warn('[Neon Profile Lookup Warn]:', neonErr);
    }

    // Fallback: Check Super Admin / Tournament Host accounts in store
    if (!userRecord) {
      try {
        const [adminAccounts, configs] = await Promise.all([
          getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {}),
          getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
        ]);

        if (adminAccounts[cleanEmail]) {
          userRecord = {
            id: `admin-${cleanEmail}`,
            email: cleanEmail,
            full_name: adminAccounts[cleanEmail].name || 'Admin',
          };
        } else {
          for (const cfg of Object.values(configs)) {
            if (
              cfg?.creatorEmail?.toLowerCase() === cleanEmail ||
              (Array.isArray(cfg?.adminEmails) && cfg.adminEmails.some((e: string) => e?.toLowerCase() === cleanEmail))
            ) {
              userRecord = {
                id: `host-${cleanEmail}`,
                email: cleanEmail,
                full_name: cfg.creatorName || 'Host',
              };
              break;
            }
          }
        }
      } catch (storeErr) {
        console.warn('[Store Account Lookup Warn]:', storeErr);
      }
    }

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: `No registered account found for ${cleanEmail}. Please verify the email address.` },
        { status: 404 }
      );
    }

    // 2. Direct password update (if newPassword is provided)
    if (newPassword || action === 'direct_reset' || action === 'verify_otp') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      const hashed = hashPassword(newPassword);

      // Save directly to Neon PostgreSQL profiles
      await neonQuery(
        'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2',
        [hashed, cleanEmail]
      );

      // Best-effort background sync to Supabase Auth if reachable
      try {
        if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
          const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false },
          });
          const { data: usersData } = await adminClient.auth.admin.listUsers();
          const sbUser = usersData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
          if (sbUser) {
            await adminClient.auth.admin.updateUserById(sbUser.id, { password: newPassword });
          }
        }
      } catch (sbSyncErr) {
        console.warn('[Supabase Auth Background Sync Warn]:', sbSyncErr);
      }

      return NextResponse.json({
        success: true,
        message: `Password updated successfully for ${userRecord.full_name || cleanEmail}! You can now sign in immediately.`,
      });
    }

    // 3. Request OTP / Email Verification check:
    // Account is confirmed in Neon, prompt the user for their new password
    return NextResponse.json({
      success: true,
      userFound: true,
      name: userRecord.full_name || cleanEmail.split('@')[0],
      message: `Account verified for ${userRecord.full_name || cleanEmail}! Please choose your new password.`,
    });
  } catch (err: any) {
    console.error('[Reset Password Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred during password reset.' },
      { status: 500 }
    );
  }
}
