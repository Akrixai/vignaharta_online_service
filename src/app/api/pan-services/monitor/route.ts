import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const lastUpdate = searchParams.get('last_update');

    // If specific order monitoring
    if (orderId) {
      const { data: panService, error } = await supabaseAdmin
        .from('pan_services')
        .select('*')
        .eq('order_id', orderId)
        .eq('user_id', user.id) // Security: only user's own orders
        .single();

      if (error || !panService) {
        return NextResponse.json({
          success: false,
          message: 'PAN service not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          order_id: panService.order_id,
          status: panService.status,
          payment_status: panService.payment_status,
          acknowledgement_number: panService.acknowledgement_number,
          callback_data: panService.callback_data,
          webhook_received_at: panService.webhook_received_at,
          updated_at: panService.updated_at,
          has_updates: lastUpdate ? new Date(panService.updated_at) > new Date(lastUpdate) : true
        }
      });
    }

    // Monitor all active applications for the user
    let query = supabaseAdmin
      .from('pan_services')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'PROCESSING'])
      .order('created_at', { ascending: false });

    // If lastUpdate provided, only return records updated after that time
    if (lastUpdate) {
      query = query.gt('updated_at', lastUpdate);
    }

    const { data: services, error: servicesError } = await query;

    if (servicesError) {
      console.error('Error fetching services for monitoring:', servicesError);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch services'
      }, { status: 500 });
    }

    // Get summary statistics
    const { data: allServices } = await supabaseAdmin
      .from('pan_services')
      .select('status, payment_status, amount')
      .eq('user_id', user.id);

    const stats = {
      total: allServices?.length || 0,
      pending: allServices?.filter(s => s.status === 'PENDING').length || 0,
      processing: allServices?.filter(s => s.status === 'PROCESSING').length || 0,
      success: allServices?.filter(s => s.status === 'SUCCESS').length || 0,
      failure: allServices?.filter(s => s.status === 'FAILURE').length || 0,
      active_monitoring: services?.length || 0,
      total_spent: allServices?.filter(s => s.status === 'SUCCESS').reduce((sum, s) => sum + (s.amount || 0), 0) || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        active_services: services || [],
        stats,
        has_updates: (services?.length || 0) > 0,
        last_check: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in monitoring API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_ids } = body;

    if (!order_ids || !Array.isArray(order_ids)) {
      return NextResponse.json({
        success: false,
        message: 'order_ids array is required'
      }, { status: 400 });
    }

    // Get status for multiple orders
    const { data: services, error } = await supabaseAdmin
      .from('pan_services')
      .select('order_id, status, payment_status, acknowledgement_number, callback_data, webhook_received_at, updated_at')
      .eq('user_id', user.id)
      .in('order_id', order_ids);

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch services'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: services || []
    });

  } catch (error) {
    console.error('Error in monitoring POST API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}