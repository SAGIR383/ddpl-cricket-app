import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf';

async function getStoredRoles(): Promise<Record<string, string>> {
  return getStoreData<Record<string, string>>('user_roles', 'roles.json', {});
}

async function saveStoredRoles(roles: Record<string, string>) {
  return setStoreData('user_roles', roles, 'roles.json');
}

export async function GET() {
  const storedRoles = await getStoredRoles();

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const registeredUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinedDate: string;
  }> = [];

  const seenEmails = new Set<string>();

  // 1. Fetch from Supabase Auth admin
  try {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (!u.email) continue;
        const emailLower = u.email.toLowerCase();
        seenEmails.add(emailLower);
        registeredUsers.push({
          id: u.id,
          name: (u.user_metadata?.full_name as string) || emailLower.split('@')[0],
          email: u.email,
          role: storedRoles[emailLower] || (emailLower.includes('superadmin') ? 'super_admin' : 'user'),
          joinedDate: u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : 'Recent',
        });
      }
    }
  } catch (err) {
    // Fallback if admin query fails
  }

  // 2. Query Supabase profiles if any
  try {
    const { data: dbProfiles } = await supabaseAdmin.from('profiles').select('*');
    if (dbProfiles) {
      for (const p of dbProfiles) {
        const emailLower = p.email?.toLowerCase();
        if (!emailLower || seenEmails.has(emailLower)) continue;
        seenEmails.add(emailLower);
        registeredUsers.push({
          id: p.id,
          name: p.full_name || emailLower.split('@')[0],
          email: p.email,
          role: storedRoles[emailLower] || p.system_role || 'user',
          joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : 'Recent',
        });
      }
    }
  } catch {}

  // 3. Include any roles assigned in roles.json not yet in profiles
  for (const [email, role] of Object.entries(storedRoles)) {
    if (!seenEmails.has(email.toLowerCase())) {
      registeredUsers.push({
        id: `u-${email}`,
        name: email.split('@')[0],
        email: email,
        role: role,
        joinedDate: 'System',
      });
    }
  }

  return NextResponse.json({ users: registeredUsers });
}

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ success: false, error: 'Email and role are required' }, { status: 400 });
    }

    const validRoles = ['super_admin', 'organizer', 'scorer', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const storedRoles = await getStoredRoles();
    storedRoles[normalizedEmail] = role;
    await saveStoredRoles(storedRoles);

    // Also attempt update on Supabase profiles
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('profiles')
        .update({ system_role: role })
        .eq('email', normalizedEmail);
    } catch {
      // Ignored if RLS restricts anon update
    }

    return NextResponse.json({
      success: true,
      message: `Role for ${normalizedEmail} successfully updated to ${role.toUpperCase()}`,
      email: normalizedEmail,
      role,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
