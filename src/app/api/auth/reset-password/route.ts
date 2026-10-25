import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export async function POST(req: NextRequest) {
  try {
    const { action, email, otp, newPassword } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Request OTP / Reset Email
    if (action === 'request_otp') {
      const origin = req.nextUrl.origin || 'https://ddpl-cricket-app.vercel.app';
      const redirectUrl = `${origin}/auth/callback?next=/auth/reset-password`;

      const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (resetErr) {
        // Fallback to generating link or checking if user exists
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const user = usersData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

        if (!user) {
          return NextResponse.json(
            { success: false, error: `No registered account found for ${cleanEmail}.` },
            { status: 404 }
          );
        }

        // Try signInWithOtp as fallback
        const { error: otpErr } = await adminClient.auth.signInWithOtp({
          email: cleanEmail,
          options: { emailRedirectTo: redirectUrl },
        });

        if (otpErr) {
          return NextResponse.json({ success: false, error: otpErr.message }, { status: 400 });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Password reset instructions sent to ${cleanEmail}. Please check your inbox or spam folder.`,
      });
    }

    // 2. Verify OTP and Set New Password
    if (action === 'verify_otp') {
      if (!otp || !newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Valid 6-digit code and new password (min 6 chars) are required.' },
          { status: 400 }
        );
      }

      // Verify OTP token with Supabase Auth
      const { data: verifyData, error: verifyErr } = await adminClient.auth.verifyOtp({
        email: cleanEmail,
        token: otp.trim(),
        type: 'recovery',
      });

      let userId = verifyData?.user?.id;

      if (verifyErr || !userId) {
        // Try 'email' type verify
        const { data: verifyEmailData, error: verifyEmailErr } = await adminClient.auth.verifyOtp({
          email: cleanEmail,
          token: otp.trim(),
          type: 'email',
        });

        if (verifyEmailErr || !verifyEmailData?.user?.id) {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired 6-digit verification code. Please request a new code.' },
            { status: 400 }
          );
        }
        userId = verifyEmailData.user.id;
      }

      // Update user password with admin client
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully! You can now log in immediately.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing request.' },
      { status: 500 }
    );
  }
}
