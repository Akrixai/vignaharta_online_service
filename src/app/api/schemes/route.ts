import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// GET /api/schemes - Get all active schemes
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const state = searchParams.get('state');
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
    if (user?.role === 'CUSTOMER') {
      query = query.eq('show_to_customer', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // State-based filtering
    if (state && state !== 'ALL') {
      // Filter services that are available in the specified state or available nationwide (ALL)
      query = query.or(`available_states.cs.{${state}},available_states.cs.{ALL}`);
    }

    const { data: schemes, error, count } = await query;

    if (error) {
      console.error('Schemes fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch schemes' }, { status: 500 });
    }

    // For customers, use customer_price if available
    const processedSchemes = schemes?.map(scheme => {
      if (user?.role === 'CUSTOMER' && scheme.customer_price !== null) {
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
    console.error('Schemes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/schemes - Create new scheme (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      category, 
      documents, 
      is_free, 
      available_states,
      processing_time_days,
      commission_rate,
      dynamic_fields,
      required_documents,
      show_to_customer,
      customer_price,
      cashback_enabled,
      cashback_min_percentage,
      cashback_max_percentage
    } = body;

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Name, description, and price are required' },
        { status: 400 }
      );
    }

    // Ensure available_states is properly formatted
    const statesArray = available_states && Array.isArray(available_states) 
      ? available_states 
      : ['ALL'];

    const { data: scheme, error } = await supabaseAdmin
      .from('schemes')
      .insert({
        name,
        description,
        price: parseFloat(price),
        category,
        documents: documents || [],
        is_free: is_free || false,
        available_states: statesArray,
        processing_time_days: processing_time_days || 7,
        commission_rate: commission_rate || 0,
        dynamic_fields: dynamic_fields || [],
        required_documents: required_documents || [],
        show_to_customer: show_to_customer || false,
        customer_price: customer_price ? parseFloat(customer_price) : null,
        cashback_enabled: cashback_enabled || false,
        cashback_min_percentage: cashback_min_percentage || 0,
        cashback_max_percentage: cashback_max_percentage || 0,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Scheme creation error:', error);
      return NextResponse.json({ error: 'Failed to create scheme' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Scheme created successfully',
      data: scheme
    });

  } catch (error) {
    console.error('Schemes POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
