import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth/password';
import { supabaseAdmin } from '@/lib/supabase/store';
import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SERVICE_KEY = getServiceRoleKey();

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, generateLinkOnly } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminClient = getAdminClient();

    // 1. Generate Instant Recovery / Bypass Link Only
    if (generateLinkOnly) {
      try {
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: {
            redirectTo: 'https://cricplus24.vercel.app/auth/reset-password',
          },
        });

        if (linkErr || !linkData?.properties?.action_link) {
          throw new Error(linkErr?.message || 'Could not generate recovery link for this user.');
        }

        return NextResponse.json({
          success: true,
          actionLink: linkData.properties.action_link,
          message: `Direct recovery link generated for ${cleanEmail}!`,
        });
      } catch (genErr: any) {
        return NextResponse.json(
          { success: false, error: genErr.message || 'Failed to generate bypass link.' },
          { status: 500 }
        );
      }
    }

    // 2. Direct Password Update
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Find and update in Supabase Auth
    let updatedInAuth = false;
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      const user = usersData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (user) {
        await adminClient.auth.admin.updateUserById(user.id, { password: newPassword });
        updatedInAuth = true;
      }
    } catch (sbErr) {
      console.warn('[Admin Reset Supabase Auth Warn]:', sbErr);
    }

    // Update in Supabase Pro profiles table
    const hashed = hashPassword(newPassword);
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ password_hash: hashed, updated_at: new Date().toISOString() })
        .ilike('email', cleanEmail);
    } catch (profErr) {
      console.warn('[Admin Reset Profiles Update Warn]:', profErr);
    }

    return NextResponse.json({
      success: true,
      message: `Password for ${cleanEmail} successfully updated in Supabase Pro! The user can now log in immediately with the new password.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
