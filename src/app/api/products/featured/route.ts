import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get distinct categories
    const { data: categories, error: catError } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .eq('show_to_customer', true)
      .not('category', 'is', null);

    if (catError) throw catError;

    // Get unique categories
    const uniqueCategories = [...new Set(categories?.map(p => p.category))];

    // Fetch one product from each category
    const featuredProducts = await Promise.all(
      uniqueCategories.map(async (category) => {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, customer_price, image_url, category')
          .eq('is_active', true)
          .eq('show_to_customer', true)
          .eq('category', category)
          .limit(1)
          .single();

        if (error) return null;
        return data;
      })
    );

    // Filter out nulls
    const validProducts = featuredProducts.filter(p => p !== null);

    return NextResponse.json({
      success: true,
      products: validProducts
    });
  } catch (error: any) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
