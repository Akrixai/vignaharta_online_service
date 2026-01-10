import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all service commission configurations
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: configs, error } = await supabase
      .from('service_commission_config')
      .select('*')
      .order('service_display_name');

    if (error) {
      console.error('Error fetching service commission configs:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: configs || []
    });

  } catch (error: any) {
    console.error('Service commission config GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new service commission configuration
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      service_type,
      service_display_name,
      retailer_commission_amount,
      retailer_commission_enabled,
      customer_cashback_amount,
      customer_cashback_enabled,
      min_transaction_amount,
      max_transaction_amount,
      description
    } = body;

    // Validation
    if (!service_type || !service_display_name) {
      return NextResponse.json(
        { success: false, message: 'Service type and display name are required' },
        { status: 400 }
      );
    }

    if (retailer_commission_amount < 0 || customer_cashback_amount < 0) {
      return NextResponse.json(
        { success: false, message: 'Commission and cashback amounts cannot be negative' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('service_commission_config')
      .insert({
        service_type,
        service_display_name,
        retailer_commission_amount: parseFloat(retailer_commission_amount) || 0,
        retailer_commission_enabled: retailer_commission_enabled !== false,
        customer_cashback_amount: parseFloat(customer_cashback_amount) || 0,
        customer_cashback_enabled: customer_cashback_enabled !== false,
        min_transaction_amount: parseFloat(min_transaction_amount) || 1,
        max_transaction_amount: parseFloat(max_transaction_amount) || 50000,
        description: description || '',
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service commission config:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, message: 'Service type already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Failed to create configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service commission configuration created successfully',
      data
    });

  } catch (error: any) {
    console.error('Service commission config POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update service commission configuration
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      service_display_name,
      retailer_commission_amount,
      retailer_commission_enabled,
      customer_cashback_amount,
      customer_cashback_enabled,
      min_transaction_amount,
      max_transaction_amount,
      description,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    if (retailer_commission_amount < 0 || customer_cashback_amount < 0) {
      return NextResponse.json(
        { success: false, message: 'Commission and cashback amounts cannot be negative' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('service_commission_config')
      .update({
        service_display_name,
        retailer_commission_amount: parseFloat(retailer_commission_amount) || 0,
        retailer_commission_enabled: retailer_commission_enabled !== false,
        customer_cashback_amount: parseFloat(customer_cashback_amount) || 0,
        customer_cashback_enabled: customer_cashback_enabled !== false,
        min_transaction_amount: parseFloat(min_transaction_amount) || 1,
        max_transaction_amount: parseFloat(max_transaction_amount) || 50000,
        description: description || '',
        is_active: is_active !== false,
        updated_by: user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service commission config:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service commission configuration updated successfully',
      data
    });

  } catch (error: any) {
    console.error('Service commission config PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete service commission configuration
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('service_commission_config')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service commission config:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service commission configuration deleted successfully'
    });

  } catch (error: any) {
    console.error('Service commission config DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}