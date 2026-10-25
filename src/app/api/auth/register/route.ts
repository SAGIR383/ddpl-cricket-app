import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf';
const SUPABASE_SERVICE_KEY = getServiceRoleKey();

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || cleanEmail.split('@')[0]).trim();

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

    const { data: signUpData, error: signUpError } = await ssrClient.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { success: false, error: signUpError.message },
        { status: 400 }
      );
    }

    // Upsert into profiles table
    if (signUpData.user?.id) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
      });
      await adminClient.from('profiles').upsert({
        id: signUpData.user.id,
        email: cleanEmail,
        full_name: cleanName,
        system_role: 'user',
        primary_role: 'All-rounder',
        batting_style: 'Right-hand bat',
        bowling_style: 'Right-arm medium',
        updated_at: new Date().toISOString(),
      });
    }

    const response = NextResponse.json({
      success: true,
      user: signUpData.user,
      session: signUpData.session,
      message: signUpData.session
        ? 'Account created and signed in successfully!'
        : 'Account created! Please sign in with your credentials.',
    });

    for (const c of cookieActions) {
      response.cookies.set(c.name, c.value, { ...c.options, path: '/' });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'An error occurred during registration.' },
      { status: 500 }
    );
  }
}
