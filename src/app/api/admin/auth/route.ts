import { NextRequest, NextResponse } from 'next/server';

const SUPERADMIN_IDENTIFIER = process.env.SUPERADMIN_IDENTIFIER || 'superadmin@cricplus.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const normalizedUser = (username || '').trim().toLowerCase();
    const providedPass = (password || '').trim();

    const isValidUser =
      normalizedUser === 'superadmin@cricplus.com' ||
      normalizedUser === 'superadmin@cricpluse.com' ||
      normalizedUser === SUPERADMIN_IDENTIFIER.toLowerCase() ||
      normalizedUser === 'admin' ||
      normalizedUser === 'superadmin';

    if (isValidUser && providedPass === SUPERADMIN_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'super-admin-master-id',
          email: 'superadmin@cricplus.com',
          name: 'Master Super Admin',
          role: 'super_admin',
        },
      });

      // Set cookie for persistence (both cricplus and legacy cricpluse)
      response.cookies.set('cricplus_superadmin', 'active_session', {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      response.cookies.set('cricpluse_superadmin', 'active_session', {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
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
  const cookie = req.cookies.get('cricplus_superadmin') || req.cookies.get('cricpluse_superadmin');
  if (cookie?.value === 'active_session') {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'super-admin-master-id',
        email: 'superadmin@cricplus.com',
        name: 'Master Super Admin',
        role: 'super_admin',
      },
    });
  }
  return NextResponse.json({ authenticated: false });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('cricplus_superadmin');
  response.cookies.delete('cricpluse_superadmin');
  return response;
}
