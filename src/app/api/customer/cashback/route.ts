import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/customer/cashback - Get customer's cashback applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all applications with cashback
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        schemes:scheme_id (
          name,
          cashback_enabled,
          customer_cashback_percentage
        )
      `)
      .eq('user_id', session.user.id)
      .gt('cashback_amount', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cashback applications:', error);
      return NextResponse.json({ error: 'Failed to fetch cashback data' }, { status: 500 });
    }

    // Calculate stats
    const totalCashback = applications?.reduce((sum, app) => sum + parseFloat(app.cashback_amount || 0), 0) || 0;
    const claimedCashback = applications?.filter(app => app.cashback_claimed)
      .reduce((sum, app) => sum + parseFloat(app.cashback_amount || 0), 0) || 0;
    const pendingCashback = totalCashback - claimedCashback;

    return NextResponse.json({
      success: true,
      applications: applications || [],
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
