import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchLiveCricketNews, extractArticleContent, CricketNewsItem } from '@/lib/cricketNewsFetcher';
import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  getServiceRoleKey() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf';

// In-memory cache fallback for instant rendering
let cachedNews: CricketNewsItem[] = [];
let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes live auto-sync

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const refresh = searchParams.get('refresh') === 'true';

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Single article lookup by slug (stays 100% inside CricPlus24)
    if (slug) {
      let article: any = null;
      let dbError: any = null;
      let dataCount = 0;
      try {
        const { data, error } = await supabase
          .from('cricket_news')
          .select('*')
          .eq('slug', slug)
          .limit(1);
        if (error) dbError = error.message;
        if (data) dataCount = data.length;
        if (!error && data && data.length > 0) {
          article = data[0];
        }
      } catch (err: any) {
        dbError = err?.message || 'DB catch error';
      }

      const fromDb = Boolean(article);

      if (!article) {
        article = cachedNews.find((c) => c.slug === slug);
      }

      if (article) {
        // Upgrade image URL to https
        if (article.image_url) {
          article.image_url = article.image_url.replace(/^http:\/\//i, 'https://');
        }

        // If content is empty or short, fetch full story paragraphs from source_url
        if ((!article.content || article.content.length < 250) && article.source_url) {
          try {
            const extracted = await extractArticleContent(article.source_url);
            if (extracted && extracted.length > 100) {
              article.content = extracted;
              if (article.id) {
                await supabase
                  .from('cricket_news')
                  .update({ content: article.content })
                  .eq('id', article.id);
              }
            }
          } catch (scrapeErr) {
            console.warn('[NewsAPI] Scrape full article error:', scrapeErr);
          }
        }

        // Fallback to summary only if no content could be retrieved
        if (!article.content || article.content.length < 50) {
          article.content = article.summary || '';
        }

        return NextResponse.json(
          {
            success: true,
            article,
            _debug: {
              fromDb,
              dataCount,
              dbError,
              keyPrefix: SUPABASE_KEY ? SUPABASE_KEY.slice(0, 10) : 'none',
              supabaseUrl: SUPABASE_URL,
            },
          },
          {
            headers: {
              'Cache-Control': 'no-store, max-age=0',
            },
          }
        );
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
          // CRITICAL: Only include 'content' if it is non-empty, NEVER overwrite existing rich content with null!
          const upsertRows = liveItems.map((item) => {
            const row: any = {
              title: item.title,
              slug: item.slug,
              summary: item.summary,
              image_url: item.image_url,
              source: item.source,
              source_url: item.source_url,
              category: item.category,
              published_at: item.published_at,
            };
            if (item.content && item.content.length > 50) {
              row.content = item.content;
            }
            return row;
          });

          // Upsert in background without blocking API response
          supabase
            .from('cricket_news')
            .upsert(upsertRows, { onConflict: 'slug' })
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

    return NextResponse.json(
      {
        success: true,
        total: allNews.length,
        lastUpdated: new Date(lastSyncTime || Date.now()).toISOString(),
        articles: allNews.slice(0, limit),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('[NewsAPI] General error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch news', articles: [] },
      { status: 500 }
    );
  }
}
