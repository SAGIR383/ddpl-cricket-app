import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchLiveCricketNews, CricketNewsItem } from '@/lib/cricketNewsFetcher';
import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_SERVICE_KEY = getServiceRoleKey();

// Cache memory fallback for ultra-fast response
let cachedNews: CricketNewsItem[] = [];
let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 mins

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&mdash;|&ndash;/g, '—')
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const refresh = searchParams.get('refresh') === 'true';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Single article lookup by slug (stays 100% inside CricPlus24)
    if (slug) {
      let article: any = null;
      try {
        const { data, error } = await supabase
          .from('cricket_news')
          .select('*')
          .eq('slug', slug)
          .single();
        if (!error && data) article = data;
      } catch (err) {}

      if (!article) {
        article = cachedNews.find((c) => c.slug === slug);
      }

      if (article) {
        // Upgrade image URL to https
        if (article.image_url) {
          article.image_url = article.image_url.replace(/^http:\/\//i, 'https://');
        }

        // If content is empty or short, fetch full story paragraphs from source_url
        if ((!article.content || article.content.length < 150) && article.source_url) {
          try {
            const pageRes = await fetch(article.source_url, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
              signal: AbortSignal.timeout(6000),
            });
            if (pageRes.ok) {
              const html = await pageRes.text();
              const extractedParas: string[] = [];

              // Method 1: Check Next.js data (used by modern ESPN Cricinfo)
              const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
              if (nextDataMatch) {
                try {
                  const nextData = JSON.parse(nextDataMatch[1]);
                  const items = nextData?.props?.appPageProps?.data?.data?.content?.content?.items || [];
                  for (const it of items) {
                    const raw = it.html || it.text || '';
                    const clean = cleanHtmlEntities(raw);
                    if (clean.length > 30) {
                      extractedParas.push(clean);
                    }
                  }
                } catch (jsonErr) {}
              }

              // Method 2: Fallback to HTML <p> tags
              if (extractedParas.length === 0) {
                const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
                for (const p of pMatches) {
                  const clean = cleanHtmlEntities(p);
                  if (
                    clean.length > 45 &&
                    !clean.toLowerCase().includes('cookie') &&
                    !clean.toLowerCase().includes('terms of') &&
                    !clean.toLowerCase().includes('privacy policy') &&
                    !clean.toLowerCase().includes('all rights reserved')
                  ) {
                    extractedParas.push(clean);
                  }
                }
              }

              if (extractedParas.length > 0) {
                article.content = extractedParas.join('\n\n');
                if (article.id) {
                  supabase
                    .from('cricket_news')
                    .update({ content: article.content })
                    .eq('id', article.id)
                    .then();
                }
              }
            }
          } catch (scrapeErr) {
            console.warn('[NewsAPI] Scrape full article error:', scrapeErr);
          }
        }

        // Guaranteed fallback content
        if (!article.content || article.content.length < 50) {
          article.content = `${article.summary}\n\nStay tuned with CricPlus24 for full ball-by-ball tournament scorecards, win probability metrics, and ongoing international match reports.`;
        }

        return NextResponse.json({ success: true, article });
      }

      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const now = Date.now();
    const shouldSync = refresh || now - lastSyncTime > SYNC_INTERVAL_MS || cachedNews.length === 0;

    if (shouldSync) {
      try {
        const liveItems = await fetchLiveCricketNews();
        if (liveItems.length > 0) {
          cachedNews = liveItems;
          lastSyncTime = now;

          // Asynchronously upsert into Supabase for permanent archiving
          const upsertRows = liveItems.map((item) => ({
            title: item.title,
            slug: item.slug,
            summary: item.summary,
            image_url: item.image_url,
            source: item.source,
            source_url: item.source_url,
            category: item.category,
            published_at: item.published_at,
          }));

          // Upsert in background without blocking API response
          supabase
            .from('cricket_news')
            .upsert(upsertRows, { onConflict: 'slug', ignoreDuplicates: true })
            .then(({ error }) => {
              if (error) console.warn('[NewsAPI] Supabase archive sync error:', error.message);
            });
        }
      } catch (syncErr) {
        console.warn('[NewsAPI] Sync live news error:', syncErr);
      }
    }

    // Try fetching combined archive from Supabase
    let allNews: CricketNewsItem[] = [];
    try {
      let query = supabase
        .from('cricket_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(Math.max(limit * 2, 50));

      if (category && category !== 'All Stories') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        allNews = data as CricketNewsItem[];
      }
    } catch (dbErr) {
      console.warn('[NewsAPI] Supabase query fallback:', dbErr);
    }

    // If Supabase returned empty or failed, fallback to memory cached items
    if (allNews.length === 0) {
      allNews = cachedNews;
      if (category && category !== 'All Stories') {
        allNews = allNews.filter((n) => n.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const s = search.toLowerCase();
        allNews = allNews.filter((n) => n.title.toLowerCase().includes(s) || n.summary.toLowerCase().includes(s));
      }
    }

    return NextResponse.json({
      success: true,
      total: allNews.length,
      lastUpdated: new Date(lastSyncTime || Date.now()).toISOString(),
      articles: allNews.slice(0, limit),
    });
  } catch (error: any) {
    console.error('[NewsAPI] General error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch news', articles: [] }, { status: 500 });
  }
}
