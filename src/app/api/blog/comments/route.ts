import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*, users(name, email)')
      .eq('post_id', postId)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, content, author_name, author_email, parent_comment_id } = body;

    if (!post_id || !content || !author_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    let user_id = null;

    if (authHeader) {
      const user = await verifyAuth(authHeader);
      user_id = user?.id;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id,
        user_id,
        author_name,
        author_email,
        content,
        parent_comment_id,
        status: 'PENDING' // Requires moderation
      })
      .select()
      .single();

    if (error) throw error;

    // Update comment count
    await supabase.rpc('increment_comment_count', { post_id });

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
