import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST handler for KwikAPI webhook callbacks
export async function POST(request: NextRequest) {
  try {
    let params: any = {};
    const contentType = request.headers.get('content-type') || '';
    const url = new URL(request.url);
    
    // First, try to get parameters from URL query string (KwikAPI may send via URL)
    const urlParams = Object.fromEntries(url.searchParams.entries());
    if (Object.keys(urlParams).length > 0) {
      params = { ...urlParams };
    }
    
    // Then try to get from request body based on content type
    try {
      if (contentType.includes('application/json')) {
        const jsonBody = await request.json();
        params = { ...params, ...jsonBody };
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text();
        const formParams = Object.fromEntries(new URLSearchParams(text));
        params = { ...params, ...formParams };
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const formParams = Object.fromEntries(formData.entries());
        params = { ...params, ...formParams };
      } else {
        // Try to read as text and parse as query string or JSON
        const text = await request.text();
        if (text) {
          try {
            const textParams = Object.fromEntries(new URLSearchParams(text));
            params = { ...params, ...textParams };
          } catch {
            try {
              const jsonBody = JSON.parse(text);
              params = { ...params, ...jsonBody };
            } catch {
              console.log('Could not parse request body:', text);
            }
          }
        }
      }
    } catch (error) {
      console.log('Error parsing request body:', error);
    }
    
    console.log('🔔 [KwikAPI] Callback received (POST):', {
      contentType,
      urlParams,
      params,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });

    return await processKwikAPICallback(params);
  } catch (error: any) {
    console.error('❌ [KwikAPI] POST Error:', error);
    // Always return OK to KwikAPI to prevent retries
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

// GET handler for KwikAPI webhook callbacks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    console.log('🔔 [KwikAPI] Callback received (GET):', {
      url: request.url,
      params,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });

    // If no parameters, return validation response for KwikAPI URL verification
    if (Object.keys(params).length === 0) {
      console.log('✅ [KwikAPI] URL validation request - responding OK');
      return new NextResponse('OK', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Process the webhook with parameters
    return await processKwikAPICallback(params);
  } catch (error: any) {
    console.error('❌ [KwikAPI] GET Error:', error);
    // Always return OK to KwikAPI to prevent retries
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
// Supports both web and mobile app transactions
async function processKwikAPICallback(data: any) {
  try {
    const {
      payid,           // KwikAPI Unique Order Id
      client_id,       // Your Order Id  
      operator_ref,    // Operator Reference Id
      status,          // SUCCESS/FAILED
      // Legacy parameters for backward compatibility
      transaction_id,
      operator_txn_id,
    } = data;

    // Use KwikAPI parameters or fallback to legacy
    const kwikApiOrderId = payid || transaction_id;
    const operatorRef = operator_ref || operator_txn_id;
    const transactionStatus = status;

    if (!kwikApiOrderId || !transactionStatus) {
      console.log('⚠️ [KwikAPI] Missing required parameters:', { kwikApiOrderId, transactionStatus, data });
      return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Find transaction by KwikAPI order ID
    let { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name, role)')
      .eq('kwikapi_order_id', kwikApiOrderId)
      .single();

    // Fallback: try to find by transaction reference or kwikapi_transaction_id
    if (!transaction) {
      if (client_id) {
        const { data: fallbackTransaction } = await supabase
          .from('recharge_transactions')
          .select('*, user:users(id, email, name, role)')
          .eq('transaction_ref', client_id)
          .single();
        transaction = fallbackTransaction;
      }
      
      // Another fallback for legacy compatibility
      if (!transaction && transaction_id) {
        const { data: legacyTransaction } = await supabase
          .from('recharge_transactions')
          .select('*, user:users(id, email, name, role)')
          .eq('kwikapi_transaction_id', transaction_id)
          .single();
        transaction = legacyTransaction;
      }
    }

    if (!transaction) {
      console.error('❌ [KwikAPI] Transaction not found:', { kwikApiOrderId, client_id, transaction_id });
      return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    console.log('✅ [KwikAPI] Transaction found:', {
      id: transaction.id,
      currentStatus: transaction.status,
      newStatus: transactionStatus,
      userRole: transaction.user?.role,
      serviceType: transaction.service_type
    });

    // Update transaction status
    const updateData: any = {
      status: transactionStatus.toUpperCase(),
      callback_received: true,
      callback_data: data,
      completed_at: new Date().toISOString(),
    };

    if (operatorRef) {
      updateData.kwikapi_opr_id = operatorRef;
      updateData.operator_transaction_id = operatorRef;
    }

    await supabase
      .from('recharge_transactions')
      .update(updateData)
      .eq('id', transaction.id);

    // Process rewards for successful transactions (if status changed to SUCCESS)
    if (transactionStatus === 'SUCCESS' && transaction.status !== 'SUCCESS') {
      console.log('💰 [KwikAPI] Processing rewards for successful transaction:', transaction.id);
      await processTransactionRewards(transaction);
    }

    // Process refunds for failed transactions (if status changed to FAILED)
    if (transactionStatus === 'FAILED' && transaction.status !== 'FAILED') {
      console.log('💸 [KwikAPI] Processing refund for failed transaction:', transaction.id);
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
    // Always return OK to prevent KwikAPI retries
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