import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get employee referrals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    // Check if user can view referrals
    if (user.role !== 'ADMIN' && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get referrals where user is the referrer
    const { data: referrals, error } = await supabaseAdmin
      .from('employee_referrals')
      .select(`
        *,
        referrer:referrer_id(id, name, email, role, designation),
        referred:referred_employee_id(id, name, email, role, designation)
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get referral stats
    const { data: stats } = await supabaseAdmin
      .from('employee_referrals')
      .select('referrer_reward_amount, referrer_reward_paid')
      .eq('referrer_id', userId);

    const totalReferrals = stats?.length || 0;
    const totalEarned = stats?.reduce((sum, r) => sum + (parseFloat(r.referrer_reward_amount?.toString() || '0')), 0) || 0;
    const totalPaid = stats?.filter(r => r.referrer_reward_paid).reduce((sum, r) => sum + (parseFloat(r.referrer_reward_amount?.toString() || '0')), 0) || 0;
    const pendingPayout = totalEarned - totalPaid;

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        stats: {
          totalReferrals,
          totalEarned,
          totalPaid,
          pendingPayout
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// POST - Process referral reward
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { referralId, action } = body;

    if (action === 'pay_reward') {
      // Mark reward as paid
      const { data: referral, error: updateError } = await supabaseAdmin
        .from('employee_referrals')
        .update({
          referrer_reward_paid: true,
          referrer_reward_paid_at: new Date().toISOString()
        })
        .eq('id', referralId)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        data: referral
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing referral:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
