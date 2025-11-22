import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST - Claim cashback and add to wallet
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
      .select('id, user_id, cashback_amount, cashback_claimed, scratch_card_revealed')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Verify ownership
    if (application.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if scratch card is revealed
    if (!application.scratch_card_revealed) {
      return NextResponse.json({ error: 'Scratch card must be revealed first' }, { status: 400 });
    }

    // Check if already claimed
    if (application.cashback_claimed) {
      return NextResponse.json({ error: 'Cashback already claimed' }, { status: 400 });
    }

    const cashbackAmount = Number(application.cashback_amount);

    if (cashbackAmount <= 0) {
      return NextResponse.json({ error: 'Invalid cashback amount' }, { status: 400 });
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (walletError) throw walletError;

    // Update wallet balance
    const newBalance = Number(wallet.balance) + cashbackAmount;
    const { error: updateWalletError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateWalletError) throw updateWalletError;

    // Create transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'COMMISSION', // Using COMMISSION type for cashback
        amount: cashbackAmount,
        status: 'COMPLETED',
        description: `Cashback claimed from application`,
        reference: applicationId
      });

    if (transactionError) throw transactionError;

    // Mark cashback as claimed
    const { error: updateAppError } = await supabaseAdmin
      .from('applications')
      .update({
        cashback_claimed: true,
        cashback_claimed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateAppError) throw updateAppError;

    return NextResponse.json({
      success: true,
      cashbackAmount,
      newBalance
    });
  } catch (error: any) {
    console.error('Error claiming cashback:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
