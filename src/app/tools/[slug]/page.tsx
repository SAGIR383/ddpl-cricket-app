import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calculator,
  ChevronRight,
  BookOpen,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { CRICKET_TOOLS, CricketToolMeta } from '@/lib/cricketTools';
import { InteractiveCalculator } from '@/components/tools/InteractiveCalculator';

export const revalidate = 3600; // SSG / ISR

interface Props {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return CRICKET_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = CRICKET_TOOLS.find((t) => t.slug === params.slug);
  if (!tool) {
    return {
      title: 'Calculator Not Found | CricPlus24',
      robots: { index: false, follow: false },
    };
  }

  const canonical = `https://www.cricplus24.in/tools/${tool.slug}`;

  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url: canonical,
      siteName: 'CricPlus24',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
  };
}

export default function CricketCalculatorPage({ params }: Props) {
  const tool = CRICKET_TOOLS.find((t) => t.slug === params.slug);
  if (!tool) {
    notFound();
  }

  const otherTools = CRICKET_TOOLS.filter((t) => t.slug !== tool.slug);

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: `https://www.cricplus24.in/tools/${tool.slug}`,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'All',
    description: tool.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CricPlus24',
      url: 'https://www.cricplus24.in',
    },
  };

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
      {
        '@type': 'ListItem',
        position: 3,
        name: tool.name,
        item: `https://www.cricplus24.in/tools/${tool.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#8793A5] flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Link href="/tools" className="hover:text-white transition-colors">
            Cricket Calculators
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[#D8AD55] font-semibold">{tool.name}</span>
        </nav>

        {/* Hero Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>Interactive Cricket Tool</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
            {tool.name}
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
            {tool.shortDescription}
          </p>
        </div>

        {/* Interactive Tool Widget */}
        <section aria-label="Interactive Calculator Widget">
          <InteractiveCalculator slug={tool.slug} />
        </section>

        {/* Formula & Explanation Section */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#0D1B2A]/90 border border-[#D8AD55]/30 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-xl text-white">
              <Info className="w-5 h-5 text-[#D8AD55]" />
              <span>Official Calculation Formula &amp; Rules</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#08111F] border border-white/10 font-mono text-sm text-[#F2D69A]">
              {tool.formula}
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed pt-2">
              {tool.formulaExplanation}
            </p>
          </div>

          {/* Practical Example */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <h3 className="font-display font-bold text-lg text-white">
              Step-by-Step Calculation Example
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#08111F] p-4 rounded-2xl border border-white/5">
              {tool.exampleScenario}
            </p>
          </div>
        </section>

        {/* Other Calculators Carousel */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D8AD55]" />
              <span>Explore Other Cricket Calculators</span>
            </h3>
            <Link href="/tools" className="text-xs font-bold text-[#D8AD55] hover:text-[#F2D69A]">
              View all tools →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherTools.slice(0, 3).map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="group p-5 rounded-2xl bg-[#08111F] border border-white/5 hover:border-[#D8AD55]/40 transition-all shadow-xl hover:-translate-y-1 block space-y-2"
              >
                <h4 className="font-display font-bold text-base text-white group-hover:text-[#D8AD55] transition-colors">
                  {t.name}
                </h4>
                <p className="text-xs text-[#8793A5] line-clamp-2">{t.shortDescription}</p>
                <div className="text-xs font-bold text-[#D8AD55] pt-1">Calculate Now →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Back Button */}
        <div className="pt-4">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Cricket Tools</span>
          </Link>
        </div>
      </div>
    </>
  );
}
