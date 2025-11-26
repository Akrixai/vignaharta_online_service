import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/customer/cashback/reveal - Reveal scratch card
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    // Get the application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', session.user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if already revealed
    if (application.scratch_card_revealed) {
      return NextResponse.json({
        success: true,
        message: 'Already revealed',
        cashbackPercentage: application.cashback_percentage,
        cashbackAmount: application.cashback_amount
      });
    }

    // Check if application is approved
    if (application.status !== 'APPROVED' && application.status !== 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Application must be approved before revealing cashback' 
      }, { status: 400 });
    }

    // Mark as revealed
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        scratch_card_revealed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reveal scratch card' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Scratch card revealed!',
      cashbackPercentage: application.cashback_percentage,
      cashbackAmount: application.cashback_amount
    });

  } catch (error) {
    console.error('Reveal scratch card error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
