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

// GET - Get access logs
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.EMPLOYEE)) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const serviceId = searchParams.get('service_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = supabase
      .from('direct_links_access_log')
      .select(`
        *,
        service:direct_links_services(name, category),
        user:users(name, email, role)
      `)
      .gte('accessed_at', startDate.toISOString())
      .lte('accessed_at', endDate.toISOString())
      .order('accessed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data: accessLogs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching access logs:', logsError);
      return addCorsHeaders(NextResponse.json({ 
        error: 'Failed to fetch access logs' 
      }, { status: 500 }));
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: accessLogs || []
    }));

  } catch (error: any) {
    console.error('Error fetching access logs:', error);
    return addCorsHeaders(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }));
  }
}