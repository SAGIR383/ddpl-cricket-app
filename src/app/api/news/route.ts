import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles, getArticleBySlug } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * GET /api/news
 * Cleanly serves ONLY original CricPlus24 editorial articles and news.
 * Third-party news aggregation (ESPN Cricinfo, Cricbuzz, scrapers) has been completely discontinued.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // 1. Single article lookup by slug (Original CricPlus24 article only)
    if (slug) {
      const article = await getArticleBySlug(slug, false);

      if (article && article.status === 'published') {
        return NextResponse.json(
          {
            success: true,
            article: {
              id: article.id,
              title: article.title,
              subtitle: article.subtitle,
              slug: article.slug,
              summary: article.summary,
              content: article.content,
              image_url: article.featuredImage?.url || '/images/cricplus-stadium-4k.jpg',
              image_alt: article.featuredImage?.altText,
              source: 'CricPlus24',
              category: article.category,
              published_at: article.publishedAt,
              updated_at: article.updatedAt,
              author_name: article.author?.name || 'CricPlus24 Editorial Team',
              author_designation: article.author?.designation,
              author_avatar: article.author?.avatarUrl,
              author_bio: article.author?.bio,
              reading_time: article.readingTime,
              tags: article.tags,
              seo: article.seo,
              faqs: article.faqs,
              related_slugs: article.relatedSlugs,
              isEditorial: true,
            },
          },
          {
            headers: {
              'Cache-Control': 'no-store, max-age=0',
            },
          }
        );
      }

      // Return 404 for nonexistent or retired external article slugs
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // 2. Public article listing (Original CricPlus24 articles only)
    let articles = await getAllArticles(false);

    if (category && category !== 'All Stories' && category !== 'All Editorials') {
      const catLower = category.toLowerCase().replace(/[^a-z0-9]/g, '');
      articles = articles.filter(
        (a) => a.category.toLowerCase().replace(/[^a-z0-9]/g, '') === catLower
      );
    }

    if (search) {
      const s = search.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          (a.summary && a.summary.toLowerCase().includes(s)) ||
          a.tags.some((t) => t.toLowerCase().includes(s))
      );
    }

    const formattedArticles = articles.slice(0, limit).map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: a.subtitle,
      slug: a.slug,
      summary: a.summary,
      content: a.content,
      image_url: a.featuredImage?.url || '/images/cricplus-stadium-4k.jpg',
      image_alt: a.featuredImage?.altText,
      source: 'CricPlus24',
      category: a.category,
      published_at: a.publishedAt,
      author_name: a.author?.name || 'CricPlus24 Editorial Desk',
      author_avatar: a.author?.avatarUrl,
      author_designation: a.author?.designation,
      reading_time: a.readingTime,
      isEditorial: true,
      tags: a.tags,
    }));

    return NextResponse.json(
      {
        success: true,
        total: formattedArticles.length,
        lastUpdated: new Date().toISOString(),
        articles: formattedArticles,
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
