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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const refresh = searchParams.get('refresh') === 'true';

    const now = Date.now();
    const shouldSync = refresh || now - lastSyncTime > SYNC_INTERVAL_MS || cachedNews.length === 0;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
