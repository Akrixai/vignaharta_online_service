import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple GET handler for KwikAPI validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const allParams = Object.fromEntries(searchParams.entries());

    console.log('🔔 [KwikAPI] GET Callback:', {
      url: request.url,
      params: allParams,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });

    // If no parameters, return simple validation response
    if (Object.keys(allParams).length === 0) {
      // Return plain text "OK" for KwikAPI validation
      return new NextResponse('OK', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // Process webhook if parameters are present
    return await processKwikAPIWebhook(allParams);
  } catch (error: any) {
    console.error('❌ [KwikAPI] GET Error:', error);
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// POST handler for webhook data
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';

    // Handle different content types
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      const text = await request.text();
      if (text) {
        try {
          body = Object.fromEntries(new URLSearchParams(text));
        } catch {
          body = JSON.parse(text);
        }
      }
    }

    console.log('🔔 [KwikAPI] POST Callback:', {
      contentType,
      body,
      timestamp: new Date().toISOString()
    });

    return await processKwikAPIWebhook(body);
  } catch (error: any) {
    console.error('❌ [KwikAPI] POST Error:', error);
    return new NextResponse('ERROR', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Main webhook processing function
async function processKwikAPIWebhook(data: any) {
  try {
    const {
      payid,
      client_id,
      operator_ref,
      status,
      // Legacy parameters
      transaction_id,
      operator_txn_id,
    } = data;

    const kwikApiOrderId = payid || transaction_id;
    const operatorRef = operator_ref || operator_txn_id;
    const transactionStatus = status;

    if (!kwikApiOrderId || !transactionStatus) {
      console.log('⚠️ [KwikAPI] Missing required parameters:', { kwikApiOrderId, transactionStatus });
      return new NextResponse('MISSING_PARAMS', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Find transaction
    let { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('kwikapi_order_id', kwikApiOrderId)
      .single();

    if (!transaction && transaction_id) {
      const { data: legacyTransaction } = await supabase
        .from('recharge_transactions')
        .select('*, user:users(id, email, name, role)')
        .eq('kwikapi_transaction_id', transaction_id)
        .single();
      transaction = legacyTransaction;
    }

    if (!transaction) {
      console.error('❌ [KwikAPI] Transaction not found:', kwikApiOrderId);
      return new NextResponse('TRANSACTION_NOT_FOUND', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.log('✅ [KwikAPI] Transaction found:', {
      id: transaction.id,
      currentStatus: transaction.status,
      newStatus: transactionStatus,
    });

    // Map KWIKAPI status to our status
    const newStatus = transactionStatus.toUpperCase();
    const previousStatus = transaction.status;

    // Update transaction status
    const operatorTxnId = operatorRef;

    await supabase
      .from('recharge_transactions')
      .update({
        status: newStatus,
        operator_transaction_id: operatorTxnId,
        callback_received: true,
        callback_data: data,
        completed_at: newStatus !== 'PENDING' ? new Date().toISOString() : null,
      })
      .eq('id', transaction.id);

    // Handle status changes (Deduct only on success, Delete on failure)
    if (newStatus === 'SUCCESS' && previousStatus !== 'SUCCESS') {
      console.log('💰 [KwikAPI-Callback] Processing SUCCESS settlement for transaction:', transaction.id);
      await processTransactionSuccess(transaction);
    } else if (newStatus === 'FAILED') {
      console.log('🗑️ [KwikAPI-Callback] Deleting failed transaction from history:', transaction.id);
      await supabase
        .from('recharge_transactions')
        .delete()
        .eq('id', transaction.id);
    }

    console.log('✅ [KwikAPI-Callback] Webhook processed successfully:', transaction.id);

    return new NextResponse('SUCCESS', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('❌ [KwikAPI] Processing error:', error);
    return new NextResponse('PROCESSING_ERROR', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
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

    console.log(`✅ [KwikAPI-Callback] Settlement completed for ${transaction.id}`);
  } catch (error) {
    console.error('❌ [KwikAPI-Callback] Success settlement error:', error);
  }
}
