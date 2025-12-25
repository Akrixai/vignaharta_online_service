import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Export analytics data as CSV
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const serviceId = searchParams.get('service_id');
    const format = searchParams.get('format') || 'csv';

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
      .order('accessed_at', { ascending: false });

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data: accessLogs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching access logs:', logsError);
      return NextResponse.json({ 
        error: 'Failed to fetch data for export' 
      }, { status: 500 });
    }

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Date',
        'Service Name',
        'Category',
        'User Name',
        'User Email',
        'User Role',
        'Amount Paid',
        'Status',
        'IP Address'
      ];

      const csvRows = accessLogs?.map(log => [
        new Date(log.accessed_at).toLocaleString(),
        log.service?.name || 'Unknown',
        log.service?.category || 'Unknown',
        log.user?.name || 'Unknown',
        log.user?.email || 'Unknown',
        log.user?.role || 'Unknown',
        log.amount_paid || 0,
        log.status,
        log.ip_address || 'Unknown'
      ]) || [];

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="direct-links-analytics-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({ 
      error: 'Unsupported export format' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}