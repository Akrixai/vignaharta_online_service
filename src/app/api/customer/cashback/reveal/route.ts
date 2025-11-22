import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST - Reveal scratch card and assign cashback percentage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        user_id,
        amount,
        status,
        scratch_card_revealed,
        schemes (
          cashback_enabled,
          cashback_min_percentage,
          cashback_max_percentage
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Verify ownership
    if (application.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already revealed
    if (application.scratch_card_revealed) {
      return NextResponse.json({ error: 'Scratch card already revealed' }, { status: 400 });
    }

    // Check if application is approved
    if (application.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Application must be approved first' }, { status: 400 });
    }

    // Check if cashback is enabled for this service
    if (!application.schemes.cashback_enabled) {
      return NextResponse.json({ error: 'Cashback not enabled for this service' }, { status: 400 });
    }

    // Generate random cashback percentage between min and max
    const minPercentage = Number(application.schemes.cashback_min_percentage) || 1;
    const maxPercentage = Number(application.schemes.cashback_max_percentage) || 3;
    const cashbackPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
    const roundedPercentage = Math.round(cashbackPercentage * 100) / 100; // Round to 2 decimals

    // Calculate cashback amount
    const cashbackAmount = (Number(application.amount) * roundedPercentage) / 100;

    // Update application with cashback details
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        scratch_card_revealed: true,
        cashback_percentage: roundedPercentage,
        cashback_amount: cashbackAmount
      })
      .eq('id', applicationId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      cashbackPercentage: roundedPercentage,
      cashbackAmount
    });
  } catch (error: any) {
    console.error('Error revealing scratch card:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
