'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  Share2,
  Check,
  Sparkles,
  BookOpen,
  MessageCircle,
  Eye,
} from 'lucide-react';

interface ArticleData {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  summary?: string;
  content: string;
  cover_image_url?: string;
  category: string;
  author_name: string;
  published_at: string;
  views_count?: number;
  source?: string;
  isEditorial?: boolean;
}

function calculateReadingTime(text: string): string {
  const words = text ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;

    async function loadArticle() {
      setLoading(true);
      try {
        // 1. Try fetching from CricPlus blogs/editorials first
        const blogRes = await fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`);
        const blogData = await blogRes.json();

        if (blogData.success && blogData.post) {
          const bp = blogData.post;
          setPost({
            id: bp.id,
            title: bp.title,
            subtitle: bp.subtitle,
            slug: bp.slug,
            summary: bp.summary,
            content: bp.content || bp.summary || '',
            cover_image_url: bp.cover_image_url,
            category: bp.category,
            author_name: bp.author_name || 'CricPlus Editorial',
            published_at: bp.published_at,
            views_count: bp.views_count,
            source: 'CricPlus',
            isEditorial: true,
          });
        } else {
          // 2. If not an editorial blog, fetch from Global Cricket News (scrapes full content if not cached)
          const newsRes = await fetch(`/api/news?slug=${encodeURIComponent(slug)}`);
          const newsData = await newsRes.json();

          if (newsData.success && newsData.article) {
            const art = newsData.article;
            setPost({
              id: art.id,
              title: art.title,
              subtitle: art.summary !== art.content ? art.summary : undefined,
              slug: art.slug,
              summary: art.summary,
              content: art.content || art.summary || '',
              cover_image_url: art.image_url,
              category: art.category || 'Global Cricket',
              author_name: art.author || art.source || 'CricPlus News Desk',
              published_at: art.published_at,
              source: art.source || 'Global News',
              isEditorial: false,
            });
          }
        }

        // 3. Fetch related stories (editorials + news)
        const relRes = await fetch('/api/news?limit=4');
        const relData = await relRes.json();
        if (relData.articles) {
          setRelated(
            relData.articles
              .filter((a: any) => a.slug !== slug)
              .slice(0, 3)
              .map((a: any) => ({
                slug: a.slug,
                title: a.title,
                category: a.category || 'News',
                cover_image_url: a.image_url,
              }))
          );
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [slug]);

  function handleShare(platform?: 'whatsapp' | 'twitter') {
    if (!post) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${post.title} | CricPlus24`;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
      return;
    }

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      return;
    }

    if (navigator.share) {
      navigator.share({ title: post.title, text: post.summary || '', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Clean Renderer for Article Body
  function renderContent(rawText: string) {
    if (!rawText) return null;
    const paragraphs = rawText.split(/\n+/).filter(Boolean);

    return paragraphs.map((para, idx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-display font-extrabold text-xl text-[#F2D69A] mt-6 mb-3">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="font-display font-black text-2xl text-white mt-8 mb-4 border-b border-gray-800 pb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }

      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-[#D8AD55] pl-4 py-2 my-4 bg-[#0D1B2A]/60 rounded-r-xl italic text-gray-200">
            {trimmed.replace('> ', '').replace(/\*/g, '')}
          </blockquote>
        );
      }

      if (
        trimmed.startsWith('1. ') ||
        trimmed.startsWith('2. ') ||
        trimmed.startsWith('3. ') ||
        trimmed.startsWith('- ') ||
        trimmed.startsWith('* ')
      ) {
        return (
          <li key={idx} className="ml-5 list-disc text-gray-300 text-sm sm:text-base leading-relaxed my-1">
            {trimmed.replace(/^(\d+\.|\-|\*)\s+/, '')}
          </li>
        );
      }

      if (trimmed.startsWith('"') || trimmed.startsWith('“')) {
        return (
          <p
            key={idx}
            className="border-l-2 border-[#D8AD55]/60 pl-4 py-1.5 text-gray-200 text-sm sm:text-base italic leading-relaxed my-4 bg-[#0D1B2A]/40 rounded-r-lg"
          >
            {trimmed}
          </p>
        );
      }

      return (
        <p key={idx} className="text-gray-300 text-sm sm:text-base leading-relaxed my-4 font-normal">
          {trimmed}
        </p>
      );
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040814] flex flex-col items-center justify-center text-gray-400">
        <Sparkles className="w-8 h-8 text-[#D8AD55] animate-spin mb-3" />
        <p className="text-sm">Loading article…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#040814] flex flex-col items-center justify-center text-center px-4">
        <BookOpen className="w-12 h-12 text-[#D8AD55] mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white">Article Not Found</h2>
        <p className="text-xs text-gray-400 mt-2 max-w-sm">
          This article might have been moved or removed by the editorial desk.
        </p>
        <Link
          href="/news"
          className="mt-6 px-4 py-2 rounded-lg bg-[#D8AD55] text-black text-xs font-bold hover:bg-[#F2D69A]"
        >
          Return to Cricket News
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-[#040814] text-gray-100 pb-24">
      {/* Top Breadcrumbs & Back */}
      <div className="border-b border-gray-800 bg-[#08111F]/80 backdrop-blur-md sticky top-[60px] z-30 py-3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#D8AD55] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All News</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare('whatsapp')}
              className="p-1.5 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleShare()}
              className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Copy Article Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Reading Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        {/* Category Pill */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded bg-[#D8AD55] text-black text-[11px] font-black uppercase tracking-wider">
            {post.isEditorial ? '✍️ CricPlus Editorial' : `🏏 ${post.source || 'Cricket News'}`}
          </span>
          <span className="px-2.5 py-1 rounded bg-[#0D1B2A] border border-[#D8AD55]/40 text-[#F2D69A] text-[10px] font-bold uppercase tracking-wider">
            {post.category}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-black text-2xl sm:text-4xl text-white leading-tight tracking-tight">
          {post.title}
        </h1>

        {/* Subtitle / Teaser */}
        {post.subtitle && (
          <p className="text-sm sm:text-lg text-gray-300 mt-3 font-medium leading-relaxed">
            {post.subtitle}
          </p>
        )}

        {/* Author / Timestamp / View Meta */}
        <div className="flex flex-wrap items-center gap-4 py-4 my-6 border-y border-gray-800 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#D8AD55] text-black font-black flex items-center justify-center text-xs">
              {post.isEditorial ? 'CP' : '🏏'}
            </div>
            <div>
              <span className="text-white font-bold block">{post.author_name}</span>
              <span className="text-[10px] text-[#D8AD55] uppercase font-bold tracking-wider">
                {post.isEditorial ? 'Master Desk' : (post.source || 'Global Coverage')}
              </span>
            </div>
          </div>

          <span className="text-gray-600">•</span>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D8AD55]" />
            <span>
              {new Date(post.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <span className="text-gray-600">•</span>

          <span>{calculateReadingTime(post.content)}</span>

          {post.views_count !== undefined && (
            <>
              <span className="text-gray-600">•</span>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-gray-500" />
                <span>{post.views_count} views</span>
              </div>
            </>
          )}
        </div>

        {/* Cover Image */}
        {post.cover_image_url && (
          <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl mb-8 bg-black">
            <Image
              src={post.cover_image_url?.replace(/^http:\/\//i, 'https://') || '/images/cricket-hero.jpg'}
              alt={post.title}
              fill
              unoptimized
              priority
              className="object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = '/images/cricket-hero.jpg';
              }}
            />
          </div>
        )}

        {/* Content Body */}
        <div className="prose prose-invert max-w-none">
          {renderContent(post.content)}
        </div>

        {/* Share Footer */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#08111F] p-6 rounded-2xl border border-gray-800">
          <div>
            <h4 className="font-display font-bold text-white text-base">Enjoyed this coverage?</h4>
            <p className="text-xs text-gray-400 mt-0.5">Share with your cricket group or friends</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare('whatsapp')}
              className="px-4 py-2 rounded-lg bg-[#25D366] text-black font-black text-xs flex items-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare()}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs flex items-center gap-2 transition-all border border-gray-700"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Related Stories */}
        {related.length > 0 && (
          <div className="mt-16 space-y-4">
            <h3 className="font-display font-black text-lg text-white tracking-wide border-b border-gray-800 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D8AD55]" />
              <span>Related Cricket Stories</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/news/${item.slug}`}
                  className="group bg-[#08111F] border border-gray-800 rounded-xl overflow-hidden hover:border-[#D8AD55]/40 transition-all p-3 space-y-2 block"
                >
                  <div className="relative h-28 w-full rounded-lg overflow-hidden bg-black">
                    <Image
                      src={item.cover_image_url?.replace(/^http:\/\//i, 'https://') || '/images/cricket-hero.jpg'}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = '/images/cricket-hero.jpg';
                      }}
                    />
                  </div>
                  <span className="text-[9px] uppercase font-bold text-[#D8AD55] block">
                    {item.category}
                  </span>
                  <h4 className="font-display font-bold text-xs text-white group-hover:text-[#D8AD55] transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
