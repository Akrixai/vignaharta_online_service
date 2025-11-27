import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/products/public - Get all active products (public access)
export async function GET(request: NextRequest) {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('show_to_customer', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: products || []
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
