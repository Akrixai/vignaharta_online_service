import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { UserRole } from '@/types';

// PUT /api/admin/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const serviceId = resolvedParams.id;

    // Add console logging for debugging dropdown options
    console.log('Updating service:', serviceId, 'with data:', body);

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
      is_active
    } = body;

    // Ensure available_states is properly formatted
    const statesArray = available_states && Array.isArray(available_states) 
      ? available_states 
      : ['ALL'];

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (category !== undefined) updateData.category = category;
    if (documents !== undefined) updateData.documents = documents || [];
    if (is_free !== undefined) updateData.is_free = is_free || false;
    if (available_states !== undefined) updateData.available_states = statesArray;
    if (processing_time_days !== undefined) updateData.processing_time_days = processing_time_days || 7;
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate || 0;
    if (dynamic_fields !== undefined) updateData.dynamic_fields = dynamic_fields || [];
    if (required_documents !== undefined) updateData.required_documents = required_documents || [];
    if (show_to_customer !== undefined) updateData.show_to_customer = show_to_customer || false;
    if (customer_price !== undefined) updateData.customer_price = customer_price ? parseFloat(customer_price) : null;
    if (cashback_enabled !== undefined) updateData.cashback_enabled = cashback_enabled || false;
    if (cashback_min_percentage !== undefined) updateData.cashback_min_percentage = cashback_min_percentage || 0;
    if (cashback_max_percentage !== undefined) updateData.cashback_max_percentage = cashback_max_percentage || 0;
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: service, error } = await supabaseAdmin
      .from('schemes')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('Service update error:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Admin service PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/services/[id] - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const serviceId = resolvedParams.id;

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('schemes')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (error) {
      console.error('Service delete error:', error);
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Admin service DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}