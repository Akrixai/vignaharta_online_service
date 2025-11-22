import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const applicationId = params.id;

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, schemes(*)')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify application belongs to current user
    if (application.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to reveal this cashback' },
        { status: 403 }
      );
    }

    // Verify user is a customer
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customers can reveal cashback' },
        { status: 403 }
      );
    }

    // Check if already revealed
    if (application.scratch_card_revealed) {
      return NextResponse.json(
        { error: 'Cashback already revealed' },
        { status: 400 }
      );
    }

    // Check if application is completed
    if (application.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Application must be completed to reveal cashback' },
        { status: 400 }
      );
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const cashbackAmount = application.cashback_amount || 0;

    // Start transaction: Update application and add cashback to wallet
    const { error: updateAppError } = await supabaseAdmin
      .from('applications')
      .update({
        scratch_card_revealed: true,
        cashback_claimed: true,
        cashback_claimed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateAppError) {
      console.error('Error updating application:', updateAppError);
      return NextResponse.json(
        { error: 'Failed to reveal cashback' },
        { status: 500 }
      );
    }

    // Add cashback to wallet
    const newBalance = parseFloat(wallet.balance) + cashbackAmount;
    const { error: walletUpdateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (walletUpdateError) {
      console.error('Error updating wallet:', walletUpdateError);
      return NextResponse.json(
        { error: 'Failed to credit cashback to wallet' },
        { status: 500 }
      );
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: session.user.id,
        wallet_id: wallet.id,
        type: 'COMMISSION', // Using COMMISSION type for cashback
        amount: cashbackAmount,
        status: 'COMPLETED',
        description: `Cashback earned from ${application.schemes?.name || 'service'} (${application.cashback_percentage}%)`,
        reference: `CASHBACK-${applicationId}`,
        metadata: {
          application_id: applicationId,
          cashback_percentage: application.cashback_percentage,
          service_name: application.schemes?.name,
        },
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Don't fail the request, cashback is already added
    }

    return NextResponse.json({
      success: true,
      message: 'Cashback revealed and credited to your wallet!',
      cashback: {
        amount: cashbackAmount,
        percentage: application.cashback_percentage,
        newBalance: newBalance,
      }
    });

  } catch (error) {
    console.error('Reveal cashback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
