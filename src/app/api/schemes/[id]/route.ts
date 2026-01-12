import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

// GET /api/schemes/[id] - Get scheme details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.RETAILER && session.user.role !== UserRole.CUSTOMER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const schemeId = resolvedParams.id;

    const { data: scheme, error } = await supabaseAdmin
      .from('schemes')
      .select(`
        id,
        name,
        description,
        price,
        category,
        is_free,
        is_active,
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
        created_at,
        updated_at
      `)
      .eq('id', schemeId)
      .eq('is_active', true)
      .single();

    if (error || !scheme) {
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    // For customers, use customer_price if available
    if (session.user.role === UserRole.CUSTOMER && scheme.customer_price !== null) {
      scheme.price = scheme.customer_price;
      scheme.original_price = scheme.price;
    }

    return NextResponse.json({
      success: true,
      scheme
    });

  } catch (error) {
    console.error('Scheme details API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/schemes/[id] - Update scheme (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const schemeId = resolvedParams.id;
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

    // Ensure available_states is properly formatted
    const statesArray = available_states && Array.isArray(available_states) 
      ? available_states 
      : ['ALL'];

    const { data: scheme, error } = await supabaseAdmin
      .from('schemes')
      .update({
        name,
        description,
        price: price ? parseFloat(price) : undefined,
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
        updated_at: new Date().toISOString()
      })
      .eq('id', schemeId)
      .select()
      .single();

    if (error) {
      console.error('Scheme update error:', error);
      return NextResponse.json({ error: 'Failed to update scheme' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Scheme updated successfully',
      data: scheme
    });

  } catch (error) {
    console.error('Scheme PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
