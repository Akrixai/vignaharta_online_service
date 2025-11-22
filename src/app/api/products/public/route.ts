import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('products')
      .select(`
        *,
        product_showcase(is_featured, display_order, views_count)
      `)
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('product_showcase.is_featured', true);
    }

    query = query.order('product_showcase.display_order', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ products: data || [] });
  } catch (error: any) {
    console.error('Get public products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Increment view count
    const { error } = await supabase.rpc('increment_product_view', {
      p_product_id: product_id
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track product view error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
