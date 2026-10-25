'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, X, FileText, Send, Sparkles, Trophy } from 'lucide-react';
import { MatchLiveState } from '@/types/match.types';
import { generateMatchPressBulletin } from '@/lib/tournamentAnalytics';

interface MatchBulletinModalProps {
  state: MatchLiveState;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchBulletinModal({ state, isOpen, onClose }: MatchBulletinModalProps) {
  const [copied, setCopied] = useState(false);
  const bulletin = generateMatchPressBulletin(state);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bulletin.slackMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: bulletin.headline,
        text: bulletin.slackMarkdown,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border-2 border-[#D8AD55]/40 shadow-2xl space-y-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D8AD55]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 flex items-center justify-center text-[#F2D69A]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                Automated Match Press Bulletin
              </h3>
              <p className="text-xs text-[#8793A5]">
                Corporate post-match recap formatted for Slack, WhatsApp &amp; Email
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary Card */}
        <div className="p-4 rounded-2xl bg-[#08111F] border border-white/5 space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#D8AD55]">
            Executive Recap
          </div>
          <h4 className="font-display font-black text-base text-white">
            {bulletin.headline}
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed pt-1">
            {bulletin.executiveSummary}
          </p>
        </div>

        {/* Slack / WhatsApp Formatted Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Company Chat Ready (Slack / WhatsApp / Teams)
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[#D8AD55] hover:text-[#F2D69A] font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={bulletin.slackMarkdown}
            rows={7}
            className="w-full p-3.5 rounded-2xl bg-[#050B14] border border-white/10 text-gray-300 text-xs font-mono select-all focus:outline-none focus:border-[#D8AD55]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="btn-press px-6 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] hover:brightness-110 active:scale-95 shadow-xl shadow-[#D8AD55]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Bulletin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
