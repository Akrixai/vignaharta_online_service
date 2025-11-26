import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ 
        error: 'Product ID is required' 
      }, { status: 400 });
    }

    // Fetch product details
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        category,
        is_active,
        stock_quantity,
        features,
        created_at,
        created_by_user:users!products_created_by_fkey(name)
      `)
      .eq('id', productId)
      .eq('is_active', true) // Only show active products
      .single();

    if (error || !product) {
      return NextResponse.json({ 
        success: false,
        error: 'Product not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
