import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/applications/[id]/scratch - Reveal scratch card and credit cashback
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = params.id;

    // Get the application
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, schemes(*)')
      .eq('id', applicationId)
      .eq('user_id', session.user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if already scratched
    if (application.scratch_card_revealed) {
      return NextResponse.json({
        success: true,
        message: 'Cashback already revealed',
        data: {
          cashback_percentage: application.cashback_percentage,
          cashback_amount: application.cashback_amount,
          already_claimed: application.cashback_claimed
        }
      });
    }

    // Check if application is approved
    if (application.status !== 'APPROVED' && application.status !== 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Application must be approved before revealing cashback' 
      }, { status: 400 });
    }

    // Mark scratch card as revealed
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

    // If cashback amount exists and not yet claimed, credit it to wallet
    if (application.cashback_amount > 0 && !application.cashback_claimed) {
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      // Credit cashback to wallet
      const newBalance = parseFloat(wallet.balance) + parseFloat(application.cashback_amount);
      
      const { error: walletUpdateError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (walletUpdateError) {
        return NextResponse.json({ error: 'Failed to credit cashback' }, { status: 500 });
      }

      // Create transaction record
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: session.user.id,
          wallet_id: wallet.id,
          type: 'DEPOSIT',
          amount: application.cashback_amount,
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
        console.error('Failed to create transaction:', transactionError);
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
        console.error('Failed to mark cashback as claimed:', claimError);
      }

      return NextResponse.json({
        success: true,
        message: 'Cashback revealed and credited to your wallet!',
        data: {
          cashback_percentage: application.cashback_percentage,
          cashback_amount: application.cashback_amount,
          new_wallet_balance: newBalance,
          credited: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Scratch card revealed',
      data: {
        cashback_percentage: application.cashback_percentage || 0,
        cashback_amount: application.cashback_amount || 0,
        credited: false
      }
    });

  } catch (error) {
    console.error('Scratch card error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
