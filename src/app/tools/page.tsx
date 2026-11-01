import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { CRICKET_TOOLS } from '@/lib/cricketTools';

export const metadata: Metadata = {
  title: 'Free Cricket Calculators & Analytics Tools | CricPlus24',
  description:
    'Free suite of interactive cricket calculators: Net Run Rate (NRR), Batting & Bowling Averages, Economy Rates, Strike Rates, Required Run Rate, Points Table, and Auction Budget.',
  alternates: {
    canonical: 'https://www.cricplus24.in/tools',
  },
  openGraph: {
    title: 'Free Cricket Calculators & Analytics Tools | CricPlus24',
    description:
      'Free suite of interactive cricket calculators: Net Run Rate (NRR), Batting & Bowling Averages, Economy Rates, Strike Rates, and Auction Budget.',
    url: 'https://www.cricplus24.in/tools',
    siteName: 'CricPlus24',
  },
};

export default function CricketToolsHubPage() {
  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.cricplus24.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Cricket Calculators & Tools',
        item: 'https://www.cricplus24.in/tools',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative z-10">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 p-8 sm:p-12 shadow-2xl">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>CricPlus24 Sports Analytics Hub</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              Cricket Calculators &amp; Statistical Tools
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Explore our free, interactive suite of cricket calculators designed for team captains, tournament directors, commentators, fantasy players, and cricket fans worldwide. Features exact fractional ball precision and official ICC tiebreaker rules.
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CRICKET_TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group p-6 rounded-3xl bg-[#08111F] border border-white/5 hover:border-[#D8AD55]/40 transition-all duration-300 shadow-xl hover:-translate-y-1.5 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calculator className="w-5 h-5 text-[#D8AD55]" />
                </div>

                <h2 className="font-display font-bold text-lg text-white group-hover:text-[#D8AD55] transition-colors leading-snug">
                  {tool.name}
                </h2>

                <p className="text-xs text-[#8793A5] leading-relaxed line-clamp-3">
                  {tool.shortDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#D8AD55] group-hover:text-[#F2D69A]">
                <span>Open Calculator</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
