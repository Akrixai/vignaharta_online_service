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

    // Handle status changes (Deduct only on success, Delete on failure)
    if (newStatus === 'SUCCESS' && previousStatus !== 'SUCCESS') {
      console.log('💰 [Callback] Processing SUCCESS settlement for transaction:', transaction.id);
      await processTransactionSuccess(transaction);
    } else if (newStatus === 'FAILED') {
      console.log('🗑️ [Callback] Deleting failed transaction from history:', transaction.id);
      await supabase
        .from('recharge_transactions')
        .delete()
        .eq('id', transaction.id);
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

// Process successful transaction: Deduct money AND give rewards
async function processTransactionSuccess(transaction: any) {
  try {
    const user = transaction.user;
    if (!user) return;

    // 1. Get current wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (!wallet) return;

    // 2. Get operator configuration for reward calculation
    const { data: rechargeOperator } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('id', transaction.operator_id)
      .single();

    const amountToDeduct = transaction.amount;
    let rewardAmount = 0;
    let rewardType = '';
    let rewardDescription = '';

    // 3. Calculate reward if not already set
    if (user.role === 'CUSTOMER') {
      if (rechargeOperator?.cashback_enabled && !transaction.cashback_claimed) {
        if (!transaction.cashback_amount || transaction.cashback_amount === 0) {
          const minPercentage = rechargeOperator.cashback_min_percentage || 0.5;
          const maxPercentage = rechargeOperator.cashback_max_percentage || 2.0;
          const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
          rewardAmount = (transaction.amount * randomPercentage) / 100;

          await supabase
            .from('recharge_transactions')
            .update({
              cashback_percentage: randomPercentage,
              cashback_amount: rewardAmount,
            })
            .eq('id', transaction.id);
        } else {
          rewardAmount = transaction.cashback_amount;
        }
        rewardType = 'REFUND';
        rewardDescription = `Cashback for ${transaction.service_type} recharge`;
      }
    } else {
      if (!transaction.commission_paid) {
        if (!transaction.commission_amount || transaction.commission_amount === 0) {
          const commissionRate = rechargeOperator?.commission_rate || 2.0;
          rewardAmount = (transaction.amount * commissionRate) / 100;

          await supabase
            .from('recharge_transactions')
            .update({ commission_amount: rewardAmount })
            .eq('id', transaction.id);
        } else {
          rewardAmount = transaction.commission_amount;
        }
        rewardType = 'COMMISSION';
        rewardDescription = `Commission for ${transaction.service_type} recharge`;
      }
    }

    // 4. Update wallet atomically: Deduct amount AND Add reward
    const finalBalanceChange = -amountToDeduct + rewardAmount;

    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + finalBalanceChange })
      .eq('user_id', transaction.user_id);

    // 5. Record transactions in ledger
    // Record Withdrawal
    await supabase.from('transactions').insert({
      user_id: transaction.user_id,
      wallet_id: wallet.id,
      type: 'WITHDRAWAL',
      amount: amountToDeduct,
      status: 'COMPLETED',
      description: `${transaction.service_type} Recharge ${transaction.mobile_number || transaction.dth_number || transaction.consumer_number}`,
      reference: transaction.transaction_ref,
      metadata: { recharge_transaction_id: transaction.id },
    });

    // Record Reward if any
    if (rewardAmount > 0) {
      await supabase.from('transactions').insert({
        user_id: transaction.user_id,
        wallet_id: wallet.id,
        type: rewardType,
        amount: rewardAmount,
        status: 'COMPLETED',
        description: rewardDescription,
        reference: transaction.transaction_ref,
        metadata: { recharge_transaction_id: transaction.id },
      });

      // Mark reward as paid/claimed
      await supabase
        .from('recharge_transactions')
        .update({
          [user.role === 'CUSTOMER' ? 'cashback_claimed' : 'commission_paid']: true,
          [user.role === 'CUSTOMER' ? 'cashback_claimed_at' : 'commission_paid_at']: new Date().toISOString(),
        })
        .eq('id', transaction.id);
    }

    console.log(`✅ [Callback] Settlement completed for ${transaction.id}`);
  } catch (error) {
    console.error('❌ [Callback] Success settlement error:', error);
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
