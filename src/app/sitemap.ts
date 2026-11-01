import { MetadataRoute } from 'next';
import { getAllArticles, EDITORIAL_CATEGORIES, slugifyCategory } from '@/lib/articles';
import { getStoreData } from '@/lib/supabase/store';
import { CRICKET_TOOLS } from '@/lib/cricketTools';

const SITE_URL = 'https://www.cricplus24.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Core Public Platform Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tournaments`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/matches`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/standings`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/leaderboard`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/archive`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/download`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Cricket Calculators & Tools Hub
    {
      url: `${SITE_URL}/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    // Trust & Editorial Policy Pages
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/editorial-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/corrections-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/copyright-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/advertising-disclosure`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Interactive Cricket Tools & Calculators
  const toolRoutes: MetadataRoute.Sitemap = CRICKET_TOOLS.map((tool) => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. Editorial Categories
  const categoryRoutes: MetadataRoute.Sitemap = EDITORIAL_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/news/category/${slugifyCategory(cat)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 4. Published Original Articles (Drafts & Noindex strictly excluded)
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getAllArticles(false);
    articleRoutes = articles
      .filter((a) => a.status === 'published' && a.seo?.robotsIndex !== 'noindex')
      .map((a) => ({
        url: `${SITE_URL}/news/${a.slug}`,
        lastModified: new Date(a.updatedAt || a.publishedAt),
        changeFrequency: 'weekly',
        priority: a.isFeatured ? 0.9 : 0.8,
      }));
  } catch (err) {
    console.warn('[Sitemap] Failed to load articles:', err);
  }

  // 5. Public Tournament Hubs
  let tournamentRoutes: MetadataRoute.Sitemap = [];
  try {
    const configs = await getStoreData<Record<string, any>>(
      'tournament_configs',
      'tournament_configs.json',
      {}
    );
    tournamentRoutes = Object.values(configs)
      .filter((cfg: any) => cfg.isPublic !== false && cfg.slug)
      .map((cfg: any) => ({
        url: `${SITE_URL}/tournaments/${cfg.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.75,
      }));
  } catch (err) {
    console.warn('[Sitemap] Failed to load tournaments:', err);
  }

  return [
    ...staticRoutes,
    ...toolRoutes,
    ...categoryRoutes,
    ...articleRoutes,
    ...tournamentRoutes,
  ];
}
