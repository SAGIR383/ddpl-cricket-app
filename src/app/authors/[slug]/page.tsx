import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { getAllArticles } from '@/lib/articles';

export const revalidate = 60;

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const allArticles = await getAllArticles(false);
  const matched = allArticles.find((a) => {
    const aSlug = a.author?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return aSlug === params.slug;
  });

  const authorName = matched?.author?.name || 'CricPlus24 Sports Columnist';
  const canonical = `https://www.cricplus24.in/authors/${params.slug}`;

  return {
    title: `${authorName} — Cricket Analyst Profile & Articles | CricPlus24`,
    description: `Read verified cricket analysis, match reports, and editorials authored by ${authorName} on CricPlus24.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${authorName} | CricPlus24`,
      description: `Author profile and sports editorials by ${authorName}.`,
      url: canonical,
    },
  };
}

export default async function AuthorProfilePage({ params }: Props) {
  const allArticles = await getAllArticles(false);
  const authorArticles = allArticles.filter((a) => {
    const aSlug = a.author?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return aSlug === params.slug;
  });

  if (authorArticles.length === 0) {
    notFound();
  }

  const primaryAuthor = authorArticles[0].author;

  const authorJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: primaryAuthor.name,
    jobTitle: primaryAuthor.designation,
    url: `https://www.cricplus24.in/authors/${params.slug}`,
    image: primaryAuthor.avatarUrl,
    description: primaryAuthor.bio,
    worksFor: {
      '@type': 'Organization',
      name: 'CricPlus24',
      url: 'https://www.cricplus24.in',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative z-10">
        
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#8793A5] flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Link href="/news" className="hover:text-white transition-colors">
            News &amp; Editorials
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[#D8AD55] font-semibold">{primaryAuthor.name}</span>
        </nav>

        {/* Author Bio Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#D8AD55]/40 bg-[#08111F] shrink-0 shadow-2xl">
              <img
                src={primaryAuthor.avatarUrl || '/images/editorial-author.jpg'}
                alt={primaryAuthor.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>Verified Cricket Journalist &amp; Analyst</span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                {primaryAuthor.name}
              </h1>

              <div className="text-sm font-semibold text-[#D8AD55]">
                {primaryAuthor.designation}
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl pt-1">
                {primaryAuthor.bio}
              </p>

              {primaryAuthor.expertise && primaryAuthor.expertise.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs text-[#8793A5] font-bold">Domain Areas:</span>
                  {primaryAuthor.expertise.map((exp, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/5 text-gray-200 border border-white/10"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Authored Articles */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-display font-bold text-2xl text-white border-b border-white/10 pb-4">
            <BookOpen className="w-5 h-5 text-[#D8AD55]" />
            <span>Articles Authored ({authorArticles.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {authorArticles.map((art) => (
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

                    <h3 className="font-display font-bold text-lg text-white group-hover:text-[#D8AD55] transition-colors leading-snug line-clamp-2">
                      <Link href={`/news/${art.slug}`}>{art.title}</Link>
                    </h3>

                    <p className="text-xs text-[#8793A5] leading-relaxed line-clamp-2">
                      {art.summary}
                    </p>
                  </div>

                  <Link
                    href={`/news/${art.slug}`}
                    className="text-xs font-bold text-[#D8AD55] group-hover:text-[#F2D69A] flex items-center gap-1 transition-colors pt-2"
                  >
                    <span>Read Article</span>
                    <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Editorials</span>
          </Link>
        </div>
      </div>
    </>
  );
}
