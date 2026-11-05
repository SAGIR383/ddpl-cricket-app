'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, SystemRole } from '@/types/database.types';
import { fetchWithCache } from '@/lib/clientCache';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: SystemRole;
  isSuperAdmin: boolean;
  isOrganizer: boolean;
  isScorer: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: 'user',
  isSuperAdmin: false,
  isOrganizer: false,
  isScorer: false,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRole, setActiveRole] = useState<SystemRole>('user');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Helper to fetch backend assigned role for any email
  const fetchAssignedRole = async (email: string): Promise<SystemRole> => {
    try {
      const res = await fetch(`/api/roles/me?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.role) return data.role as SystemRole;
      }
    } catch (err) {
      console.error('Error fetching assigned role:', err);
    }
    return 'user';
  };

  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
      let data: any = null;
      const { data: byId } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone, employee_id, batting_style, bowling_style, primary_role, system_role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
      data = byId;

      if ((!data || !data.full_name) && userEmail) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, phone, employee_id, batting_style, bowling_style, primary_role, system_role, created_at, updated_at')
          .eq('email', userEmail.toLowerCase().trim())
          .maybeSingle();
        if (byEmail?.full_name) {
          data = byEmail;
        }
      }

      // Master Super Admin check strictly for platform owners
      const isMasterEmail =
        userEmail?.toLowerCase() === 'arindamroyaec2009@gmail.com' ||
        userEmail?.toLowerCase() === 'superadmin@cricplus.com' ||
        userEmail?.toLowerCase() === 'superadmin@cricpluse.com';

      // Verify admin session cookie belongs strictly to the currently authenticated user
      let hasAdminCookie = false;
      if (typeof document !== 'undefined' && userEmail) {
        const cookies = document.cookie.split(';');
        for (const c of cookies) {
          const [k, v] = c.trim().split('=');
          if ((k === 'cricplus_superadmin' || k === 'cricpluse_superadmin') && v) {
            if (v.startsWith('active_session:')) {
              try {
                const b64 = v.split(':')[1];
                const cookieEmail = atob(b64).toLowerCase().trim();
                if (cookieEmail === userEmail.toLowerCase().trim()) {
                  hasAdminCookie = true;
                }
              } catch {}
            }
          }
        }
      }

      // Fetch role assigned by Super Admin in backend
      const assignedRole = (isMasterEmail || hasAdminCookie)
        ? 'super_admin'
        : (userEmail ? await fetchAssignedRole(userEmail) : 'user');

      const localCachedAvatar =
        typeof window !== 'undefined' && userEmail
          ? localStorage.getItem(`cricplus_avatar_${userEmail.toLowerCase().trim()}`)
          : null;

      const resolvedAvatar =
        data?.avatar_url ||
        userMeta?.avatar_url ||
        userMeta?.picture ||
        localCachedAvatar ||
        null;

      if (data && data.full_name) {
        setProfile({
          ...(data as Profile),
          avatar_url: resolvedAvatar,
          system_role: assignedRole || data.system_role || 'user',
        });
        setActiveRole(assignedRole || (data.system_role as SystemRole) || 'user');
      } else {
        const resolvedName =
          userMeta?.full_name ||
          userMeta?.name ||
          (userEmail ? userEmail.split('@')[0] : 'Tournament Athlete');
        const defaultProfile: Profile = {
          id: userId,
          email: userEmail || '',
          full_name: resolvedName,
          avatar_url: resolvedAvatar,
          employee_id: data?.employee_id || null,
          phone: data?.phone || null,
          batting_style: data?.batting_style || 'Right-hand bat',
          bowling_style: data?.bowling_style || 'Right-arm medium',
          primary_role: data?.primary_role || 'All-rounder',
          system_role: assignedRole || data?.system_role || 'user',
          created_at: data?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(defaultProfile);
        setActiveRole(assignedRole || data?.system_role || 'user');
      }
    } catch {
      setProfile(null);
      setActiveRole('user');
    }
  };

  const refreshProfile = async () => {
    // 1. Regular user Supabase auth session check (Primary source of truth for accounts)
    try {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Session check fallback:', e);
    }

    // 2. Check if Super Admin session is active
    try {
      const adminRes = await fetch('/api/admin/auth', { cache: 'no-store' });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.authenticated && adminData.user) {
          const isMaster =
            adminData.user.id === 'super-admin-master-id' ||
            adminData.user.role === 'super_admin';
          const resolvedRole: SystemRole = isMaster ? 'super_admin' : 'organizer';

          const cleanAdminName =
            adminData.user.name &&
            !adminData.user.name.includes('Super Admin') &&
            !adminData.user.name.includes('DDPL') &&
            !adminData.user.name.includes('Organizer')
              ? adminData.user.name
              : (adminData.user.email ? adminData.user.email.split('@')[0] : 'User');

          const adminEmail = (adminData.user.email || '').toLowerCase().trim();
          const adminAvatar =
            adminData.user.avatar_url ||
            (typeof window !== 'undefined' && adminEmail
              ? localStorage.getItem(`cricplus_avatar_${adminEmail}`)
              : null) ||
            null;

          setUser({
            ...adminData.user,
            name: cleanAdminName,
            avatar_url: adminAvatar,
          });
          setProfile({
            id: adminData.user.id,
            email: adminData.user.email,
            full_name: cleanAdminName,
            avatar_url: adminAvatar,
            employee_id: isMaster ? 'SUPERADMIN-001' : 'ORGANIZER-001',
            phone: null,
            batting_style: 'Right-hand bat',
            bowling_style: 'Right-arm medium',
            primary_role: 'All-rounder',
            system_role: resolvedRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setActiveRole(resolvedRole);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Continue
    }

    setProfile(null);
    setActiveRole('user');
    setLoading(false);
  };

  useEffect(() => {
    refreshProfile();

    let subscription: any = null;
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata);
        } else {
          // If Supabase signed out, verify if Super Admin is active
          await refreshProfile();
        }
        setLoading(false);
      });
      subscription = authListener?.subscription;
    } catch (e) {
      console.warn('Auth state listener init fallback:', e);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    } catch {}
    try {
      await fetch('/api/admin/auth', { method: 'DELETE', cache: 'no-store' });
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}

    // Flush client cookies & local cache directly to guarantee mobile app & web logout
    if (typeof document !== 'undefined') {
      const cookiesToWipe = ['cricplus_superadmin', 'cricpluse_superadmin'];
      document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0].trim();
        if (
          name.startsWith('sb-') ||
          name.includes('supabase') ||
          name.includes('superadmin') ||
          name.includes('auth')
        ) {
          cookiesToWipe.push(name);
        }
      });
      cookiesToWipe.forEach((name) => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
        try {
          if (window.location.hostname) {
            document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
          }
        } catch {}
      });
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    }

    setUser(null);
    setProfile(null);
    setActiveRole('user');
  };

  const isSuperAdmin = activeRole === 'super_admin';
  const isOrganizer = activeRole === 'organizer' || isSuperAdmin;
  const isScorer = activeRole === 'scorer' || isOrganizer;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: activeRole,
        isSuperAdmin,
        isOrganizer,
        isScorer,
        isAdmin: isOrganizer,
        loading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
