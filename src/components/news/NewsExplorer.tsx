'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Search,
  ArrowRight,
  Share2,
  Check,
  ShieldCheck,
  Filter,
  BookOpen,
  Eye,
} from 'lucide-react';
import {
  CricPlusArticle,
  EDITORIAL_CATEGORIES,
} from '@/lib/articleTypes';

interface NewsExplorerProps {
  initialArticles: CricPlusArticle[];
}

export function NewsExplorer({ initialArticles }: NewsExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopyLink = (slug: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/news/${slug}`;
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  // Filter articles based on active category and search query
  const filteredArticles = initialArticles.filter((art) => {
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
    <div className="space-y-8">
      {/* Search & Category Filter Navigation */}
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
            <span>Showing {filteredArticles.length} published editorial{filteredArticles.length === 1 ? '' : 's'}</span>
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

      {/* Main Listing or Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="py-20 px-6 text-center rounded-3xl bg-[#08111F] border border-white/5 space-y-4 shadow-2xl">
          <BookOpen className="w-12 h-12 mx-auto text-[#D8AD55]/60" />
          <h2 className="font-display font-black text-xl sm:text-2xl text-white">
            No editorial articles published yet. Check back soon.
          </h2>
          <p className="text-xs text-[#8793A5] max-w-lg mx-auto">
            Our editorial desk publishes comprehensive, data-driven cricket tactical breakdowns, tournament reviews, and player auction strategies.
          </p>
          {selectedCategory !== 'All Stories' && (
            <button
              onClick={() => setSelectedCategory('All Stories')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold hover:bg-[#D8AD55]/30 transition-all"
            >
              <span>View all editorial stories</span>
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
                    <div className="flex items-center gap-2 text-xs text-[#8793A5] flex-wrap">
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
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-[#F2D69A] font-semibold bg-[#0D1B2A] px-2.5 py-0.5 rounded-full border border-[#D8AD55]/30">
                        <Eye className="w-3.5 h-3.5 text-[#D8AD55]" />
                        <span>{(featuredArticle.viewsCount || 0).toLocaleString()} {featuredArticle.viewsCount === 1 ? 'view' : 'views'}</span>
                      </span>
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
                      <span>Read Article</span>
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
                    <div className="flex items-center gap-2 text-xs text-[#8793A5] flex-wrap">
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
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-[#F2D69A] font-semibold bg-[#0D1B2A] px-2 py-0.5 rounded-full border border-[#D8AD55]/30 text-[11px]">
                        <Eye className="w-3 h-3 text-[#D8AD55]" />
                        <span>{(art.viewsCount || 0).toLocaleString()}</span>
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg sm:text-xl text-white group-hover:text-[#D8AD55] transition-colors leading-snug line-clamp-2">
                      <Link href={`/news/${art.slug}`}>{art.title}</Link>
                    </h3>

                    <p className="text-xs text-[#8793A5] leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-400 font-semibold truncate max-w-[120px]">
                      By {art.author?.name || 'CricPlus24 Chief Editor'}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 text-[#F2D69A] text-xs font-bold border border-[#D8AD55]/30 transition-all shadow-sm"
                        title="Read full article & real view stats"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D8AD55]" />
                        <span>View</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
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
