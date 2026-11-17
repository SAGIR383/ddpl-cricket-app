'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Share2,
  Check,
  Shield,
  Trophy,
  Sparkles,
  Users,
  Award,
} from 'lucide-react';

export interface SquadPlayerItem {
  name: string;
  role: string;
  price: string;
  avatarUrl?: string | null;
}

export interface FranchiseSquadModalData {
  id: string;
  name: string;
  short: string;
  group?: string;
  owner: string;
  captain: string;
  viceCaptain: string;
  squadSize: number;
  maxSquadCap: number;
  budgetAllocated: string;
  budgetSpent: string;
  budgetLeft: string;
  players: SquadPlayerItem[];
}

interface FranchiseSquadCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: FranchiseSquadModalData | null;
  tournamentName?: string;
}

export default function FranchiseSquadCardModal({
  isOpen,
  onClose,
  team,
  tournamentName = 'DDPL 3.0',
}: FranchiseSquadCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen || !team) return null;

  // Generate crisp 2-letter initials for players without a photo
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Download high-resolution PNG image poster
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      // Capture 2x Retina resolution for razor sharp text
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#08111F',
      });
      const link = document.createElement('a');
      link.download = `${tournamentName.replace(/\s+/g, '_')}_${team.name.replace(/\s+/g, '_')}_Official_Squad.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download squad card image:', err);
      alert('Could not download image directly. Please try taking a screenshot or share via text.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Share squad via Web Share API or WhatsApp
  const handleShare = async () => {
    const playerLines = (team.players || [])
      .map((p, idx) => `${idx + 1}. ${p.name} (${p.role}) - ${p.price}`)
      .join('\n');

    const shareText =
      `🏏 *${tournamentName} - OFFICIAL SQUAD CARD* 🏏\n` +
      `🏆 *${team.name}* [${team.short}] (${team.group || 'Franchise'})\n` +
      `👑 Owner: ${team.owner} | Captain: ${team.captain}\n` +
      `💰 Purse Spent: ${team.budgetSpent} | Remaining: ${team.budgetLeft}\n\n` +
      `👥 *OFFICIAL SQUAD LINEUP (${team.players?.length || 0} PLAYERS):*\n` +
      `${playerLines}\n\n` +
      `🌐 View live tournament & matches: https://cricplus24.vercel.app/teams`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tournamentName} - ${team.name} Squad`,
          text: shareText,
          url: 'https://cricplus24.vercel.app/teams',
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Navigator share error, falling back to WhatsApp:', err);
        } else {
          return;
        }
      }
    }

    // Fallback: Open WhatsApp direct share URL
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl my-auto rounded-3xl bg-[#08111F] border border-[#D8AD55]/40 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Download, Share, Close) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0D1B2A] border-b border-[#D8AD55]/20">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D8AD55]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#F2D69A]">
              Official Franchise Squad Digital Card
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Squad Card as PNG Image"
            >
              <Download className="w-3.5 h-3.5 text-[#08111F]" />
              <span>{isDownloading ? 'Rendering…' : 'Download PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-[#111D2D] hover:bg-[#1a2b3e] text-[#F2D69A] border border-[#D8AD55]/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Share Squad Lineup on WhatsApp or Social"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Shared!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#D8AD55]" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[82vh]">
          {/* THE DIGITAL POSTER CARD (This exact node is captured by toPng) */}
          <div
            ref={cardRef}
            className="p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-[#0D1B2A] via-[#08111F] to-[#0D1B2A] border-2 border-[#D8AD55]/40 shadow-2xl space-y-6 text-white relative overflow-hidden"
          >
            {/* Top Brand Watermark & Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D8AD55]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Poster Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8AD55]/20 pb-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#111D2D] to-[#08111F] border-2 border-[#D8AD55]/60 flex items-center justify-center font-display font-black text-2xl sm:text-3xl text-[#F2D69A] shadow-xl shrink-0">
                  {team.short}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight uppercase">
                      {team.name}
                    </h2>
                    {team.group && (
                      <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                        {team.group}
                      </span>
                    )}
                    <span className="px-3 py-0.5 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/40 text-xs font-bold">
                      {tournamentName}
                    </span>
                  </div>
                  <div className="text-xs text-[#8793A5] mt-1 space-x-3">
                    <span>
                      Manager / Owner: <strong className="text-white">{team.owner}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Captain: <strong className="text-[#F2D69A]">{team.captain}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Purse & Squad Stats Box */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 sm:p-0 rounded-2xl bg-[#08111F]/80 sm:bg-transparent border sm:border-0 border-white/5">
                <div className="text-left sm:text-right">
                  <div className="text-[11px] uppercase tracking-wider text-[#8793A5] font-semibold">
                    Squad Allocation ({team.maxSquadCap} Cap)
                  </div>
                  <div className="font-display font-black text-xl text-white">
                    {team.players?.length || 0} / {team.maxSquadCap} Players
                  </div>
                </div>
                <div className="text-right sm:mt-1">
                  <span className="text-[11px] font-mono text-[#D8AD55] font-bold">
                    Spent: {team.budgetSpent} • Left: {team.budgetLeft}
                  </span>
                </div>
              </div>
            </div>

            {/* Official 8-Player Lineup Grid */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-[#8793A5] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D8AD55]" />
                  <span>Official 8-Player Squad Lineup</span>
                </span>
                <span>Sold Price</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(team.players || []).map((player, idx) => {
                  const isOwner =
                    player.role?.includes('Franchise Owner') ||
                    (team.owner && player.name?.toLowerCase().trim() === team.owner.toLowerCase().trim());
                  const isCaptain = team.captain?.toLowerCase().includes(player.name?.toLowerCase().trim());
                  const hasPhoto = !!player.avatarUrl && player.avatarUrl.trim() !== '';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#0D1B2A]/90 border border-[#D8AD55]/20 flex items-center justify-between gap-3 shadow-md hover:border-[#D8AD55]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Jersey Number Index */}
                        <span className="w-6 h-6 rounded-lg bg-[#08111F] border border-white/10 text-gray-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Player Photo or Sleek Initials Avatar */}
                        {hasPhoto ? (
                          <img
                            src={player.avatarUrl!}
                            alt={player.name}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-[#D8AD55]/50 shadow shrink-0 bg-[#08111F]"
                            onError={(e) => {
                              // If image fails, replace with clean text block
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#111D2D] to-[#08111F] border border-[#D8AD55]/30 text-[#F2D69A] font-display font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                            {getInitials(player.name)}
                          </div>
                        )}

                        {/* Player Name, Role & Badges */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-sm truncate block" title={player.name}>
                              {player.name}
                            </span>
                            {isOwner && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/25 text-purple-300 border border-purple-400/40 uppercase">
                                Owner
                              </span>
                            )}
                            {isCaptain && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#D8AD55]/25 text-[#F2D69A] border border-[#D8AD55]/40 uppercase">
                                Captain
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8793A5] block truncate">{player.role}</span>
                        </div>
                      </div>

                      {/* Sold Price Tag */}
                      <span className="font-display font-black text-xs sm:text-sm text-[#F2D69A] bg-[#08111F] px-2.5 py-1 rounded-xl border border-[#D8AD55]/20 shrink-0">
                        {player.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Poster Footer Strip */}
            <div className="pt-4 border-t border-[#D8AD55]/15 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8793A5] gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>{tournamentName} Official Franchise Squad Certificate</span>
              </div>
              <span className="font-mono text-gray-500">
                Powered by CricPlus 24 Enterprise Sports
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-[#0D1B2A] border-t border-[#D8AD55]/20 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#8793A5]">
            💡 Tip: Click <strong>Download PNG</strong> to save this digital card as an image for WhatsApp status or printing.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="btn-press px-4 py-2 rounded-xl bg-[#111D2D] hover:bg-[#1a2b3e] text-[#F2D69A] border border-[#D8AD55]/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#D8AD55]" />
              <span>Share Squad</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="btn-press px-5 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#08111F]" />
              <span>{isDownloading ? 'Rendering…' : 'Download Squad Poster'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
