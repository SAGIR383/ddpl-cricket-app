'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Radio,
  Flame,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Edit3,
  X,
  Check,
  Megaphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { LiveAnnouncementData } from '@/app/api/announcement/route';

interface LiveAnnouncementTickerProps {
  announcement: LiveAnnouncementData | null;
  isSuperAdmin?: boolean;
  onRefresh?: () => void;
}

export function LiveAnnouncementTicker({
  announcement,
  isSuperAdmin = false,
  onRefresh,
}: LiveAnnouncementTickerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [formMessage, setFormMessage] = useState(announcement?.message || '');
  const [formType, setFormType] = useState<LiveAnnouncementData['type']>(
    announcement?.type || 'championship'
  );
  const [formIsActive, setFormIsActive] = useState<boolean>(
    announcement?.isActive !== undefined ? announcement.isActive : true
  );
  const [formLinkText, setFormLinkText] = useState(announcement?.linkText || '');
  const [formLinkUrl, setFormLinkUrl] = useState(announcement?.linkUrl || '');

  // If no announcement or deactivated and not admin, hide
  if (!announcement || (!announcement.isActive && !isSuperAdmin)) {
    return null;
  }

  const badgeStyles = {
    breaking: {
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      dotColor: 'bg-rose-500',
      pillText: 'BREAKING NEWS',
      glow: 'shadow-rose-500/20',
      accentColor: 'text-rose-400',
    },
    live: {
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      dotColor: 'bg-blue-400',
      pillText: 'LIVE BROADCAST',
      glow: 'shadow-blue-500/20',
      accentColor: 'text-blue-400',
    },
    championship: {
      badgeBg: 'bg-[#D8AD55]/20 text-[#F2D69A] border-[#D8AD55]/50',
      dotColor: 'bg-[#D8AD55]',
      pillText: 'LEAGUE BULLETIN',
      glow: 'shadow-[#D8AD55]/20',
      accentColor: 'text-[#F2D69A]',
    },
    alert: {
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      dotColor: 'bg-emerald-400',
      pillText: 'TOURNAMENT ALERT',
      glow: 'shadow-emerald-500/20',
      accentColor: 'text-emerald-400',
    },
  };

  const currentBadge = badgeStyles[announcement.type || 'championship'];

  const handleOpenEdit = () => {
    setFormMessage(announcement.message);
    setFormType(announcement.type || 'championship');
    setFormIsActive(announcement.isActive);
    setFormLinkText(announcement.linkText || '');
    setFormLinkUrl(announcement.linkUrl || '');
    setIsEditModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: formMessage.trim(),
          type: formType,
          isActive: formIsActive,
          linkText: formLinkText.trim(),
          linkUrl: formLinkUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Failed to update live announcement.');
      }
    } catch (err: any) {
      alert(`Error saving announcement: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const quickPresets = [
    {
      label: 'DDPL 2.0 Launch Alert',
      type: 'championship' as const,
      message: '🏏 Most awaited league for this year DDPL 2.0 is going to start soon... Keep playing hard! Player registration details updating soon.',
      linkText: 'View Tournaments',
      linkUrl: '/tournaments',
    },
    {
      label: 'Auction Arena Live',
      type: 'live' as const,
      message: '🔥 Live Franchise Player Auction is now active! 6 Teams competing in the live bidding arena.',
      linkText: 'Enter Auction Arena',
      linkUrl: '/auction',
    },
    {
      label: 'Breaking Match Update',
      type: 'breaking' as const,
      message: '⚡ High-stakes playoff clash under stadium floodlights! Real-time ball-by-ball scorecards streaming now.',
      linkText: 'Live Match Center',
      linkUrl: '/matches',
    },
  ];

  return (
    <>
      {/* 1. MAIN BROADCAST STRIP (Directly in marked space between Hero & Metrics) */}
      <div className="relative w-full z-20 transition-all duration-300">
        <div
          className={`relative overflow-hidden rounded-2xl bg-[#08111F]/90 backdrop-blur-xl border ${
            announcement.isActive ? 'border-[#D8AD55]/40 shadow-[0_8px_30px_rgba(0,0,0,0.7)]' : 'border-gray-700/40 opacity-75'
          } p-1 sm:p-1.5 flex items-center justify-between gap-2`}
        >
          {/* Subtle Ambient Backlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#D8AD55]/5 via-amber-500/5 to-transparent pointer-events-none" />

          {/* Left Live Badge (Mobile & Desktop) */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 shrink-0 relative z-10">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-wider ${currentBadge.badgeBg} shadow-sm ${currentBadge.glow}`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentBadge.dotColor} opacity-75`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${currentBadge.dotColor}`}
                />
              </span>
              <span className="hidden xs:inline">{currentBadge.pillText}</span>
              <span className="xs:hidden">LIVE</span>
            </div>

            {!announcement.isActive && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700">
                Paused
              </span>
            )}
          </div>

          {/* Center Smooth Infinite Running Marquee Ticker */}
          <div
            onClick={() => setIsMobileDetailOpen(true)}
            className="flex-1 overflow-hidden relative cursor-pointer sm:cursor-default ticker-pause mx-1 sm:mx-2 py-1"
          >
            {/* Fade Gradients at Edges */}
            <div className="absolute left-0 inset-y-0 w-4 bg-gradient-to-r from-[#08111F] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-4 bg-gradient-to-l from-[#08111F] to-transparent z-10 pointer-events-none" />

            {/* Continuous Marquee Text Loop */}
            <div className="animate-ticker flex items-center gap-8 text-xs sm:text-sm font-semibold text-gray-200">
              <span className="flex items-center gap-2 shrink-0">
                <Megaphone className={`w-3.5 h-3.5 ${currentBadge.accentColor} shrink-0`} />
                <span>{announcement.message}</span>
              </span>
              <span className="text-[#D8AD55] font-black shrink-0">★★★</span>
              <span className="flex items-center gap-2 shrink-0">
                <Megaphone className={`w-3.5 h-3.5 ${currentBadge.accentColor} shrink-0`} />
                <span>{announcement.message}</span>
              </span>
              <span className="text-[#D8AD55] font-black shrink-0">★★★</span>
            </div>
          </div>

          {/* Right Action & Super Admin Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1 sm:pr-2 shrink-0 relative z-10">
            {/* Clickable Action Link (if provided) */}
            {announcement.linkUrl && (
              <Link
                href={announcement.linkUrl}
                className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs shadow-sm hover:brightness-110 transition-all cursor-pointer"
              >
                <span>{announcement.linkText || 'Learn More'}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}

            {/* Super Admin Manage Button */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="btn-press flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#111D2D] hover:bg-[#1A2A40] border border-[#D8AD55]/40 text-[#F2D69A] text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Super Admin: Edit Live Announcement"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MOBILE TAP-TO-EXPAND BULLETIN MODAL */}
      {isMobileDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md sm:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D1B2A] border border-[#D8AD55]/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase ${currentBadge.badgeBg}`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentBadge.dotColor} opacity-75`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${currentBadge.dotColor}`}
                  />
                </span>
                <span>{currentBadge.pillText}</span>
              </div>
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-display font-black text-xl text-white">Live Official Bulletin</h4>
              <p className="text-sm text-gray-200 leading-relaxed font-medium">
                {announcement.message}
              </p>
            </div>

            {announcement.linkUrl && (
              <Link
                href={announcement.linkUrl}
                onClick={() => setIsMobileDetailOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{announcement.linkText || 'Open Link'}</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileDetailOpen(false);
                  handleOpenEdit();
                }}
                className="w-full py-2.5 rounded-xl bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit as Super Admin</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. SUPER ADMIN EDIT ANNOUNCEMENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border border-[#D8AD55]/40 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#D8AD55]/20 pb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#D8AD55] animate-pulse" />
                <h3 className="font-display font-black text-2xl text-white">
                  Live Announcement Broadcast
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
                Quick 1-Click Templates
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setFormMessage(preset.message);
                      setFormType(preset.type);
                      setFormLinkText(preset.linkText);
                      setFormLinkUrl(preset.linkUrl);
                      setFormIsActive(true);
                    }}
                    className="p-2 text-left rounded-xl bg-[#08111F] hover:bg-[#111D2D] border border-white/10 hover:border-[#D8AD55]/40 text-[11px] text-gray-300 transition-all cursor-pointer"
                  >
                    <div className="font-bold text-[#F2D69A]">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs sm:text-sm">
              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
                  Broadcast Message *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="e.g. 🏏 Most awaited league for this year DDPL 2.0 is going to start soon... Keep playing hard!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D8AD55] text-sm"
                />
              </div>

              {/* Badge Type & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
                    Badge Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  >
                    <option value="championship">League Bulletin (Gold)</option>
                    <option value="breaking">Breaking News (Red)</option>
                    <option value="live">Live Broadcast (Blue)</option>
                    <option value="alert">Tournament Alert (Green)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      formIsActive
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-gray-800/60 border-gray-700 text-gray-400'
                    }`}
                  >
                    {formIsActive ? (
                      <>
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span>Active on Front Page</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-gray-400" />
                        <span>Paused (Hidden)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Link (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
                    Action Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formLinkText}
                    onChange={(e) => setFormLinkText(e.target.value)}
                    placeholder="e.g. Explore DDPL 2.0"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider">
                    Target URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    placeholder="e.g. /tournaments or /matches"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#08111F] border border-[#D8AD55]/30 text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8AD55]/20">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#08111F] border border-white/10 text-gray-300 font-bold hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-press shimmer-btn px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Publishing…' : 'Publish Live Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
