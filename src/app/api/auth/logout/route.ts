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

  // Delete Super Admin cookies
  response.cookies.delete('cricplus_superadmin');
  response.cookies.delete('cricpluse_superadmin');

  // Delete all Supabase auth cookies
  for (const c of cookieActions) {
    response.cookies.set(c.name, '', { ...c.options, maxAge: 0, path: '/' });
  }

  return response;
}
