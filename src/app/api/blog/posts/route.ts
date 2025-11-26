import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - List all published blog posts (public) or all posts (admin/employee)
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');
    const slug = searchParams.get('slug');
    
    const offset = (page - 1) * limit;

    let query = supabase
      .from('blog_posts')
      .select('*, users!blog_posts_author_id_fkey(name, email)', { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    let isAdmin = false;
    
    if (session?.user) {
      isAdmin = session.user.role === 'ADMIN' || session.user.role === 'EMPLOYEE';
    }

    // Public users only see published posts
    if (!isAdmin) {
      query = query.eq('status', 'PUBLISHED');
    } else if (status) {
      query = query.eq('status', status);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (slug) {
      query = query.eq('slug', slug);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      posts: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new blog post (admin/employee only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    if (user.role !== 'ADMIN' && user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, slug, content, excerpt, featured_image_url, status, tags, meta_title, meta_description, is_featured } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    
    const postData: any = {
      title,
      slug,
      content,
      excerpt,
      featured_image_url,
      author_id: user.id,
      status: status || 'DRAFT',
      tags: tags || [],
      meta_title,
      meta_description,
      is_featured: is_featured || false
    };

    if (status === 'PUBLISHED') {
      postData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
