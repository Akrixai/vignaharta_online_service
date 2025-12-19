import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access (RETAILER or ADMIN)
    if (user.role !== 'RETAILER' && user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const service_type = searchParams.get('service_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('pan_services')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If not admin, filter by user_id
    if (user.role !== 'ADMIN') {
      query = query.eq('user_id', user.id);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (service_type) {
      query = query.eq('service_type', service_type);
    }

    const { data: services, error } = await query;

    if (error) {
      console.error('Error fetching PAN services history:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch PAN services history' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('pan_services')
      .select('*', { count: 'exact', head: true });

    if (user.role !== 'ADMIN') {
      countQuery = countQuery.eq('user_id', user.id);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (service_type) {
      countQuery = countQuery.eq('service_type', service_type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting PAN services:', countError);
    }

    // Calculate statistics
    const stats = {
      total: count || 0,
      pending: 0,
      processing: 0,
      success: 0,
      failure: 0,
      total_amount: 0,
      total_commission: 0
    };

    if (services) {
      services.forEach((service: any) => {
        stats[service.status.toLowerCase() as keyof typeof stats] =
          (stats[service.status.toLowerCase() as keyof typeof stats] as number) + 1;
        stats.total_amount += parseFloat(service.amount || '0');
        stats.total_commission += parseFloat(service.commission_amount || '0');
      });
    }

    return NextResponse.json({
      success: true,
      data: services || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      },
      stats
    });

  } catch (error) {
    console.error('Error in PAN services history API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}