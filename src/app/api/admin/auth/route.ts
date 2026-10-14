import { NextRequest, NextResponse } from 'next/server';

const SUPERADMIN_IDENTIFIER = process.env.SUPERADMIN_IDENTIFIER || 'superadmin@cricpluse.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const normalizedUser = (username || '').trim().toLowerCase();
    const providedPass = (password || '').trim();

    if (
      (normalizedUser === SUPERADMIN_IDENTIFIER || normalizedUser === 'admin' || normalizedUser === 'superadmin') &&
      providedPass === SUPERADMIN_PASSWORD
    ) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'super-admin-master-id',
          email: SUPERADMIN_IDENTIFIER,
          name: 'Master Super Admin',
          role: 'super_admin',
        },
      });

      // Set cookie for persistence
      response.cookies.set('cricpluse_superadmin', 'active_session', {
        path: '/',
        httpOnly: false, // Accessible by client AuthContext
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid Super Admin credentials' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('cricpluse_superadmin');
  if (cookie?.value === 'active_session') {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'super-admin-master-id',
        email: SUPERADMIN_IDENTIFIER,
        name: 'Master Super Admin',
        role: 'super_admin',
      },
    });
  }
  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('cricpluse_superadmin');
  return response;
}
