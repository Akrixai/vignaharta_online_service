import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access (only for specific retailer)
    if (session.user.email !== 'AkrixRetailerTest@gmail.com') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('type');

    if (!serviceType) {
      return NextResponse.json({ success: false, message: 'Service type is required' }, { status: 400 });
    }

    // Validate service type
    const validTypes = ['NEW_PAN', 'PAN_CORRECTION', 'INCOMPLETE_PAN'];
    if (!validTypes.includes(serviceType)) {
      return NextResponse.json({ success: false, message: 'Invalid service type' }, { status: 400 });
    }

    // Get configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('pan_commission_config')
      .select('*')
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('Config error:', configError);
      return NextResponse.json({ success: false, message: 'Service configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        service_type: config.service_type,
        price: parseFloat(config.price),
        commission_rate: parseFloat(config.commission_rate)
      }
    });

  } catch (error) {
    console.error('Error in PAN config API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}