import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/customer/cashback/claim - Claim cashback and credit to wallet
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

    // Get the application with scheme details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, schemes:scheme_id(name)')
      .eq('id', applicationId)
      .eq('user_id', session.user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if scratch card is revealed
    if (!application.scratch_card_revealed) {
      return NextResponse.json({ 
        error: 'Please reveal the scratch card first' 
      }, { status: 400 });
    }

    // Check if already claimed
    if (application.cashback_claimed) {
      return NextResponse.json({
        success: true,
        message: 'Cashback already claimed',
        cashbackAmount: application.cashback_amount
      });
    }

    // Check if there's cashback to claim
    if (!application.cashback_amount || parseFloat(application.cashback_amount) <= 0) {
      return NextResponse.json({ 
        error: 'No cashback available to claim' 
      }, { status: 400 });
    }

    // Get user's wallet
    const { data: wallets, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', session.user.id);

    if (walletError || !wallets || wallets.length === 0) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const wallet = wallets[0];

    // Credit cashback to wallet
    const cashbackAmount = parseFloat(application.cashback_amount);
    const newBalance = parseFloat(wallet.balance) + cashbackAmount;
    
    const { error: walletUpdateError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (walletUpdateError) {
      console.error('Wallet update error:', walletUpdateError);
      return NextResponse.json({ error: 'Failed to credit cashback' }, { status: 500 });
    }

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: session.user.id,
        wallet_id: wallet.id,
        type: 'DEPOSIT',
        amount: cashbackAmount,
        status: 'COMPLETED',
        description: `Cashback from ${application.schemes?.name || 'service application'}`,
        reference: `CASHBACK_${applicationId}`,
        metadata: {
          application_id: applicationId,
          cashback_percentage: application.cashback_percentage,
          type: 'customer_cashback'
        },
        processed_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
    }

    // Mark cashback as claimed
    const { error: claimError } = await supabaseAdmin
      .from('applications')
      .update({
        cashback_claimed: true,
        cashback_claimed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (claimError) {
      console.error('Claim update error:', claimError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cashback claimed successfully!',
      cashbackAmount,
      newWalletBalance: newBalance
    });

  } catch (error) {
    console.error('Claim cashback error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
