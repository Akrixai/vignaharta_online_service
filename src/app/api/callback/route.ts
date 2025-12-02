import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Unified Callback Endpoint for KWIKAPI
 * Handles callbacks for all recharge types: Prepaid, Postpaid, DTH, Electricity, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transaction_id,
      operator_txn_id,
      status,
      amount,
      service,
      mobile_number,
      dth_number,
      consumer_number,
    } = body;

    console.log('KWIKAPI Callback received:', body);

    // Find transaction by KWIKAPI transaction ID or transaction reference
    const { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .or(`kwikapi_transaction_id.eq.${transaction_id},transaction_ref.eq.${transaction_id}`)
      .single();

    if (!transaction) {
      console.error('Transaction not found:', transaction_id);
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Get user wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (!wallet) {
      console.error('Wallet not found for user:', transaction.user_id);
      return NextResponse.json(
        { success: false, message: 'Wallet not found' },
        { status: 404 }
      );
    }

    const newStatus = status.toUpperCase();
    const previousStatus = transaction.status;

    // Update transaction status
    await supabase
      .from('recharge_transactions')
      .update({
        status: newStatus,
        operator_transaction_id: operator_txn_id,
        callback_received: true,
        callback_data: body,
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // Handle status changes
    if (newStatus === 'SUCCESS' && previousStatus !== 'SUCCESS') {
      // Transaction succeeded - credit commission/cashback if not already done
      if (transaction.commission_amount > 0) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + transaction.commission_amount })
          .eq('user_id', transaction.user_id);

        // Record commission/cashback transaction
        const rewardLabel = transaction.user.role === 'CUSTOMER' ? 'Cashback' : 'Commission';
        const transactionType = transaction.user.role === 'CUSTOMER' ? 'REFUND' : 'COMMISSION';

        await supabase.from('transactions').insert({
          user_id: transaction.user_id,
          wallet_id: wallet.id,
          type: transactionType,
          amount: transaction.commission_amount,
          status: 'COMPLETED',
          description: `${rewardLabel} for ${transaction.service_type} ${transaction.mobile_number || transaction.dth_number || transaction.consumer_number}`,
          reference: transaction.transaction_ref,
        });

        console.log(`${rewardLabel} credited: ₹${transaction.commission_amount} to user ${transaction.user_id}`);
      }
    } else if (newStatus === 'FAILED' && previousStatus !== 'FAILED') {
      // Transaction failed - issue refund if not already done
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + transaction.total_amount })
        .eq('user_id', transaction.user_id);

      // Record refund transaction
      await supabase.from('transactions').insert({
        user_id: transaction.user_id,
        wallet_id: wallet.id,
        type: 'REFUND',
        amount: transaction.total_amount,
        status: 'COMPLETED',
        description: `Refund for failed ${transaction.service_type} ${transaction.mobile_number || transaction.dth_number || transaction.consumer_number}`,
        reference: transaction.transaction_ref,
      });

      console.log(`Refund processed: ₹${transaction.total_amount} to user ${transaction.user_id}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Callback processed successfully',
      transaction_id: transaction.id,
      status: newStatus,
    });
  } catch (error: any) {
    console.error('Callback API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'KWIKAPI Callback Endpoint',
    endpoint: '/api/callback',
    methods: ['POST'],
    description: 'Unified callback handler for all KWIKAPI recharge services',
  });
}
