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

  // Query Supabase profiles
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: dbProfiles } = await supabase.from('profiles').select('*');

  const registeredUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinedDate: string;
  }> = [];

  const seenEmails = new Set<string>();

  if (dbProfiles && dbProfiles.length > 0) {
    for (const p of dbProfiles) {
      const emailLower = p.email.toLowerCase();
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

  // Include any roles assigned in roles.json not yet in profiles
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
