import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword, generateLinkOnly } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Find the user by email
    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        { success: false, error: `User with email "${email}" was not found in registered auth users.` },
        { status: 404 }
      );
    }

    // 1. If admin wants a 1-click bypass link to send to the player
    if (generateLinkOnly) {
      const origin = req.nextUrl.origin || 'https://ddpl-cricket-app.vercel.app';
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email!,
        options: {
          redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
        },
      });
      if (linkErr) throw linkErr;

      return NextResponse.json({
        success: true,
        actionLink: linkData?.properties?.action_link,
        message: `Bypass recovery link generated for ${user.email}`,
      });
    }

    // 2. Direct password update
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      message: `Password for ${user.email} successfully updated! The user can now log in immediately with the new password.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
