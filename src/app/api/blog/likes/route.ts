import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// POST - Like a post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    let user_id = null;
    let ip_address = null;

    if (authHeader) {
      const user = await verifyAuth(authHeader);
      user_id = user?.id;
    }

    // Get IP address
    ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    const supabase = createClient();
    
    // Check if already liked
    const { data: existing } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('post_id', post_id)
      .or(user_id ? `user_id.eq.${user_id}` : `ip_address.eq.${ip_address}`)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blog_likes')
      .insert({
        post_id,
        user_id,
        ip_address
      })
      .select()
      .single();

    if (error) throw error;

    // Update likes count
    const { data: post } = await supabase
      .from('blog_posts')
      .select('likes_count')
      .eq('id', post_id)
      .single();

    await supabase
      .from('blog_posts')
      .update({ likes_count: (post?.likes_count || 0) + 1 })
      .eq('id', post_id);

    return NextResponse.json({ like: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Unlike a post
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const post_id = searchParams.get('postId');

    if (!post_id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    let user_id = null;
    let ip_address = null;

    if (authHeader) {
      const user = await verifyAuth(authHeader);
      user_id = user?.id;
    }

    ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    const supabase = createClient();
    const { error } = await supabase
      .from('blog_likes')
      .delete()
      .eq('post_id', post_id)
      .or(user_id ? `user_id.eq.${user_id}` : `ip_address.eq.${ip_address}`);

    if (error) throw error;

    // Update likes count
    const { data: post } = await supabase
      .from('blog_posts')
      .select('likes_count')
      .eq('id', post_id)
      .single();

    await supabase
      .from('blog_posts')
      .update({ likes_count: Math.max((post?.likes_count || 1) - 1, 0) })
      .eq('id', post_id);

    return NextResponse.json({ message: 'Unliked successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
