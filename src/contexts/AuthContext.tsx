'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, SystemRole } from '@/types/database.types';

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
      const res = await fetch(`/api/roles/me?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.role) return data.role as SystemRole;
      }
    } catch (err) {
      console.error('Error fetching assigned role:', err);
    }
    return 'user';
  };

  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch role assigned by Super Admin in backend
      const assignedRole = userEmail ? await fetchAssignedRole(userEmail) : 'user';

      if (data) {
        setProfile({
          ...(data as Profile),
          system_role: assignedRole || data.system_role || 'user',
        });
        setActiveRole(assignedRole || (data.system_role as SystemRole) || 'user');
      } else {
        const defaultProfile: Profile = {
          id: userId,
          email: userEmail || '',
          full_name: userMeta?.full_name || userEmail?.split('@')[0] || 'User',
          avatar_url: null,
          employee_id: null,
          phone: null,
          batting_style: 'Right-hand bat',
          bowling_style: 'Right-arm medium',
          primary_role: 'All-rounder',
          system_role: assignedRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(defaultProfile);
        setActiveRole(assignedRole);
      }
    } catch {
      setProfile(null);
      setActiveRole('user');
    }
  };

  const refreshProfile = async () => {
    // 1. First check if Super Admin session is active
    try {
      const adminRes = await fetch('/api/admin/auth');
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.authenticated && adminData.user) {
          setUser(adminData.user);
          setProfile({
            id: adminData.user.id,
            email: adminData.user.email,
            full_name: adminData.user.name,
            avatar_url: null,
            employee_id: 'SUPERADMIN-001',
            phone: null,
            batting_style: 'Right-hand bat',
            bowling_style: 'Right-arm medium',
            primary_role: 'All-rounder',
            system_role: 'super_admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setActiveRole('super_admin');
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Continue to Supabase session check
    }

    // 2. Regular user Supabase auth session check
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user || null;
    setUser(currentUser);

    if (currentUser) {
      await fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata);
    } else {
      setProfile(null);
      setActiveRole('user');
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshProfile();

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

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
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
