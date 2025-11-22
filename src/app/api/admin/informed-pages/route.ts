import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all informed pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    let query = supabase
      .from('informed_pages')
      .select('*')
      .order('display_order', { ascending: true });

    if (isPublic) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ pages: data });
  } catch (error: any) {
    console.error('Error fetching informed pages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new informed page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slug, title, content, excerpt, featured_image_url, meta_title, meta_description, display_order } = body;

    if (!slug || !title || !content) {
      return NextResponse.json({ error: 'Slug, title, and content are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('informed_pages')
      .insert({
        slug,
        title,
        content,
        excerpt,
        featured_image_url,
        meta_title,
        meta_description,
        display_order: display_order || 0,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ page: data, success: true });
  } catch (error: any) {
    console.error('Error creating informed page:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
