import { NextRequest, NextResponse } from 'next/server';
import { incrementArticleViews, getArticleViews, getAllArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/news/views?slug=xyz
 * Returns current authentic real view count for an article or all articles
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const views = await getArticleViews(slug);
      return NextResponse.json({
        success: true,
        slug,
        viewsCount: views,
      });
    }

    // Return view counts map for all published articles
    const articles = await getAllArticles(true);
    const viewsMap: Record<string, number> = {};
    articles.forEach((a) => {
      viewsMap[a.slug] = typeof a.viewsCount === 'number' ? a.viewsCount : 0;
    });

    return NextResponse.json({
      success: true,
      views: viewsMap,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/news/views
 * Body: { slug: string }
 * Increments the authentic real view count for the article
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = body?.slug?.trim();

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Article slug is required' },
        { status: 400 }
      );
    }

    const updatedViews = await incrementArticleViews(slug);

    return NextResponse.json({
      success: true,
      slug,
      viewsCount: updatedViews,
    });
  } catch (err: any) {
    console.error('[ArticleViews] Increment error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
