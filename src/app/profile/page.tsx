'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, CheckCircle2, AlertCircle, LogOut, Save, Trophy, Camera, UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressImageUnder100KB } from '@/lib/imageCompressor';
import type { Profile } from '@/types/database.types';

export default function ProfilePage() {
  const router = useRouter();
  const { role, isSuperAdmin, user: authUser, profile: authProfile, refreshProfile, signOut } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [photoInfo, setPhotoInfo] = useState<{ sizeInKb: number } | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      if (isSuperAdmin) {
        setProfile({
          id: authUser?.id || 'super-admin-master-id',
          email: authUser?.email || 'superadmin@cricplus.com',
          full_name: authUser?.name || 'Master Super Admin',
          primary_role: 'All-rounder',
          batting_style: 'Right-hand bat',
          bowling_style: 'Right-arm medium',
          system_role: 'super_admin',
        });
        setLoading(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          if (authUser) {
            setProfile(authProfile || { id: authUser.id, email: authUser.email });
            setLoading(false);
            return;
          }
          router.push('/auth/login');
          return;
        }

        const user = sessionData.session.user;
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
          if (data.avatar_url) {
            if (data.avatar_url.startsWith('data:')) {
              const kb = Math.round(((data.avatar_url.length - 22) * 0.75) / 1024);
              setPhotoInfo({ sizeInKb: kb });
            }
          }
        } else {
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            primary_role: 'All-rounder',
            batting_style: 'Right-hand bat',
            bowling_style: 'Right-arm medium',
          });
        }
      } catch (err) {
        if (authProfile) {
          setProfile(authProfile);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [isSuperAdmin, authUser, authProfile]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const { dataUrl, sizeInKb } = await compressImageUnder100KB(file);
      setProfile((prev) => ({ ...prev, avatar_url: dataUrl }));
      setPhotoInfo({ sizeInKb });
      setMsg({ type: 'success', text: `Photo optimized (${sizeInKb} KB / 100 KB max). Remember to click "Save Profile" below!` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to process photo' });
    } finally {
      setCompressing(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id || profile.id;

      if (!currentUserId) throw new Error('Not authenticated. Please sign in again.');

      const updateData = {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        employee_id: profile.employee_id,
        phone: profile.phone,
        primary_role: profile.primary_role,
        batting_style: profile.batting_style,
        bowling_style: profile.bowling_style,
        system_role: profile.system_role || 'user',
        updated_at: new Date().toISOString(),
      };

      // Perform direct UPDATE adhering to RLS policy 'Users can update own profile'
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentUserId);

      if (updateError) {
        // Fallback to upsert only if row did not exist yet
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: currentUserId,
            email: profile.email,
            ...updateData,
          });
        if (upsertError) throw upsertError;
      }

      await refreshProfile();
      setMsg({ type: 'success', text: 'Profile successfully updated!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      setLoading(true);
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      window.location.href = '/';
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-cricket-muted">
        Loading player profile…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 relative z-10">
      {/* Profile Header */}
      <div className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar with Photo Upload (Max 100 KB) */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] p-1 shadow-2xl shadow-[#D8AD55]/20">
              <div className="w-full h-full bg-[#08111F] rounded-2xl overflow-hidden flex items-center justify-center font-display font-black text-3xl text-[#F2D69A] relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Player'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.full_name?.charAt(0).toUpperCase() || 'P'
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1">
                  <Camera className="w-5 h-5 text-[#F2D69A]" />
                  <span>Change</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-lg hover:scale-110 transition-transform cursor-pointer"
              title="Upload photo (≤100 KB)"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display font-black text-3xl text-white tracking-tight">
                {profile.full_name || 'Player Profile'}
              </h1>
              {photoInfo && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold">
                  {photoInfo.sizeInKb} KB / 100 KB max
                </span>
              )}
            </div>
            <p className="text-sm text-[#8793A5] mt-0.5">{profile.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                {profile.primary_role || 'All-rounder'}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="px-3 py-1 rounded-xl bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 text-[#F2D69A] border border-[#D8AD55]/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>{compressing ? 'Compressing…' : profile.avatar_url ? 'Change Photo (≤100 KB)' : 'Upload Photo (≤100 KB)'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="rounded-3xl p-6 sm:p-8 space-y-6 bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/30 shadow-2xl">
        <h2 className="font-display font-black text-2xl text-white border-b border-[#D8AD55]/15 pb-4 tracking-tight">
          Player Profile &amp; Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Employee ID / Identifier</label>
            <input
              type="text"
              placeholder="e.g. EMP-4082"
              value={profile.employee_id || ''}
              onChange={(e) => setProfile({ ...profile, employee_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Primary Playing Role</label>
            <select
              value={profile.primary_role || 'All-rounder'}
              onChange={(e) => setProfile({ ...profile, primary_role: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
            >
              <option value="Batter">Batter</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicket-keeper">Wicket-keeper</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Batting Style</label>
            <select
              value={profile.batting_style || 'Right-hand bat'}
              onChange={(e) => setProfile({ ...profile, batting_style: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
            >
              <option value="Right-hand bat">Right-hand bat</option>
              <option value="Left-hand bat">Left-hand bat</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">Bowling Style</label>
            <select
              value={profile.bowling_style || 'Right-arm medium'}
              onChange={(e) => setProfile({ ...profile, bowling_style: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm focus:outline-none focus:border-[#D8AD55]"
            >
              <option value="Right-arm fast">Right-arm fast</option>
              <option value="Right-arm medium">Right-arm medium</option>
              <option value="Right-arm off-spin">Right-arm off-spin</option>
              <option value="Right-arm leg-spin">Right-arm leg-spin</option>
              <option value="Left-arm fast">Left-arm fast</option>
              <option value="Left-arm medium">Left-arm medium</option>
              <option value="Left-arm orthodox">Left-arm orthodox</option>
              <option value="Left-arm chinaman">Left-arm chinaman</option>
              <option value="None">None (Pure Batter)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-[#D8AD55]/15">
          <button
            type="submit"
            disabled={saving}
            className="btn-press shimmer-btn flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
