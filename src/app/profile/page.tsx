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
  const { role, refreshProfile } = useAuth();
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
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push('/auth/login');
        return;
      }

      const user = sessionData.session.user;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        if (data.avatar_url) {
          // Estimate current size if data URL
          if (data.avatar_url.startsWith('data:')) {
            const kb = Math.round((data.avatar_url.length - 22) * 0.75 / 1024);
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
      setLoading(false);
    }
    loadProfile();
  }, []);

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
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-cricket-muted">
        Loading player profile…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Profile Header */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar with Photo Upload (Max 100 KB) */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-cricket-teal to-amber-400 p-1 shadow-2xl">
              <div className="w-full h-full bg-cricket-card rounded-xl overflow-hidden flex items-center justify-center font-display font-bold text-3xl text-cricket-teal relative">
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
                  <Camera className="w-5 h-5 text-cricket-gold" />
                  <span>Change</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-cricket-teal text-cricket-dark shadow-lg hover:scale-110 transition-transform"
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-bold text-3xl text-white">
                {profile.full_name || 'Player Profile'}
              </h1>
              {photoInfo && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono">
                  {photoInfo.sizeInKb} KB / 100 KB max
                </span>
              )}
            </div>
            <p className="text-sm text-cricket-muted">{profile.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                {profile.primary_role || 'All-rounder'}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="px-2.5 py-1 rounded-xl bg-cricket-gold/15 hover:bg-cricket-gold/25 text-cricket-gold border border-cricket-gold/40 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{compressing ? 'Compressing…' : profile.avatar_url ? 'Change Photo (≤100 KB)' : 'Upload Photo (≤100 KB)'}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="glass-card p-6 sm:p-8 space-y-6">
        <h2 className="font-display font-bold text-2xl text-white border-b border-cricket-border pb-3">
          Player Profile &amp; Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Full Name</label>
            <input
              type="text"
              required
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Employee ID / Identifier</label>
            <input
              type="text"
              placeholder="e.g. EMP-4082"
              value={profile.employee_id || ''}
              onChange={(e) => setProfile({ ...profile, employee_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Primary Playing Role</label>
            <select
              value={profile.primary_role || 'All-rounder'}
              onChange={(e) => setProfile({ ...profile, primary_role: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
            >
              <option value="Batter">Batter</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicket-keeper">Wicket-keeper</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Batting Style</label>
            <select
              value={profile.batting_style || 'Right-hand bat'}
              onChange={(e) => setProfile({ ...profile, batting_style: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
            >
              <option value="Right-hand bat">Right-hand bat</option>
              <option value="Left-hand bat">Left-hand bat</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-gray-300">Bowling Style</label>
            <select
              value={profile.bowling_style || 'Right-arm medium'}
              onChange={(e) => setProfile({ ...profile, bowling_style: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cricket-dark/80 border border-cricket-border text-white text-sm focus:outline-none focus:border-cricket-teal"
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

        <div className="flex justify-end pt-4 border-t border-cricket-border">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
