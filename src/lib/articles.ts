import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/serviceKey';
import {
  CricPlusArticle,
  calculateReadingTime,
} from './articleTypes';

export * from './articleTypes';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_SERVICE_KEY = getServiceRoleKey();

/**
 * Universal Article Fetcher from Supabase / Store (Server-side only)
 */
export async function getAllArticles(includeDrafts = false, bypassCache = false): Promise<CricPlusArticle[]> {
  try {
    const storeContainer = await getStoreData<{ articles: Record<string, CricPlusArticle> }>(
      'cricplus_articles',
      'articles.json',
      { articles: {} },
      bypassCache
    );

    const storeArticles = Object.values(storeContainer?.articles || {});

    // If store already has articles, use it
    if (storeArticles.length > 0) {
      return storeArticles
        .filter((a) => (includeDrafts ? true : a.status === 'published'))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    // Fallback/Bootstrap from blog_posts table if store is empty
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: dbPosts } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (dbPosts && dbPosts.length > 0) {
      const articlesMap: Record<string, CricPlusArticle> = {};
      const converted: CricPlusArticle[] = dbPosts.map((p) => {
        const art: CricPlusArticle = {
          id: p.id,
          title: p.title,
          slug: p.slug,
          subtitle: p.subtitle || undefined,
          summary: p.summary || p.subtitle || p.title,
          content: p.content || '',
          category: p.category || 'Cricket Analysis & Tactical Breakdown',
          tags: ['Cricket', p.category || 'Editorial', 'Analysis'],
          author: {
            name: p.author_name || 'CricPlus24 Chief Editor',
            designation: 'Senior Cricket Analyst & Sports Columnist',
            avatarUrl: '/images/editorial-author.jpg',
            bio: 'Senior cricket journalist and analyst covering international tournaments, tactical player development, and global leagues.',
            expertise: ['Match Analysis', 'Player Auctions', 'Tournament Rules'],
          },
          featuredImage: {
            url: p.cover_image_url || '/images/cricplus-stadium-4k.jpg',
            altText: `${p.title} - CricPlus24 Editorial`,
          },
          publishedAt: p.published_at || new Date().toISOString(),
          readingTime: calculateReadingTime(p.content),
          status: p.status === 'draft' ? 'draft' : 'published',
          isFeatured: Boolean(p.is_featured),
          viewsCount: p.views_count || 120,
          seo: {
            seoTitle: `${p.title} | CricPlus24`,
            metaDescription: (p.summary || p.subtitle || p.title).slice(0, 160),
            primaryKeyword: 'Cricket',
            canonicalUrl: `https://www.cricplus24.in/news/${p.slug}`,
            robotsIndex: 'index',
            robotsFollow: 'follow',
            articleSchema: 'Article',
          },
        };
        articlesMap[art.slug] = art;
        return art;
      });

      // Seed store for future instant lookups
      await setStoreData('cricplus_articles', { articles: articlesMap }, 'articles.json');

      return converted.filter((a) => (includeDrafts ? true : a.status === 'published'));
    }

    return [];
  } catch (err) {
    console.error('[Articles] Error fetching all articles:', err);
    return [];
  }
}

export async function getArticleBySlug(slug: string, includeDrafts = false): Promise<CricPlusArticle | null> {
  if (!slug) return null;
  const articles = await getAllArticles(includeDrafts);
  return articles.find((a) => a.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export async function saveArticle(article: CricPlusArticle): Promise<CricPlusArticle> {
  // 1. Update store
  const storeContainer = await getStoreData<{ articles: Record<string, CricPlusArticle> }>(
    'cricplus_articles',
    'articles.json',
    { articles: {} }
  );

  const articles = storeContainer?.articles || {};
  articles[article.slug] = article;

  await setStoreData('cricplus_articles', { articles }, 'articles.json');
  invalidateStoreCache('cricplus_articles');

  // 2. Mirror into blog_posts table for SQL compatibility
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(article.id);
    const dbRow: any = {
      title: article.title,
      subtitle: article.subtitle || null,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      cover_image_url: article.featuredImage?.url || '/images/cricplus-stadium-4k.jpg',
      category: article.category,
      status: article.status === 'draft' ? 'draft' : 'published',
      is_featured: Boolean(article.isFeatured),
      author_name: article.author?.name || 'CricPlus24 Editorial Team',
      published_at: article.publishedAt,
    };
    if (isUuid) {
      dbRow.id = article.id;
    }

    await supabase.from('blog_posts').upsert(dbRow, { onConflict: 'slug' });
  } catch (dbErr) {
    console.warn('[Articles] Mirrored db upsert error (non-fatal):', dbErr);
  }

  return article;
}

export async function deleteArticle(slug: string): Promise<boolean> {
  const storeContainer = await getStoreData<{ articles: Record<string, CricPlusArticle> }>(
    'cricplus_articles',
    'articles.json',
    { articles: {} }
  );

  const articles = storeContainer?.articles || {};
  const target = articles[slug];
  if (target) {
    delete articles[slug];
    await setStoreData('cricplus_articles', { articles }, 'articles.json');
    invalidateStoreCache('cricplus_articles');

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await supabase.from('blog_posts').delete().eq('slug', slug);
    } catch (err) {
      console.warn('[Articles] DB delete error:', err);
    }
    return true;
  }
  return false;
}
