import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  ArrowLeft,
  Calendar,
  Sparkles,
  BookOpen,
  User,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  getArticleBySlug,
  getAllArticles,
  slugifyCategory,
  CricPlusArticle,
} from '@/lib/articles';
import { ArticleShareButtons, ArticleTableOfContents } from '@/components/news/ArticleInteractions';

export const revalidate = 60; // Incremental Static Regeneration every 60s

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article || article.status !== 'published') {
    return {
      title: 'Article Not Found | CricPlus24',
      description: 'The requested cricket editorial or news article could not be found on CricPlus24.',
      robots: { index: false, follow: false },
    };
  }

  const seoTitle = article.seo?.seoTitle || `${article.title} | CricPlus24`;
  const metaDescription =
    article.seo?.metaDescription || article.summary || article.subtitle || article.title;
  const canonicalUrl =
    article.seo?.canonicalUrl || `https://www.cricplus24.in/news/${article.slug}`;
  const shareImage =
    article.seo?.ogImage || article.featuredImage?.url || '/images/cricplus-stadium-4k.jpg';
  const shouldIndex = article.seo?.robotsIndex !== 'noindex';
  const shouldFollow = article.seo?.robotsFollow !== 'nofollow';

  return {
    title: seoTitle,
    description: metaDescription,
    keywords: article.tags?.length ? article.tags : ['Cricket', article.category, 'CricPlus24'],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: shouldIndex,
      follow: shouldFollow,
      googleBot: {
        index: shouldIndex,
        follow: shouldFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: article.seo?.ogTitle || seoTitle,
      description: article.seo?.ogDescription || metaDescription,
      url: canonicalUrl,
      siteName: 'CricPlus24',
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      authors: [article.author?.name || 'CricPlus24 Editorial Desk'],
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: article.featuredImage?.altText || article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seo?.ogTitle || seoTitle,
      description: article.seo?.ogDescription || metaDescription,
      images: [shareImage],
      creator: '@cricplus24',
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);

  if (!article || article.status !== 'published') {
    notFound();
  }

  const allArticles = await getAllArticles(false);
  const relatedArticles = allArticles
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  const categorySlug = slugifyCategory(article.category);
  const authorSlug = article.author?.name
    ? article.author.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'cricplus-editorial';

  // Extract H2 & H3 headings for Table of Contents
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = (article.content || '').split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      const text = trimmed.replace('## ', '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: 2 });
    } else if (trimmed.startsWith('### ')) {
      const text = trimmed.replace('### ', '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: 3 });
    }
  });

  // Structured JSON-LD Schemas
  const schemaType = article.seo?.articleSchema || 'Article';
  const articleSchemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: article.title,
    description: article.summary,
    image: [article.featuredImage?.url || 'https://www.cricplus24.in/images/cricplus-stadium-4k.jpg'],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'CricPlus24 Chief Editor',
      jobTitle: article.author?.designation || 'Senior Cricket Analyst',
      url: `https://www.cricplus24.in/authors/${authorSlug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CricPlus24',
      url: 'https://www.cricplus24.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cricplus24.in/images/cricplus-logo.jpg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.cricplus24.in/news/${article.slug}`,
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
        name: 'Cricket News & Editorials',
        item: 'https://www.cricplus24.in/news',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.category,
        item: `https://www.cricplus24.in/news/category/${categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: article.title,
        item: `https://www.cricplus24.in/news/${article.slug}`,
      },
    ],
  };

  const faqJsonLd =
    article.faqs && article.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: article.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer,
            },
          })),
        }
      : null;

  // Render Markdown Body to crawlable HTML
  function renderParagraph(raw: string, idx: number) {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      const text = trimmed.replace('## ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h2
          key={idx}
          id={id}
          className="font-display font-black text-2xl sm:text-3xl text-white mt-10 mb-4 border-b border-[#D8AD55]/20 pb-2 scroll-mt-24"
        >
          {text}
        </h2>
      );
    }

    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace('### ', '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h3
          key={idx}
          id={id}
          className="font-display font-bold text-xl sm:text-2xl text-[#F2D69A] mt-8 mb-3 scroll-mt-24"
        >
          {text}
        </h3>
      );
    }

    if (trimmed.startsWith('#### ')) {
      return (
        <h4 key={idx} className="font-display font-bold text-lg text-white mt-6 mb-2">
          {trimmed.replace('#### ', '')}
        </h4>
      );
    }

    if (trimmed.startsWith('> ')) {
      return (
        <blockquote
          key={idx}
          className="border-l-4 border-[#D8AD55] pl-5 py-3 my-6 bg-[#0D1B2A]/70 rounded-r-2xl italic text-gray-200 text-base"
        >
          {trimmed.replace('> ', '').replace(/\*/g, '')}
        </blockquote>
      );
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={idx} className="ml-6 list-disc text-gray-300 text-base leading-relaxed my-1.5">
          {trimmed.replace(/^[-*]\s+/, '')}
        </li>
      );
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      return (
        <li key={idx} className="ml-6 list-decimal text-gray-300 text-base leading-relaxed my-1.5">
          {trimmed.replace(/^\d+\.\s+/, '')}
        </li>
      );
    }

    // Check for inline links e.g. [text](url)
    const formattedText = trimmed;

    return (
      <p key={idx} className="text-gray-300 text-base sm:text-lg leading-relaxed my-5 font-normal">
        {formattedText}
      </p>
    );
  }

  return (
    <>
      {/* Inject Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchemaJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* 1. Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#8793A5] flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Link href="/news" className="hover:text-white transition-colors">
            News &amp; Editorials
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Link
            href={`/news/category/${categorySlug}`}
            className="hover:text-[#F2D69A] text-[#D8AD55] transition-colors font-medium"
          >
            {article.category}
          </Link>
        </nav>

        {/* 2. Article Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href={`/news/category/${categorySlug}`}
              className="px-3 py-1 rounded-full text-xs font-bold bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 hover:bg-[#D8AD55]/25 transition-colors"
            >
              {article.category}
            </Link>
            <span className="flex items-center gap-1 text-xs text-[#8793A5]">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readingTime}</span>
            </span>
          </div>

          {/* Primary Page H1 */}
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg sm:text-xl font-medium text-gray-300 leading-snug">
              {article.subtitle}
            </p>
          )}

          {/* Author & Editorial Metadata Row */}
          <div className="pt-4 pb-2 border-y border-[#D8AD55]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#D8AD55]/40 bg-[#0D1B2A] shrink-0">
                <img
                  src={article.author?.avatarUrl || '/images/editorial-author.jpg'}
                  alt={article.author?.name || 'Author'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <Link
                  href={`/authors/${authorSlug}`}
                  className="font-bold text-sm text-white hover:text-[#D8AD55] transition-colors flex items-center gap-1.5"
                >
                  <span>{article.author?.name || 'CricPlus24 Chief Editor'}</span>
                  <span title="Verified Sports Analyst">
                    <ShieldCheck className="w-4 h-4 text-[#D8AD55]" />
                  </span>
                </Link>
                <div className="text-[11px] text-[#8793A5]">
                  {article.author?.designation || 'Senior Cricket Analyst'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#8793A5]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D8AD55]" />
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>

              {article.updatedAt && article.updatedAt !== article.publishedAt && (
                <div className="text-[11px] text-[#556987]">
                  (Updated {new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                </div>
              )}
            </div>
          </div>

          {/* Social Share Bar */}
          <div className="pt-1">
            <ArticleShareButtons
              title={article.title}
              url={`https://www.cricplus24.in/news/${article.slug}`}
            />
          </div>
        </header>

        {/* 3. Featured Image */}
        <figure className="space-y-2">
          <div
            className="relative w-full aspect-[16/9] h-auto rounded-3xl overflow-hidden border border-[#D8AD55]/30 bg-[#08111F] shadow-2xl flex items-center justify-center"
            style={{ width: '100%', aspectRatio: '16 / 9', height: 'auto' }}
          >
            <img
              src={article.featuredImage?.url || '/images/cricplus-stadium-4k.jpg'}
              alt={article.featuredImage?.altText || article.title}
              className="w-full h-full object-contain object-center"
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center',
              }}
            />
          </div>
          {article.featuredImage?.caption && (
            <figcaption className="text-center text-xs text-[#8793A5] italic">
              {article.featuredImage.caption}
            </figcaption>
          )}
        </figure>

        {/* 4. Table of Contents (for long analysis pieces) */}
        {headings.length >= 2 && <ArticleTableOfContents headings={headings} />}

        {/* 5. Article Crawlable Body */}
        <article className="prose prose-invert max-w-none text-gray-200">
          {article.content ? (
            article.content.split('\n\n').map((chunk, i) => renderParagraph(chunk, i))
          ) : (
            <p>{article.summary}</p>
          )}
        </article>

        {/* 6. Structured FAQs (if present) */}
        {article.faqs && article.faqs.length > 0 && (
          <section className="p-6 rounded-3xl bg-[#0D1B2A]/90 border border-[#D8AD55]/30 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 font-display font-bold text-xl text-white">
              <HelpCircle className="w-5 h-5 text-[#D8AD55]" />
              <span>Frequently Asked Questions</span>
            </div>
            <div className="divide-y divide-white/10">
              {article.faqs.map((f, i) => (
                <div key={i} className="py-4 space-y-1.5">
                  <h3 className="font-display font-bold text-base text-[#F2D69A]">
                    {f.question}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Author Bio Box (E-E-A-T Signals) */}
        <aside className="p-6 rounded-3xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 bg-[#08111F] shrink-0">
            <img
              src={article.author?.avatarUrl || '/images/editorial-author.jpg'}
              alt={article.author?.name || 'Author'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D8AD55]">About the Author</span>
              <span className="text-gray-500">•</span>
              <Link
                href={`/authors/${authorSlug}`}
                className="font-bold text-base text-white hover:text-[#D8AD55] transition-colors"
              >
                {article.author?.name || 'CricPlus24 Chief Editor'}
              </Link>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {article.author?.bio ||
                'Senior cricket journalist and analyst covering international tournaments, tactical player development, and global leagues.'}
            </p>
            {article.author?.expertise && article.author.expertise.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#8793A5] font-semibold">Specialisms:</span>
                {article.author.expertise.map((exp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/20"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 8. Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="space-y-5 pt-8 border-t border-[#D8AD55]/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display font-bold text-2xl text-white">
                <BookOpen className="w-5 h-5 text-[#D8AD55]" />
                <span>Related Cricket Analysis &amp; Reports</span>
              </div>
              <Link
                href="/news"
                className="text-xs font-bold text-[#D8AD55] hover:text-[#F2D69A] transition-colors"
              >
                View all stories →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/news/${rel.slug}`}
                  className="group block rounded-2xl bg-[#08111F] border border-white/5 hover:border-[#D8AD55]/40 overflow-hidden transition-all shadow-xl hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] bg-[#0D1B2A] overflow-hidden">
                    <img
                      src={rel.featuredImage?.url || '/images/cricplus-stadium-4k.jpg'}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-[#F2D69A] border border-white/10">
                      {rel.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-display font-bold text-sm text-white group-hover:text-[#D8AD55] transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-[11px] text-[#8793A5] line-clamp-2">{rel.summary}</p>
                    <div className="text-[10px] text-[#556987] font-semibold">
                      {rel.readingTime}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back Link */}
        <div className="pt-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Cricket News &amp; Editorials</span>
          </Link>
        </div>
      </div>
    </>
  );
}
