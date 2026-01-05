import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const service_type = searchParams.get('service_type');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query with user details
        let query = supabaseAdmin
            .from('pan_services')
            .select(`
        *,
        user:users(id, name, email, phone)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (status && status !== 'ALL') {
            if (status.includes(',')) {
                const statuses = status.split(',');
                query = query.in('status', statuses);
            } else {
                query = query.eq('status', status);
            }
        }

        if (service_type && service_type !== 'ALL') {
            query = query.eq('service_type', service_type);
        }

        const { data: applications, error, count } = await query;

        if (error) {
            console.error('Error fetching PAN applications:', error);
            return NextResponse.json({ success: false, message: 'Failed to fetch PAN applications' }, { status: 500 });
        }

        // Get statistics for all applications
        const { data: allStats, error: statsError } = await supabaseAdmin
            .from('pan_services')
            .select('status, amount');

        if (statsError) {
            console.error('Error fetching stats:', statsError);
        }

        const stats = {
            total: count || 0,
            pending: 0,
            processing: 0,
            success: 0,
            failure: 0,
            total_amount: 0
        };

        if (allStats) {
            allStats.forEach((app: any) => {
                const s = app.status.toLowerCase();
                if (s in stats) {
                    stats[s as keyof typeof stats] = (stats[s as keyof typeof stats] as number) + 1;
                }
                stats.total_amount += parseFloat(app.amount || '0');
            });
        }

        return NextResponse.json({
            success: true,
            data: applications || [],
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (offset + limit) < (count || 0)
            },
            stats
        });

    } catch (error) {
        console.error('Error in Admin PAN applications API:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
