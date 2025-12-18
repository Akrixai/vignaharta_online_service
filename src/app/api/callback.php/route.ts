import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET handler for KwikAPI webhook callbacks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    console.log('🔔 [KwikAPI] Callback received (GET):', {
      url: request.url,
      params,
      timestamp: new Date().toISOString()
    });

    // If no parameters, return validation response
    if (Object.keys(params).length === 0) {
      return new NextResponse('OK', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Process the webhook
    return await processKwikAPICallback(params);
  } catch (error: any) {
    console.error('❌ [KwikAPI] GET Error:', error);
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

// POST handler for KwikAPI webhook callbacks
export async function POST(request: NextRequest) {
  try {
    let params: any = {};
    const contentType = request.headers.get('content-type') || '';
    
    // Handle different content types
    if (contentType.includes('application/json')) {
      params = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      params = Object.fromEntries(new URLSearchParams(text));
    } else {
      // Try to parse as form data
      const text = await request.text();
      if (text) {
        try {
          params = Object.fromEntries(new URLSearchParams(text));
        } catch {
          params = JSON.parse(text);
        }
      }
    }
    
    console.log('🔔 [KwikAPI] Callback received (POST):', {
      contentType,
      params,
      timestamp: new Date().toISOString()
    });

    return await processKwikAPICallback(params);
  } catch (error: any) {
    console.error('❌ [KwikAPI] POST Error:', error);
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

// Main callback processing function with dynamic commission/cashback
async function processKwikAPICallback(data: any) {
  try {
    const {
      payid,           // KwikAPI Unique Order Id
      client_id,       // Your Order Id  
      operator_ref,    // Operator Reference Id
      status,          // SUCCESS/FAILED
    } = data;

    if (!payid || !status) {
      console.log('⚠️ [KwikAPI] Missing required parameters:', { payid, status });
      return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Find transaction by KwikAPI order ID
    let { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('kwikapi_order_id', payid)
      .single();

    // Fallback: try to find by transaction reference
    if (!transaction && client_id) {
      const { data: fallbackTransaction } = await supabase
        .from('recharge_transactions')
        .select('*, user:users(id, email, name, role)')
        .eq('transaction_ref', client_id)
        .single();
      transaction = fallbackTransaction;
    }

    if (!transaction) {
      console.error('❌ [KwikAPI] Transaction not found:', { payid, client_id });
      return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    console.log('✅ [KwikAPI] Transaction found:', {
      id: transaction.id,
      currentStatus: transaction.status,
      newStatus: status,
      userRole: transaction.user?.role
    });

    // Update transaction status
    const updateData: any = {
      status: status.toUpperCase(),
      callback_received: true,
      callback_data: data,
      completed_at: new Date().toISOString(),
    };

    if (operator_ref) {
      updateData.kwikapi_opr_id = operator_ref;
      updateData.operator_transaction_id = operator_ref;
    }

    await supabase
      .from('recharge_transactions')
      .update(updateData)
      .eq('id', transaction.id);

    // Process rewards for successful transactions
    if (status === 'SUCCESS' && transaction.status !== 'SUCCESS') {
      await processTransactionRewards(transaction);
    }

    // Process refunds for failed transactions
    if (status === 'FAILED' && transaction.status !== 'FAILED') {
      await processTransactionRefund(transaction);
    }

    console.log('✅ [KwikAPI] Callback processed successfully:', transaction.id);
    
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('❌ [KwikAPI] Processing error:', error);
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

// Process rewards (commission/cashback) based on admin configuration
async function processTransactionRewards(transaction: any) {
  try {
    const user = transaction.user;
    if (!user) return;

    // Get operator configuration from recharge_operators table
    const { data: rechargeOperator } = await supabase
      .from('recharge_operators')
      .select('commission_rate, cashback_enabled, cashback_min_percentage, cashback_max_percentage')
      .eq('service_type', transaction.service_type)
      .eq('id', transaction.operator_id)
      .single();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (!wallet) return;

    let rewardAmount = 0;
    let rewardType = '';
    let rewardDescription = '';

    if (user.role === 'CUSTOMER') {
      // Customer gets cashback if enabled and not already claimed
      if (rechargeOperator?.cashback_enabled && !transaction.cashback_claimed) {
        if (!transaction.cashback_amount || transaction.cashback_amount === 0) {
          // Generate random cashback based on admin configuration
          const minPercentage = rechargeOperator.cashback_min_percentage || 0.5;
          const maxPercentage = rechargeOperator.cashback_max_percentage || 2.0;
          const randomPercentage = Math.random() * (maxPercentage - minPercentage) + minPercentage;
          rewardAmount = (transaction.amount * randomPercentage) / 100;

          // Update transaction with cashback info
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

        // Mark cashback as claimed
        await supabase
          .from('recharge_transactions')
          .update({
            cashback_claimed: true,
            cashback_claimed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);
      }
    } else {
      // Retailer/Employee gets commission if not already paid
      if (!transaction.commission_paid) {
        if (!transaction.commission_amount || transaction.commission_amount === 0) {
          // Calculate commission based on admin configuration
          const commissionRate = rechargeOperator?.commission_rate || 2.0;
          rewardAmount = (transaction.amount * commissionRate) / 100;

          // Update transaction with commission info
          await supabase
            .from('recharge_transactions')
            .update({ commission_amount: rewardAmount })
            .eq('id', transaction.id);
        } else {
          rewardAmount = transaction.commission_amount;
        }

        rewardType = 'COMMISSION';
        rewardDescription = `Commission for ${transaction.service_type} recharge`;

        // Mark commission as paid
        await supabase
          .from('recharge_transactions')
          .update({
            commission_paid: true,
            commission_paid_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);
      }
    }

    // Credit reward to wallet
    if (rewardAmount > 0) {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + rewardAmount })
        .eq('user_id', transaction.user_id);

      await supabase.from('transactions').insert({
        user_id: transaction.user_id,
        wallet_id: wallet.id,
        type: rewardType,
        amount: rewardAmount,
        status: 'COMPLETED',
        description: rewardDescription,
        reference: transaction.transaction_ref,
      });

      console.log(`✅ [KwikAPI] ${rewardType} of ₹${rewardAmount.toFixed(2)} credited for transaction:`, transaction.id);
    }
  } catch (error) {
    console.error('❌ [KwikAPI] Reward processing error:', error);
  }
}

// Process refund for failed transactions
async function processTransactionRefund(transaction: any) {
  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + transaction.total_amount })
        .eq('user_id', transaction.user_id);

      await supabase.from('transactions').insert({
        user_id: transaction.user_id,
        wallet_id: wallet.id,
        type: 'REFUND',
        amount: transaction.total_amount,
        status: 'COMPLETED',
        description: `Refund for failed ${transaction.service_type} recharge`,
        reference: transaction.transaction_ref,
      });

      console.log('✅ [KwikAPI] Refund processed for failed transaction:', transaction.id);
    }
  } catch (error) {
    console.error('❌ [KwikAPI] Refund processing error:', error);
  }
}