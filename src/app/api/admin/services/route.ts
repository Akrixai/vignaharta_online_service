import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { UserRole } from '@/types';

// GET /api/admin/services - Get all services for admin management
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: services, error } = await supabaseAdmin
      .from('schemes')
      .select(`
        id,
        name,
        description,
        price,
        is_free,
        is_active,
        category,
        documents,
        processing_time_days,
        commission_rate,
        dynamic_fields,
        required_documents,
        image_url,
        external_url,
        available_states,
        show_to_customer,
        customer_price,
        cashback_enabled,
        cashback_min_percentage,
        cashback_max_percentage,
        subscription_price,
        created_at,
        updated_at,
        created_by
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin services fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      services: services || []
    });

  } catch (error) {
    console.error('Admin services API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/services - Create new service
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== UserRole.ADMIN) {
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
      cashback_max_percentage,
      image_url,
      subscription_price
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

    const { data: service, error } = await supabaseAdmin
      .from('schemes')
      .insert({
        name,
        description,
        price: parseFloat(price) || 0,
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
        image_url: image_url || null,
        subscription_price: subscription_price ? parseFloat(subscription_price) : null,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Service creation error:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Admin services POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}