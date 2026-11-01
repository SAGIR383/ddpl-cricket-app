import { NextRequest, NextResponse } from 'next/server';
import {
  getAllArticles,
  getArticleBySlug,
  saveArticle,
  deleteArticle,
  slugifyTitle,
  calculateReadingTime,
  CricPlusArticle,
} from '@/lib/articles';

export const dynamic = 'force-dynamic';

function isMasterAdmin(req: NextRequest): boolean {
  const superCookie =
    req.cookies.get('cricplus_superadmin')?.value ||
    req.cookies.get('cricpluse_superadmin')?.value;
  if (superCookie === 'active_session' || superCookie?.startsWith('organizer_session:')) {
    return true;
  }

  const authHeader = req.headers.get('authorization') || '';
  const expectedPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026';
  if (authHeader === `Bearer ${expectedPassword}`) return true;

  return false;
}

// GET /api/blogs - Get article or list of articles
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    const allowDrafts = includeDrafts && isMasterAdmin(req);

    // Single post by slug
    if (slug) {
      const article = await getArticleBySlug(slug, allowDrafts);

      if (!article) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, post: article });
    }

    // List query
    let articles = await getAllArticles(allowDrafts);

    if (category && category !== 'All Stories' && category !== 'All Editorials') {
      const catLower = category.toLowerCase().replace(/[^a-z0-9]/g, '');
      articles = articles.filter(
        (a) => a.category.toLowerCase().replace(/[^a-z0-9]/g, '') === catLower
      );
    }

    return NextResponse.json({
      success: true,
      total: articles.length,
      posts: articles.slice(0, limit),
    });
  } catch (err: any) {
    console.error('[BlogsAPI] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/blogs - Create or Publish Article (Admin Only)
export async function POST(req: NextRequest) {
  try {
    if (!isMasterAdmin(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only CricPlus Administrators can publish articles.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug: customSlug,
      subtitle,
      summary,
      content,
      category,
      tags = [],
      author = {},
      featuredImage = {},
      status = 'published',
      isFeatured = false,
      seo = {},
      faqs = [],
      relatedSlugs = [],
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and article content are required.' },
        { status: 400 }
      );
    }

    const finalSlug = (customSlug?.trim() || slugifyTitle(title))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const now = new Date().toISOString();
    const readingTime = calculateReadingTime(content);

    const article: CricPlusArticle = {
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      slug: finalSlug,
      subtitle: subtitle?.trim() || undefined,
      summary: summary?.trim() || subtitle?.trim() || title.trim(),
      content,
      category: category || 'Cricket Analysis & Tactical Breakdown',
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['Cricket', category || 'Editorial'],
      author: {
        name: author.name?.trim() || 'CricPlus24 Chief Editor',
        designation: author.designation?.trim() || 'Senior Cricket Analyst & Sports Columnist',
        avatarUrl: author.avatarUrl || '/images/editorial-author.jpg',
        bio: author.bio || 'Senior cricket journalist and analyst covering international tournaments, tactical player development, and global leagues.',
        expertise: author.expertise || ['Match Analysis', 'Player Auctions', 'Tournament Rules'],
        socialLinks: author.socialLinks || {},
      },
      featuredImage: {
        url: featuredImage.url || '/images/cricplus-stadium-4k.jpg',
        altText: featuredImage.altText?.trim() || `${title.trim()} - CricPlus24 Editorial`,
        caption: featuredImage.caption?.trim() || undefined,
      },
      publishedAt: body.publishedAt || now,
      updatedAt: now,
      readingTime,
      status: status || 'published',
      scheduledAt: body.scheduledAt || undefined,
      isFeatured: Boolean(isFeatured),
      viewsCount: 0,
      seo: {
        seoTitle: seo.seoTitle?.trim() || `${title.trim()} | CricPlus24`,
        metaDescription:
          seo.metaDescription?.trim() || (summary?.trim() || title.trim()).slice(0, 160),
        primaryKeyword: seo.primaryKeyword?.trim() || 'Cricket',
        secondaryKeywords: seo.secondaryKeywords || [],
        canonicalUrl: seo.canonicalUrl?.trim() || `https://www.cricplus24.in/news/${finalSlug}`,
        ogTitle: seo.ogTitle?.trim() || seo.seoTitle?.trim() || title.trim(),
        ogDescription:
          seo.ogDescription?.trim() || seo.metaDescription?.trim() || (summary?.trim() || title.trim()).slice(0, 160),
        ogImage: seo.ogImage || featuredImage.url || '/images/cricplus-stadium-4k.jpg',
        twitterCardImage: seo.twitterCardImage || featuredImage.url || '/images/cricplus-stadium-4k.jpg',
        imageAltText: seo.imageAltText || featuredImage.altText || title.trim(),
        robotsIndex: seo.robotsIndex || 'index',
        robotsFollow: seo.robotsFollow || 'follow',
        articleSchema: seo.articleSchema || 'Article',
      },
      faqs: Array.isArray(faqs) ? faqs : [],
      relatedSlugs: Array.isArray(relatedSlugs) ? relatedSlugs : [],
    };

    await saveArticle(article);

    return NextResponse.json({
      success: true,
      message: 'Article published successfully!',
      post: article,
    });
  } catch (err: any) {
    console.error('[BlogsAPI] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/blogs - Update existing article (Admin Only)
export async function PUT(req: NextRequest) {
  try {
    if (!isMasterAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Article slug is required' }, { status: 400 });
    }

    const existing = await getArticleBySlug(slug, true);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const content = body.content !== undefined ? body.content : existing.content;

    const updated: CricPlusArticle = {
      ...existing,
      title: body.title !== undefined ? body.title.trim() : existing.title,
      subtitle: body.subtitle !== undefined ? body.subtitle.trim() : existing.subtitle,
      summary: body.summary !== undefined ? body.summary.trim() : existing.summary,
      content,
      category: body.category !== undefined ? body.category : existing.category,
      tags: body.tags !== undefined ? body.tags : existing.tags,
      author: body.author ? { ...existing.author, ...body.author } : existing.author,
      featuredImage: body.featuredImage ? { ...existing.featuredImage, ...body.featuredImage } : existing.featuredImage,
      status: body.status !== undefined ? body.status : existing.status,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
      updatedAt: now,
      readingTime: calculateReadingTime(content),
      seo: body.seo ? { ...existing.seo, ...body.seo } : existing.seo,
      faqs: body.faqs !== undefined ? body.faqs : existing.faqs,
      relatedSlugs: body.relatedSlugs !== undefined ? body.relatedSlugs : existing.relatedSlugs,
    };

    await saveArticle(updated);

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully!',
      post: updated,
    });
  } catch (err: any) {
    console.error('[BlogsAPI] PUT error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/blogs - Delete article (Admin Only)
export async function DELETE(req: NextRequest) {
  try {
    if (!isMasterAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || searchParams.get('id');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Article slug or ID is required' }, { status: 400 });
    }

    const ok = await deleteArticle(slug);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to delete article or not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Article permanently deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
