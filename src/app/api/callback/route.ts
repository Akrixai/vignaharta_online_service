import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Unified Callback Endpoint for KWIKAPI v2
 * Handles callbacks for all recharge types: Prepaid, Postpaid, DTH, Electricity, etc.
 * 
 * KWIKAPI v2 Callback Format:
 * {
 *   "order_id": "TXN_123456",
 *   "status": "SUCCESS" | "FAILED" | "PENDING",
 *   "txid": "operator_transaction_id",
 *   "operator_txn_id": "operator_ref",
 *   "amount": "100.00",
 *   "number": "9999999999",
 *   "opid": "1",
 *   "message": "Transaction successful"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      transaction_id,
      txid,
      operator_txn_id,
      status,
      amount,
      service,
      number,
      mobile_number,
      dth_number,
      consumer_number,
      opid,
      message,
    } = body;

    console.log('KWIKAPI v2 Callback received:', body);

    // KWIKAPI v2 uses order_id (our transaction_ref)
    const transactionRef = order_id || transaction_id;

    if (!transactionRef) {
      console.error('No transaction reference in callback:', body);
      return NextResponse.json(
        { success: false, message: 'Missing order_id or transaction_id' },
        { status: 400 }
      );
    }

    // Find transaction by transaction reference (order_id)
    const { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('transaction_ref', transactionRef)
      .single();

    if (!transaction) {
      console.error('Transaction not found:', transactionRef);
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

    // Map KWIKAPI status to our status
    const statusMap: { [key: string]: string } = {
      'SUCCESS': 'SUCCESS',
      'FAILED': 'FAILED',
      'PENDING': 'PENDING',
      'REFUNDED': 'REFUNDED',
    };

    const newStatus = statusMap[status?.toUpperCase()] || 'PENDING';
    const previousStatus = transaction.status;

    // Update transaction status
    const operatorTxnId = txid || operator_txn_id;
    
    await supabase
      .from('recharge_transactions')
      .update({
        status: newStatus,
        operator_transaction_id: operatorTxnId,
        callback_received: true,
        callback_data: body,
        completed_at: newStatus !== 'PENDING' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
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
