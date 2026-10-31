import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const SUPABASE_SERVICE_KEY = getServiceRoleKey();

function isMasterAdmin(req: NextRequest): boolean {
  // 1. Check cookies
  const superCookie = req.cookies.get('cricplus_superadmin')?.value || req.cookies.get('cricpluse_superadmin')?.value;
  if (superCookie === 'active_session') return true;

  // 2. Check secret header
  const authHeader = req.headers.get('authorization') || '';
  const expectedPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026';
  if (authHeader === `Bearer ${expectedPassword}`) return true;

  return false;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 100);
}

// GET /api/blogs - Public access across the globe
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Single post by slug
    if (slug) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
      }

      // Increment view count asynchronously
      supabase
        .from('blog_posts')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id)
        .then();

      return NextResponse.json({ success: true, post: data });
    }

    // List query
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    // Non-admins only see published articles
    if (!includeDrafts || !isMasterAdmin(req)) {
      query = query.eq('status', 'published');
    }

    if (category && category !== 'All Stories' && category !== 'All Editorials') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[BlogsAPI] Supabase query error:', error.message);
      return NextResponse.json({ success: true, posts: [] });
    }

    return NextResponse.json({
      success: true,
      total: data?.length || 0,
      posts: data || [],
    });
  } catch (err: any) {
    console.error('[BlogsAPI] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/blogs - STRICTLY Master Super Admin Only
export async function POST(req: NextRequest) {
  try {
    if (!isMasterAdmin(req)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only the CricPlus Master Admin can publish blogs.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, subtitle, summary, content, cover_image_url, category, status, is_featured, author_name } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required fields.' },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const newPost = {
      title,
      subtitle: subtitle || null,
      slug: uniqueSlug,
      summary: summary || subtitle || title,
      content,
      cover_image_url: cover_image_url || '/images/cricplus-stadium-4k.jpg',
      category: category || 'Editorial',
      status: status || 'published',
      is_featured: Boolean(is_featured),
      author_name: author_name || 'CricPlus24 Chief Editor',
      published_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('blog_posts').insert(newPost).select().single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Article published successfully!',
      post: data,
    });
  } catch (err: any) {
    console.error('[BlogsAPI] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/blogs - Update existing blog (Master Admin only)
export async function PUT(req: NextRequest) {
  try {
    if (!isMasterAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, subtitle, summary, content, cover_image_url, category, status, is_featured } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Blog ID is required' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const updateFields: any = {
      ...(title && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(summary !== undefined && { summary }),
      ...(content && { content }),
      ...(cover_image_url && { cover_image_url }),
      ...(category && { category }),
      ...(status && { status }),
      ...(is_featured !== undefined && { is_featured: Boolean(is_featured) }),
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: 'Article updated successfully', post: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/blogs - Delete blog (Master Admin only)
export async function DELETE(req: NextRequest) {
  try {
    if (!isMasterAdmin(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Post ID is required' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
