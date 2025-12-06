import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// POST - Track share
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, platform } = body;

    if (!post_id || !platform) {
      return NextResponse.json({ error: 'Post ID and platform required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    let user_id = null;

    if (authHeader) {
      const user = await verifyAuth(authHeader);
      user_id = user?.id;
    }

    const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from('blog_shares')
      .insert({
        post_id,
        platform,
        user_id,
        ip_address
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ share: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
