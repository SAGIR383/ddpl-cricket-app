import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf';

export async function POST(req: NextRequest) {
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

  try {
    await ssrClient.auth.signOut();
  } catch {
    // Ignore error
  }

  const response = NextResponse.json({ success: true });

  const expiredOptions = {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax' as const,
  };

  // Explicitly expire Super Admin cookies
  response.cookies.set('cricplus_superadmin', '', expiredOptions);
  response.cookies.set('cricpluse_superadmin', '', expiredOptions);

  // Expire all cookies present in incoming request that relate to auth/supabase/admin
  req.cookies.getAll().forEach((c) => {
    if (
      c.name.startsWith('sb-') ||
      c.name.includes('supabase') ||
      c.name.includes('superadmin') ||
      c.name.includes('auth') ||
      c.name.includes('token')
    ) {
      response.cookies.set(c.name, '', expiredOptions);
    }
  });

  // Expire Supabase SSR cookies from ssrClient
  for (const c of cookieActions) {
    response.cookies.set(c.name, '', { ...c.options, ...expiredOptions });
  }

  return response;
}

export async function GET(req: NextRequest) {
  return POST(req);
}
