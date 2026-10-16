import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '@/lib/supabase/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase();

  if (!email) {
    return NextResponse.json({ role: 'user' });
  }

  const roles = await getStoreData<Record<string, string>>('user_roles', 'roles.json', {});
  const assignedRole = roles[email] || 'user';

  return NextResponse.json(
    { email, role: assignedRole },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    }
  );
}
