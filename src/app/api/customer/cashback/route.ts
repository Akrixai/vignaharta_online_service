import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/customer/cashback - Get customer's cashback applications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all applications (filter for cashback-enabled schemes)
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        schemes:scheme_id (
          name,
          cashback_enabled,
          cashback_min_percentage,
          cashback_max_percentage
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });
    
    // Filter for cashback-enabled schemes only
    const cashbackApplications = applications?.filter((app: any) => 
      app.schemes?.cashback_enabled === true && 
      app.cashback_amount > 0
    ) || [];

    if (error) {
      console.error('Error fetching cashback applications:', error);
      return NextResponse.json({ error: 'Failed to fetch cashback data' }, { status: 500 });
    }

    // Calculate stats
    const totalCashback = cashbackApplications.reduce((sum: number, app: any) => sum + parseFloat(app.cashback_amount || 0), 0);
    const claimedCashback = cashbackApplications.filter((app: any) => app.cashback_claimed)
      .reduce((sum: number, app: any) => sum + parseFloat(app.cashback_amount || 0), 0);
    const pendingCashback = totalCashback - claimedCashback;

    return NextResponse.json({
      success: true,
      applications: cashbackApplications,
      stats: {
        totalCashback,
        claimedCashback,
        pendingCashback
      }
    });

  } catch (error) {
    console.error('Cashback API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
