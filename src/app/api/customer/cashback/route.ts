import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch customer cashback applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    // Get all applications with cashback for this customer
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        scheme_id,
        customer_name,
        amount,
        cashback_percentage,
        cashback_amount,
        cashback_claimed,
        cashback_claimed_at,
        scratch_card_revealed,
        status,
        created_at,
        schemes (
          name,
          cashback_enabled
        )
      `)
      .eq('user_id', user.id)
      .eq('schemes.cashback_enabled', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate stats
    const totalCashback = applications?.reduce((sum, app) => sum + (Number(app.cashback_amount) || 0), 0) || 0;
    const claimedCashback = applications?.filter(app => app.cashback_claimed)
      .reduce((sum, app) => sum + (Number(app.cashback_amount) || 0), 0) || 0;
    const pendingCashback = applications?.filter(app => app.scratch_card_revealed && !app.cashback_claimed)
      .reduce((sum, app) => sum + (Number(app.cashback_amount) || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      applications: applications || [],
      stats: {
        totalCashback,
        claimedCashback,
        pendingCashback
      }
    });
  } catch (error: any) {
    console.error('Error fetching cashback:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
