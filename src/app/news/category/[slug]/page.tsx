import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Flame,
  Calendar,
} from 'lucide-react';
import {
  getAllArticles,
  EDITORIAL_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  slugifyCategory,
} from '@/lib/articles';

export const revalidate = 60;

interface Props {
  params: {
    slug: string;
  };
}

function findCategoryBySlug(slug: string): string | null {
  const match = EDITORIAL_CATEGORIES.find((cat) => slugifyCategory(cat) === slug);
  return match || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoryName = findCategoryBySlug(params.slug);
  if (!categoryName) {
    return {
      title: 'Category Not Found | CricPlus24',
      robots: { index: false, follow: false },
    };
  }

  const desc =
    CATEGORY_DESCRIPTIONS[params.slug] ||
    `Explore exclusive CricPlus24 cricket analysis, tactical breakdowns, and coverage for ${categoryName}.`;

  const canonical = `https://www.cricplus24.in/news/category/${params.slug}`;

  return {
    title: `${categoryName} — News, Editorials & Analysis | CricPlus24`,
    description: desc,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${categoryName} | CricPlus24`,
      description: desc,
      url: canonical,
      siteName: 'CricPlus24',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} | CricPlus24`,
      description: desc,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const categoryName = findCategoryBySlug(params.slug);
  if (!categoryName) {
    notFound();
  }

  const description =
    CATEGORY_DESCRIPTIONS[params.slug] ||
    `Explore exclusive CricPlus24 cricket analysis, tactical breakdowns, and coverage for ${categoryName}.`;

  const allArticles = await getAllArticles(false);
  const catLower = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const filteredArticles = allArticles.filter(
    (a) => a.category.toLowerCase().replace(/[^a-z0-9]/g, '') === catLower
  );

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
        name: 'Cricket News & Editorials',
        item: 'https://www.cricplus24.in/news',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `https://www.cricplus24.in/news/category/${params.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#8793A5] flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Link href="/news" className="hover:text-white transition-colors">
            News &amp; Editorials
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[#D8AD55] font-semibold">{categoryName}</span>
        </nav>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 p-8 sm:p-12 shadow-2xl">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Editorial Category Hub</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
              {categoryName}
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Other Categories Nav Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/news"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0D1B2A] text-gray-300 hover:text-white border border-white/10 shrink-0 transition-colors"
          >
            All Stories
          </Link>
          {EDITORIAL_CATEGORIES.map((cat) => {
            const catSlug = slugifyCategory(cat);
            const isActive = catSlug === params.slug;
            return (
              <Link
                key={cat}
                href={`/news/category/${catSlug}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] border-transparent font-black shadow-lg shadow-[#D8AD55]/20'
                    : 'bg-[#0D1B2A] text-gray-300 hover:text-white border-white/10'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* Article Cards Grid */}
        {filteredArticles.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-[#08111F] border border-white/5 space-y-4 shadow-xl">
            <BookOpen className="w-12 h-12 mx-auto text-[#D8AD55]/60" />
            <h2 className="font-display font-bold text-xl text-white">
              Fresh Editorials Coming Soon
            </h2>
            <p className="text-xs text-[#8793A5] max-w-md mx-auto">
              Fresh cricket analysis and exclusive CricPlus24 editorials in {categoryName} are coming soon. Stay tuned!
            </p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore other cricket categories</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <article
                key={art.slug}
                className="group flex flex-col rounded-3xl bg-[#08111F] border border-white/5 hover:border-[#D8AD55]/40 overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1"
              >
                <Link href={`/news/${art.slug}`} className="relative aspect-[16/10] bg-[#0D1B2A] overflow-hidden block">
                  <img
                    src={art.featuredImage?.url || '/images/cricplus-stadium-4k.jpg'}
                    alt={art.featuredImage?.altText || art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-[#F2D69A] border border-white/10">
                    {art.category}
                  </span>
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#8793A5]">
                      <Calendar className="w-3.5 h-3.5 text-[#D8AD55]" />
                      <time dateTime={art.publishedAt}>
                        {new Date(art.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      <span>•</span>
                      <span>{art.readingTime}</span>
                    </div>

                    <h3 className="font-display font-bold text-xl text-white group-hover:text-[#D8AD55] transition-colors leading-snug line-clamp-2">
                      <Link href={`/news/${art.slug}`}>{art.title}</Link>
                    </h3>

                    <p className="text-xs text-[#8793A5] leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-semibold">
                      By {art.author?.name || 'CricPlus24 Chief Editor'}
                    </span>

                    <Link
                      href={`/news/${art.slug}`}
                      className="text-xs font-bold text-[#D8AD55] group-hover:text-[#F2D69A] flex items-center gap-1 transition-colors"
                    >
                      <span>Read Story</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
