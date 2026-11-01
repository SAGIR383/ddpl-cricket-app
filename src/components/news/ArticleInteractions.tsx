'use client';

import { useState } from 'react';
import { Share2, Check, Copy, MessageCircle, Twitter, Linkedin } from 'lucide-react';

interface ArticleInteractionsProps {
  title: string;
  url: string;
}

export function ArticleShareButtons({ title, url }: ArticleInteractionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} — Read on CricPlus24: ${url}`)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-bold text-[#8793A5] uppercase tracking-wider mr-1">Share:</span>
      
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
        title="Share on X (Twitter)"
      >
        <Twitter className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Post</span>
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-xl bg-sky-600/15 text-sky-400 hover:bg-sky-600/25 border border-sky-600/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">LinkedIn</span>
      </a>

      <button
        onClick={handleCopy}
        className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
        title="Copy Link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
}

export function ArticleTableOfContents({ headings }: { headings: { id: string; text: string; level: number }[] }) {
  if (headings.length < 2) return null;

  return (
    <div className="p-5 rounded-2xl bg-[#0D1B2A]/90 border border-[#D8AD55]/30 space-y-3 my-6 shadow-xl">
      <div className="text-xs font-extrabold uppercase text-[#D8AD55] tracking-wider flex items-center gap-2">
        <span>Table of Contents</span>
      </div>
      <nav className="space-y-1.5 text-xs">
        {headings.map((h, i) => (
          <a
            key={i}
            href={`#${h.id}`}
            className={`block hover:text-[#F2D69A] transition-colors py-0.5 ${
              h.level === 3 ? 'pl-4 text-[#8793A5]' : 'font-semibold text-gray-200'
            }`}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
