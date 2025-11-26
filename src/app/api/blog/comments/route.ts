import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postSlug = searchParams.get('post_slug');
    const postId = searchParams.get('postId');

    if (!postSlug && !postId) {
      return NextResponse.json({ error: 'Post slug or ID required' }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    
    let query = supabase
      .from('blog_comments')
      .select('*, users!blog_comments_user_id_fkey(name, email)')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });

    if (postId) {
      query = query.eq('post_id', postId);
    } else if (postSlug) {
      // Get post ID from slug first
      const { data: post } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', postSlug)
        .single();
      
      if (post) {
        query = query.eq('post_id', post.id);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add comment (auto-approved for logged-in users)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { post_slug, content, parent_comment_id } = body;

    if (!post_slug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    
    // Get post ID from slug
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', post_slug)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: post.id,
        user_id: session.user.id,
        author_name: session.user.name,
        author_email: session.user.email,
        content,
        parent_comment_id,
        status: 'APPROVED' // Auto-approve for logged-in users
      })
      .select('*, users!blog_comments_user_id_fkey(name, email)')
      .single();

    if (error) throw error;

    // Update comment count
    await supabase
      .from('blog_posts')
      .update({ 
        comments_count: supabase.raw('comments_count + 1')
      })
      .eq('id', post.id);

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
