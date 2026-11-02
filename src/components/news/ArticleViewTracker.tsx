'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

interface ArticleViewTrackerProps {
  slug: string;
  initialViews?: number;
  className?: string;
}

export function ArticleViewTracker({
  slug,
  initialViews = 0,
  className = '',
}: ArticleViewTrackerProps) {
  const [views, setViews] = useState<number>(initialViews);

  useEffect(() => {
    if (!slug || typeof window === 'undefined') return;

    const storageKey = `cp_view_${slug}`;
    const alreadyViewed = sessionStorage.getItem(storageKey);

    if (!alreadyViewed) {
      // Record real authentic view once per visitor session
      sessionStorage.setItem(storageKey, '1');
      fetch('/api/news/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && typeof data.viewsCount === 'number') {
            setViews(data.viewsCount);
          }
        })
        .catch(() => {
          // Graceful fallback on network glitch
        });
    } else {
      // Fetch current live view count without re-incrementing
      fetch(`/api/news/views?slug=${encodeURIComponent(slug)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && typeof data.viewsCount === 'number') {
            setViews(data.viewsCount);
          }
        })
        .catch(() => {});
    }
  }, [slug]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D1B2A] border border-[#D8AD55]/30 text-xs font-semibold text-[#F2D69A] shadow-sm select-none ${className}`}
      title="Authentic verified reader views"
    >
      <Eye className="w-3.5 h-3.5 text-[#D8AD55]" />
      <span>{views.toLocaleString()} {views === 1 ? 'view' : 'views'}</span>
    </div>
  );
}
