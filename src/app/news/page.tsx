'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flame,
  Globe,
  Clock,
  ExternalLink,
  Share2,
  Search,
  Sparkles,
  BookOpen,
  Filter,
  RefreshCw,
  Trophy,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Check,
} from 'lucide-react';

interface Article {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  source: string;
  source_url?: string;
  category: string;
  published_at: string;
  author_name?: string;
  isBlog?: boolean;
}

const CATEGORIES = [
  'All Stories',
  'CricPlus Editorials',
  'Test & WTC',
  'ODIs & Cups',
  'T20 & Leagues',
  'Match Reports',
  'Analysis & Debates',
];

function getTimeAgo(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recent';
  }
}

export default function CricketNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [blogs, setBlogs] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function loadContent(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch live global news (ESPN Cricinfo, Cricbuzz, etc.)
      const newsRes = await fetch(`/api/news${isRefresh ? '?refresh=true' : ''}`);
      const newsData = await newsRes.json();
      const newsList: Article[] = newsData.articles || [];

      // 2. Fetch CricPlus Editorials & Blogs
      const blogRes = await fetch('/api/blogs');
      const blogData = await blogRes.json();
      const blogList: Article[] = (blogData.posts || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        summary: b.summary || b.subtitle || '',
        image_url: b.cover_image_url || '/images/cricplus-stadium-4k.jpg',
        source: 'CricPlus Editorial',
        category: b.category || 'Editorial',
        published_at: b.published_at,
        author_name: b.author_name || 'CricPlus Chief Editor',
        isBlog: true,
      }));

      setBlogs(blogList);
      setArticles(newsList);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadContent();

    // Auto-sync every 60s so newly broken international news streams live into CricPlus24
    const interval = setInterval(() => {
      loadContent(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  function handleShare(article: Article, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/news/${article.slug}`;

    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${article.title} - ${url}`);
      setCopiedSlug(article.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  }

  // Combine blogs & global news
  const allStories: Article[] = [...blogs, ...articles];

  // Filtering
  const filteredStories = allStories.filter((item) => {
    // Category match
    if (selectedCategory === 'CricPlus Editorials') {
      if (!item.isBlog) return false;
    } else if (selectedCategory !== 'All Stories') {
      if (item.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      return matchTitle || matchSummary;
    }

    return true;
  });

  // Hero Spotlight Story (Prefer featured blog or latest major headline)
  const heroStory = filteredStories.length > 0 ? filteredStories[0] : null;
  const feedStories = filteredStories.length > 1 ? filteredStories.slice(1) : [];

  // Top 5 "Most Read / Trending" for Sidebar
  const trendingStories = [...allStories]
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#040814] text-gray-100 pb-20">
      
      {/* Top Banner / Ticker Header */}
      <div className="border-b border-[#D8AD55]/20 bg-[#08111F]/80 backdrop-blur-md sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
            
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D8AD55] to-[#0D1B2A] p-0.5 shadow-md shadow-[#D8AD55]/15 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-wide">
                    Cricket News <span className="text-[#D8AD55]">&amp; Editorials</span>
                  </h1>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-red-600/30 border border-red-500/50 text-red-400 animate-pulse">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 hidden sm:block">
                  Real-time international coverage, series previews, and exclusive CricPlus24 analysis
                </p>
              </div>
            </div>

            {/* Controls: Search & Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search stories, players, series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0D1B2A] border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <button
                onClick={() => loadContent(true)}
                disabled={refreshing}
                title="Refresh news feeds"
                className="p-2 rounded-lg bg-[#0D1B2A] border border-gray-800 text-[#D8AD55] hover:bg-[#D8AD55]/10 hover:border-[#D8AD55]/40 transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Cricinfo & Cricbuzz Style Category Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar border-t border-gray-800/60">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#D8AD55] text-black shadow-md shadow-[#D8AD55]/20 font-black'
                      : 'bg-[#0D1B2A]/90 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-800'
                  }`}
                >
                  {cat === 'CricPlus Editorials' && '✍️ '}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-8 h-8 text-[#D8AD55] animate-spin" />
            <p className="text-sm text-gray-400 font-medium tracking-wide">
              Fetching global cricket news from ESPN Cricinfo &amp; Cricbuzz…
            </p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 bg-[#08111F] rounded-2xl border border-gray-800 p-8">
            <BookOpen className="w-12 h-12 text-[#D8AD55] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white">No stories match your filter</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Try searching with another keyword or selecting "All Stories" to explore everything.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All Stories');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#D8AD55] text-black text-xs font-bold hover:bg-[#F2D69A]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left / Center Column: 8 Cols (Hero + Feed Stream) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Featured Spotlight Card */}
              {heroStory && (
                <div className="group relative rounded-2xl overflow-hidden border border-[#D8AD55]/30 bg-[#08111F] shadow-xl hover:border-[#D8AD55]/60 transition-all duration-300">
                  <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black">
                    <Image
                      src={heroStory.image_url?.replace(/^http:\/\//i, 'https://') || '/images/cricket-hero.jpg'}
                      alt={heroStory.title}
                      fill
                      unoptimized
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = '/images/cricket-hero.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08111F] via-[#08111F]/60 to-transparent" />
                    
                    {/* Badges on Top */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-[#D8AD55] text-black text-[11px] font-black uppercase tracking-wider shadow-md">
                        {heroStory.isBlog ? '✍️ CricPlus Editorial' : heroStory.source}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[#F2D69A] border border-[#D8AD55]/40 text-[10px] font-bold uppercase tracking-wider">
                        {heroStory.category}
                      </span>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={(e) => handleShare(heroStory, e)}
                      title="Share Article"
                      className="absolute top-4 right-4 p-2 rounded-full bg-black/60 backdrop-blur-md border border-gray-700 text-gray-200 hover:text-white hover:bg-black/90 transition-colors"
                    >
                      {copiedSlug === heroStory.slug ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Hero Content */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-[#D8AD55]" />
                      <span>{getTimeAgo(heroStory.published_at)}</span>
                      <span>•</span>
                      <span>{heroStory.author_name || heroStory.source}</span>
                    </div>

                    <Link
                      href={`/news/${heroStory.slug}`}
                      className="block group/title"
                    >
                      <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white group-hover/title:text-[#D8AD55] transition-colors leading-snug">
                        {heroStory.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3">
                      {heroStory.summary}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-800">
                      <Link
                        href={`/news/${heroStory.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D8AD55] hover:text-[#F2D69A] transition-colors"
                      >
                        <span>{heroStory.isBlog ? 'Read Complete Editorial' : 'Read Full Story'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed Stream Cards (Matching Cricinfo / Cricbuzz Layout) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <h3 className="font-display font-bold text-base text-white tracking-wide flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#D8AD55]" />
                    <span>Latest Cricket Stories</span>
                  </h3>
                  <span className="text-xs text-gray-400">
                    Showing {filteredStories.length} updates
                  </span>
                </div>

                <div className="divide-y divide-gray-800/80 bg-[#08111F] rounded-2xl border border-gray-800/80 overflow-hidden shadow-lg">
                  {feedStories.map((item, idx) => (
                    <article
                      key={item.slug || idx}
                      className="p-4 sm:p-5 hover:bg-[#0D1B2A]/60 transition-colors flex flex-col sm:flex-row gap-4 items-start group"
                    >
                      {/* Image Thumbnail */}
                      <Link
                        href={`/news/${item.slug}`}
                        className="relative w-full sm:w-44 h-40 sm:h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-gray-800 group-hover:border-[#D8AD55]/40 transition-colors block"
                      >
                        <Image
                          src={item.image_url?.replace(/^http:\/\//i, 'https://') || '/images/cricket-ball-blast.jpg'}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = '/images/cricplus-stadium-4k.jpg';
                          }}
                        />
                        {item.isBlog && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#D8AD55] text-black text-[9px] font-black uppercase">
                            Editorial
                          </span>
                        )}
                      </Link>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">
                          <span>{item.source}</span>
                          <span>•</span>
                          <span className="text-gray-400">{item.category}</span>
                          <span>•</span>
                          <span className="text-gray-400 font-normal">{getTimeAgo(item.published_at)}</span>
                        </div>

                        <Link
                          href={`/news/${item.slug}`}
                          className="block"
                        >
                          <h4 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-[#D8AD55] transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                        </Link>

                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-xs">
                          <Link
                            href={`/news/${item.slug}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D8AD55] hover:text-[#F2D69A]"
                          >
                            <span>Read Full Story</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          <button
                            onClick={(e) => handleShare(item, e)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Share"
                          >
                            {copiedSlug === item.slug ? (
                              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Copied
                              </span>
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: 4 Cols (Sidebar: Most Read & CricPlus Specials) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* CricPlus Editorial Box */}
              <div className="rounded-2xl border border-[#D8AD55]/30 bg-gradient-to-b from-[#0D1B2A] to-[#08111F] p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D8AD55]" />
                    <h3 className="font-display font-extrabold text-sm text-white tracking-wide uppercase">
                      From The Chief Editor
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#D8AD55] bg-[#D8AD55]/10 px-2 py-0.5 rounded border border-[#D8AD55]/30">
                    Exclusive
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Deep-dive tactical analysis, auction breakdowns, and tournament stories written by our master cricket editorial desk.
                </p>
                {blogs.length > 0 && (
                  <div className="pt-2 border-t border-gray-800 space-y-2">
                    {blogs.slice(0, 3).map((b) => (
                      <Link
                        key={b.slug}
                        href={`/news/${b.slug}`}
                        className="block group/b hover:bg-black/30 p-2 rounded-lg transition-colors"
                      >
                        <h5 className="font-display font-bold text-xs text-white group-hover/b:text-[#D8AD55] transition-colors line-clamp-2 leading-snug">
                          {b.title}
                        </h5>
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                          <Clock className="w-2.5 h-2.5 text-[#D8AD55]" />
                          <span>{getTimeAgo(b.published_at)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Cricinfo Style "Most Read" / Trending Widget */}
              <div className="rounded-2xl border border-gray-800 bg-[#08111F] p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <h3 className="font-display font-extrabold text-sm text-white tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span>Most Read Stories</span>
                  </h3>
                  <span className="text-[10px] text-gray-500 uppercase font-black">24H TRENDING</span>
                </div>

                <div className="space-y-3.5">
                  {trendingStories.map((trend, idx) => (
                    <Link
                      key={trend.slug || idx}
                      href={`/news/${trend.slug}`}
                      className="flex items-start gap-3 group/trend hover:bg-[#0D1B2A]/50 p-1.5 rounded-lg transition-colors"
                    >
                      <span className="font-display font-black text-xl text-[#D8AD55]/70 w-5 shrink-0 text-center leading-none">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-display font-bold text-xs text-white group-hover/trend:text-[#D8AD55] transition-colors line-clamp-2 leading-snug">
                          {trend.title}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                          <span>{trend.source}</span>
                          <span>•</span>
                          <span>{getTimeAgo(trend.published_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tournament Match Center Quick Promo */}
              <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#08111F] to-[#040814] p-5 shadow-lg space-y-3 text-center">
                <Trophy className="w-8 h-8 text-[#D8AD55] mx-auto" />
                <h4 className="font-display font-bold text-sm text-white">
                  Hosting a Corporate or Club League?
                </h4>
                <p className="text-xs text-gray-400">
                  Manage auctions, group stages, live ball-by-ball scoring and automated points table.
                </p>
                <Link
                  href="/tournaments/create"
                  className="inline-block w-full py-2 px-3 rounded-lg bg-[#D8AD55] text-black text-xs font-black uppercase tracking-wider hover:bg-[#F2D69A] transition-colors"
                >
                  Create Tournament
                </Link>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
