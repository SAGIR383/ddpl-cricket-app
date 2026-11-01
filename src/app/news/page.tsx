import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { getAllArticles } from '@/lib/articles';
import { NewsExplorer } from '@/components/news/NewsExplorer';

export const revalidate = 60; // Incremental Static Regeneration every 60s

export const metadata: Metadata = {
  title: 'Cricket News, Editorials & In-Depth Tactical Analysis | CricPlus24',
  description:
    'Explore 100% original cricket editorials, tactical breakdowns, match reports, player auction strategies, and technical guides authored by the CricPlus24 sports desk.',
  alternates: {
    canonical: 'https://www.cricplus24.in/news',
  },
  openGraph: {
    title: 'Cricket News, Editorials & In-Depth Tactical Analysis | CricPlus24',
    description:
      'Explore 100% original cricket editorials, tactical breakdowns, match reports, player auction strategies, and technical guides authored by the CricPlus24 sports desk.',
    url: 'https://www.cricplus24.in/news',
    siteName: 'CricPlus24',
    type: 'website',
    images: [
      {
        url: 'https://www.cricplus24.in/images/cricplus-stadium-4k.jpg',
        width: 1200,
        height: 630,
        alt: 'CricPlus24 Cricket News & Original Editorials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cricket News, Editorials & In-Depth Tactical Analysis | CricPlus24',
    description:
      'Explore 100% original cricket editorials, tactical breakdowns, match reports, player auction strategies, and technical guides authored by the CricPlus24 sports desk.',
    images: ['https://www.cricplus24.in/images/cricplus-stadium-4k.jpg'],
  },
};

export default async function CricketNewsPage() {
  // Fetch only published articles on server for 100% crawlable HTML response
  const publishedArticles = await getAllArticles(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative z-10">
      {/* 1. HERO EDITORIAL HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>CricPlus24 Original Editorial Desk</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Cricket News &amp; In-Depth Analysis
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Original tactical breakdowns, match reports, tournament guides, player auction analytics, and strategic insights curated exclusively by the CricPlus24 sports editorial team.
          </p>
        </div>

        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-[#D8AD55]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. CRAWLABLE ARTICLES EXPLORER */}
      <NewsExplorer initialArticles={publishedArticles} />
    </div>
  );
}
