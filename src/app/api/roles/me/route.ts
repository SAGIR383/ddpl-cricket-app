import { NextRequest, NextResponse } from 'next/server';
import { getStoreData } from '@/lib/supabase/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase()?.trim();

  if (!email) {
    return NextResponse.json({ role: 'user' });
  }

  // 1. Platform Master Super Admin emails
  const isMaster =
    email === 'arindamroyaec2009@gmail.com' ||
    email === 'mdsagirhossain560@gmail.com' ||
    email === 'superadmin@cricplus.com' ||
    email === 'superadmin@cricpluse.com';

  if (isMaster) {
    return NextResponse.json({ email, role: 'super_admin' });
  }

  // 2. Fetch parallel store records with real-time freshness
  const [superAdminAccounts, configs, roles] = await Promise.all([
    getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {}, true),
    getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}, true),
    getStoreData<Record<string, string>>('user_roles', 'roles.json', {}, true),
  ]);

  if (superAdminAccounts[email]?.role === 'super_admin') {
    return NextResponse.json({ email, role: 'super_admin' });
  }

  // 3. Tournament creator or organizer admin
  const isTournamentAdmin = Object.values(configs).some((t: any) => {
    const creator = t.creatorEmail?.toLowerCase();
    const isAdmin = Array.isArray(t.adminEmails) && t.adminEmails.some((e: string) => e?.toLowerCase() === email);
    return creator === email || isAdmin;
  });

  if (isTournamentAdmin) {
    return NextResponse.json({ email, role: 'super_admin' });
  }

  // 4. Assigned user role or default
  const assignedRole = roles[email] || 'user';

  return NextResponse.json(
    { email, role: assignedRole },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
