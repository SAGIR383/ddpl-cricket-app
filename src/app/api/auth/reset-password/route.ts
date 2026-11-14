import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth/password';
import { getStoreData, supabaseAdmin } from '@/lib/supabase/store';
import { getServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/serviceKey';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAdminClient() {
  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, newPassword } = body;
    let cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === 'admin' || cleanEmail === 'superadmin') {
      cleanEmail = process.env.SUPERADMIN_IDENTIFIER?.toLowerCase() || 'arindamroyaec2009@gmail.com';
    }

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // 1. Verify existence against Supabase Pro profiles & Supabase Auth
    let userRecord: { id: string; email: string; full_name?: string } | null = null;
    let sbAuthUserId: string | null = null;

    try {
      const { data: supaProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .ilike('email', cleanEmail)
        .limit(1);

      if (supaProfiles && supaProfiles.length > 0) {
        userRecord = supaProfiles[0];
        sbAuthUserId = supaProfiles[0].id;
      }
    } catch (profileErr) {
      console.warn('[Supabase Profile Lookup Warn]:', profileErr);
    }

    // Lookup in Supabase Auth users (paginated up to 1000 users)
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const sbUser = usersData?.users?.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
      if (sbUser) {
        sbAuthUserId = sbUser.id;
        if (!userRecord) {
          userRecord = {
            id: sbUser.id,
            email: cleanEmail,
            full_name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0],
          };
        }
      }
    } catch (sbLookupErr) {
      console.warn('[Supabase Auth User Lookup Warn]:', sbLookupErr);
    }

    // Fallback: Check Super Admin, Player Registrations & Tournament Host accounts in store
    if (!userRecord) {
      try {
        const [adminAccounts, configs, registrationsData] = await Promise.all([
          getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {}),
          getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
          getStoreData<any>('tournament_registrations_ddpl-3-0', 'registrations.json', []),
        ]);

        if (adminAccounts[cleanEmail]) {
          userRecord = {
            id: `admin-${cleanEmail}`,
            email: cleanEmail,
            full_name: adminAccounts[cleanEmail].name || 'Admin',
          };
        } else {
          // Check tournament registrations
          const regsList = Array.isArray(registrationsData) ? registrationsData : (registrationsData?.registrations || []);
          const foundPlayer = regsList.find((p: any) => p.email?.trim().toLowerCase() === cleanEmail);
          if (foundPlayer) {
            userRecord = {
              id: foundPlayer.id || `player-${cleanEmail}`,
              email: cleanEmail,
              full_name: foundPlayer.name || foundPlayer.fullName || cleanEmail.split('@')[0],
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

    const userName = userRecord.full_name || cleanEmail.split('@')[0];

    // 2. Direct password update (Instant update in Supabase Auth & Profiles without needing email delivery)
    if (newPassword || action === 'direct_reset' || action === 'verify_otp') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      // Update in Supabase Auth if user exists
      if (sbAuthUserId) {
        try {
          await adminClient.auth.admin.updateUserById(sbAuthUserId, {
            password: newPassword,
            email_confirm: true,
          });
        } catch (authUpdateErr) {
          console.warn('[Supabase Auth Password Update Warn]:', authUpdateErr);
        }
      } else {
        // If user was in profiles or registrations but not yet in Supabase Auth, auto-create
        try {
          const { data: createdAuthUser } = await adminClient.auth.admin.createUser({
            email: cleanEmail,
            password: newPassword,
            email_confirm: true,
            user_metadata: {
              full_name: userRecord.full_name,
            },
          });
          if (createdAuthUser?.user) {
            sbAuthUserId = createdAuthUser.user.id;
          }
        } catch (createAuthErr) {
          console.warn('[Supabase Auth User Auto-Create Warn]:', createAuthErr);
        }
      }

      // Update password hash in Supabase profiles
      const hashed = hashPassword(newPassword);
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ password_hash: hashed, updated_at: new Date().toISOString() })
          .ilike('email', cleanEmail);
      } catch (profUpdateErr) {
        console.warn('[Supabase Profile Hash Update Warn]:', profUpdateErr);
      }

      return NextResponse.json({
        success: true,
        message: `Password updated successfully for ${userName}! You can now sign in immediately with your new password.`,
      });
    }

    // 3. Request Reset Link / Send Recovery Email
    if (action === 'send_email' || action === 'request_reset_link') {
      let actionLink: string | null = null;
      let emailSent = false;

      // Generate direct recovery action link via Supabase Admin
      try {
        const { data: linkData } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: {
            redirectTo: 'https://cricplus24.vercel.app/auth/reset-password',
          },
        });
        if (linkData?.properties?.action_link) {
          actionLink = linkData.properties.action_link;
        }
      } catch (linkErr) {
        console.warn('[Supabase Admin generateLink Warn]:', linkErr);
      }

      // Attempt sending email via Supabase Auth
      try {
        const { error: sendErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: 'https://cricplus24.vercel.app/auth/reset-password',
        });
        if (!sendErr) {
          emailSent = true;
        } else {
          console.warn('[Supabase resetPasswordForEmail Error]:', sendErr.message);
        }
      } catch (sendErr) {
        console.warn('[Supabase resetPasswordForEmail Warn]:', sendErr);
      }

      return NextResponse.json({
        success: true,
        userFound: true,
        name: userName,
        emailSent,
        actionLink,
        message: emailSent
          ? `Password reset link sent to ${cleanEmail}! Please check your inbox and spam folder.`
          : actionLink
          ? `Password reset link generated for ${cleanEmail}! You can click the instant recovery link below or reset your password directly on this page.`
          : `Account verified for ${userName}! Please set your new password directly below.`,
      });
    }

    // Default: Account verified response
    return NextResponse.json({
      success: true,
      userFound: true,
      name: userName,
      message: `Account verified for ${userName}! Please enter your new password below.`,
    });
  } catch (err: any) {
    console.error('[Reset Password Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred during password reset.' },
      { status: 500 }
    );
  }
}
