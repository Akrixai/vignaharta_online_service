import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Add CORS headers for cross-origin requests
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// GET - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.EMPLOYEE)) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const serviceId = searchParams.get('service_id');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query conditions
    let query = supabase
      .from('direct_links_access_log')
      .select(`
        *,
        service:direct_links_services(name, category),
        user:users(name, email, role)
      `)
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString())
      .eq('status', 'COMPLETED');

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data: accessLogs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching access logs:', logsError);
      return addCorsHeaders(NextResponse.json({ 
        error: 'Failed to fetch analytics data' 
      }, { status: 500 }));
    }

    // Calculate analytics
    const totalRevenue = accessLogs?.reduce((sum, log) => sum + (log.amount_paid || 0), 0) || 0;
    const totalAccess = accessLogs?.length || 0;

    // Popular services
    const serviceStats = new Map();
    accessLogs?.forEach(log => {
      const serviceName = log.service?.name || 'Unknown Service';
      if (!serviceStats.has(serviceName)) {
        serviceStats.set(serviceName, {
          service_name: serviceName,
          access_count: 0,
          revenue: 0
        });
      }
      const stats = serviceStats.get(serviceName);
      stats.access_count += 1;
      stats.revenue += log.amount_paid || 0;
    });

    const popularServices = Array.from(serviceStats.values())
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 10);

    // Recent activity (last 10)
    const recentActivity = accessLogs?.slice(-10).reverse() || [];

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalAccess,
        popularServices,
        recentActivity
      }
    }));

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return addCorsHeaders(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }));
  }
}