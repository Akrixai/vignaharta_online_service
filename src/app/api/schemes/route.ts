import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/schemes - Get all active schemes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter by customer visibility if user is a customer
    if (session?.user?.role === 'CUSTOMER') {
      query = query.eq('show_to_customer', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: schemes, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch schemes' }, { status: 500 });
    }

    // For customers, use customer_price if available
    const processedSchemes = schemes?.map(scheme => {
      if (session?.user?.role === 'CUSTOMER' && scheme.customer_price !== null) {
        return {
          ...scheme,
          price: scheme.customer_price,
          original_price: scheme.price
        };
      }
      return scheme;
    });

    return NextResponse.json({
      success: true,
      data: processedSchemes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/schemes - Create new scheme (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, category, documents, is_free } = body;

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and price are required' },
        { status: 400 }
      );
    }

    const { data: scheme, error } = await supabaseAdmin
      .from('schemes')
      .insert({
        name,
        description,
        price: parseFloat(price),
        category,
        documents: documents || [],
        is_free: is_free || false
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create scheme' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Scheme created successfully',
      data: scheme
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
