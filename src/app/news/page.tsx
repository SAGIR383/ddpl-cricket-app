'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Search,
  ArrowRight,
  TrendingUp,
  Share2,
  Check,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import {
  CricPlusArticle,
  EDITORIAL_CATEGORIES,
  slugifyCategory,
} from '@/lib/articleTypes';

export default function CricketNewsPage() {
  const [articles, setArticles] = useState<CricPlusArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function loadArticles() {
    setLoading(true);
    try {
      const res = await fetch('/api/blogs', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.posts) {
        setArticles(data.posts);
      }
    } catch (err) {
      console.error('Failed to load editorials:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  const handleCopyLink = (slug: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/news/${slug}`;
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  // Filter articles
  const filteredArticles = articles.filter((art) => {
    const matchesCategory =
      selectedCategory === 'All Stories' ||
      art.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  const featuredArticle = filteredArticles.find((a) => a.isFeatured) || filteredArticles[0];
  const regularArticles = featuredArticle
    ? filteredArticles.filter((a) => a.slug !== featuredArticle.slug)
    : filteredArticles;

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

      {/* 2. SEARCH & CATEGORY NAVIGATION BAR */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8793A5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cricket analysis, tactics, records..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white placeholder-[#8793A5] text-xs focus:border-[#D8AD55] focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8793A5]">
            <Filter className="w-4 h-4 text-[#D8AD55]" />
            <span>Showing {filteredArticles.length} original editorials</span>
          </div>
        </div>

        {/* Category Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All Stories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'All Stories'
                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] border-transparent font-black shadow-lg shadow-[#D8AD55]/20'
                : 'bg-[#0D1B2A] text-gray-300 hover:text-white border-white/10'
            }`}
          >
            All Stories
          </button>

          {EDITORIAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] border-transparent font-black shadow-lg shadow-[#D8AD55]/20'
                  : 'bg-[#0D1B2A] text-gray-300 hover:text-white border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ARTICLES FEED */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Clock className="w-8 h-8 animate-spin mx-auto text-[#D8AD55]" />
          <div className="text-sm font-bold text-white">Loading exclusive editorials...</div>
          <p className="text-xs text-[#8793A5]">Fetching verified sports analysis and articles.</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        /* Mandatory Professional Empty State */
        <div className="py-24 px-6 text-center rounded-3xl bg-[#08111F] border border-white/5 space-y-4 shadow-2xl">
          <BookOpen className="w-14 h-14 mx-auto text-[#D8AD55]/60" />
          <h2 className="font-display font-black text-2xl text-white">
            Fresh cricket analysis and exclusive CricPlus24 editorials are coming soon. Stay tuned!
          </h2>
          <p className="text-xs text-[#8793A5] max-w-lg mx-auto">
            Our editorial desk publishes comprehensive, data-driven cricket tactical breakdowns, tournament reviews, and player auction strategies.
          </p>
          {selectedCategory !== 'All Stories' && (
            <button
              onClick={() => setSelectedCategory('All Stories')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold hover:bg-[#D8AD55]/30 transition-all"
            >
              <span>View all editorial categories</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* FEATURED LEAD STORY BANNER */}
          {featuredArticle && !searchQuery && selectedCategory === 'All Stories' && (
            <div className="group relative rounded-3xl overflow-hidden bg-[#08111F] border border-[#D8AD55]/40 shadow-2xl transition-all duration-300 hover:border-[#D8AD55]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                {/* Featured Image */}
                <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto min-h-[300px] sm:min-h-[380px] bg-[#0D1B2A] overflow-hidden">
                  <img
                    src={featuredArticle.featuredImage?.url || '/images/cricplus-stadium-4k.jpg'}
                    alt={featuredArticle.featuredImage?.altText || featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-lg">
                      LEAD EDITORIAL
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/80 backdrop-blur-md text-[#F2D69A] border border-white/10">
                      {featuredArticle.category}
                    </span>
                  </div>
                </div>

                {/* Featured Content Details */}
                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-[#8793A5]">
                      <Calendar className="w-3.5 h-3.5 text-[#D8AD55]" />
                      <time dateTime={featuredArticle.publishedAt}>
                        {new Date(featuredArticle.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      <span>•</span>
                      <span>{featuredArticle.readingTime}</span>
                    </div>

                    <h2 className="font-display font-black text-2xl sm:text-3xl text-white group-hover:text-[#D8AD55] transition-colors leading-tight">
                      <Link href={`/news/${featuredArticle.slug}`}>
                        {featuredArticle.title}
                      </Link>
                    </h2>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-4">
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D8AD55]/40 bg-[#0D1B2A] shrink-0">
                        <img
                          src={featuredArticle.author?.avatarUrl || '/images/editorial-author.jpg'}
                          alt={featuredArticle.author?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center gap-1">
                          <span>{featuredArticle.author?.name}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#D8AD55]" />
                        </div>
                        <div className="text-[10px] text-[#8793A5]">
                          {featuredArticle.author?.designation || 'Sports Columnist'}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/news/${featuredArticle.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold border border-[#D8AD55]/30 transition-all"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDITORIAL ARTICLES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(selectedCategory === 'All Stories' && !searchQuery ? regularArticles : filteredArticles).map((art) => (
              <article
                key={art.slug}
                className="group flex flex-col rounded-3xl bg-[#08111F] border border-white/5 hover:border-[#D8AD55]/40 overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1"
              >
                {/* Article Thumbnail */}
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

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(art.slug)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Copy article link"
                      >
                        {copiedSlug === art.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Link
                        href={`/news/${art.slug}`}
                        className="text-xs font-bold text-[#D8AD55] group-hover:text-[#F2D69A] flex items-center gap-1 transition-colors"
                      >
                        <span>Read</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
