import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access (RETAILER, CUSTOMER, or ADMIN)
    if (!['RETAILER', 'CUSTOMER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('type');

    if (!serviceType) {
      return NextResponse.json({ success: false, message: 'Service type is required' }, { status: 400 });
    }

    if (!['NEW_PAN', 'PAN_CORRECTION', 'INCOMPLETE_PAN'].includes(serviceType)) {
      return NextResponse.json({ success: false, message: 'Invalid service type' }, { status: 400 });
    }

    // Get configuration for the service type
    const { data: config, error: configError } = await supabaseAdmin
      .from('pan_commission_config')
      .select('*')
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('Config fetch error:', configError);
      return NextResponse.json({ 
        success: false, 
        message: `Configuration not found for ${serviceType}` 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        service_type: config.service_type,
        price: config.price,
        is_active: config.is_active,
        created_at: config.created_at,
        updated_at: config.updated_at
      }
    });

  } catch (error) {
    console.error('Error in PAN services config API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}