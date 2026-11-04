import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') || (token_hash ? 'email' : 'signup');
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  // If Supabase returned an error (e.g. otp_expired, access_denied)
  if (error || errorCode || errorDescription) {
    const errorMsg = errorDescription || error || 'Verification link is invalid or has expired.';
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const defaultNext = type === 'recovery' ? '/auth/reset-password' : '/profile';
  const next = searchParams.get('next') ?? defaultNext;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignored if called during streaming
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignored if called during streaming
          }
        },
      },
    }
  );

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`);
    }
  }

  if (token_hash) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (!verifyError) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(verifyError.message)}`);
    }
  }

  // Fallback
  return NextResponse.redirect(`${origin}${next}`);
}
