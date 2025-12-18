import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Handle multiple content types from KwikAPI
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';
    const url = new URL(request.url);
    
    // First, try to get parameters from URL query string
    const urlParams = Object.fromEntries(url.searchParams.entries());
    if (Object.keys(urlParams).length > 0) {
      body = { ...urlParams };
    }
    
    // Then try to get from request body based on content type
    try {
      if (contentType.includes('application/json')) {
        const jsonBody = await request.json();
        body = { ...body, ...jsonBody };
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text();
        const formParams = Object.fromEntries(new URLSearchParams(text));
        body = { ...body, ...formParams };
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const formParams = Object.fromEntries(formData.entries());
        body = { ...body, ...formParams };
      } else {
        // Try to read as text and parse as query string
        const text = await request.text();
        if (text) {
          try {
            const textParams = Object.fromEntries(new URLSearchParams(text));
            body = { ...body, ...textParams };
          } catch {
            // If parsing fails, try as JSON
            try {
              const jsonBody = JSON.parse(text);
              body = { ...body, ...jsonBody };
            } catch {
              console.log('Could not parse request body:', text);
            }
          }
        }
      }
    } catch (error) {
      console.log('Error parsing request body:', error);
    }

    console.log('🔔 [KwikAPI] Webhook received:', {
      method: request.method,
      url: request.url,
      contentType,
      headers: Object.fromEntries(request.headers.entries()),
      urlParams,
      body,
      finalData: body
    });

    return await processWebhook(body, request);
  } catch (error: any) {
    console.error('❌ [KwikAPI] Webhook processing error:', error);
    
    const response = NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
}

// Main webhook processing function
async function processWebhook(body: any, request: NextRequest) {
  try {
    // KwikAPI webhook parameters
    const {
      payid,           // KwikAPI Unique Order Id
      client_id,       // Your Order Id  
      operator_ref,    // Operator Reference Id
      status,          // SUCCESS/FAILED
      // Legacy parameters for backward compatibility
      transaction_id,
      operator_txn_id,
      amount,
      service,
    } = body;

    // Use KwikAPI parameters or fallback to legacy
    const kwikApiOrderId = payid || transaction_id;
    const operatorRef = operator_ref || operator_txn_id;
    const transactionStatus = status;

    if (!kwikApiOrderId || !transactionStatus) {
      console.error('❌ [KwikAPI] Missing required webhook parameters:', { kwikApiOrderId, transactionStatus });
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Find transaction by KwikAPI order ID or transaction ID
    let { data: transaction } = await supabase
      .from('recharge_transactions')
      .select('*, user:users(id, email, name)')
      .eq('kwikapi_order_id', kwikApiOrderId)
      .single();

    // Fallback: try to find by kwikapi_transaction_id for legacy compatibility
    if (!transaction && transaction_id) {
      const { data: legacyTransaction } = await supabase
        .from('recharge_transactions')
        .select('*, user:users(id, email, name)')
        .eq('kwikapi_transaction_id', transaction_id)
        .single();
      transaction = legacyTransaction;
    }

    if (!transaction) {
      console.error('❌ [KwikAPI] Transaction not found for order ID:', kwikApiOrderId);
      return NextResponse.json(
        { success: false, message: 'Transaction not found' },
        { status: 404 }
      );
    }

    console.log('✅ [KwikAPI] Transaction found:', {
      id: transaction.id,
      currentStatus: transaction.status,
      newStatus: transactionStatus,
      operatorRef
    });

    // Update transaction status
    const updateData: any = {
      status: transactionStatus.toUpperCase(),
      callback_received: true,
      callback_data: body,
      completed_at: new Date().toISOString(),
    };

    // Update operator reference if provided
    if (operatorRef) {
      updateData.kwikapi_opr_id = operatorRef;
      updateData.operator_transaction_id = operatorRef;
    }

    await supabase
      .from('recharge_transactions')
      .update(updateData)
      .eq('id', transaction.id);

    // If status changed to SUCCESS and commission/cashback not yet credited
    if (transactionStatus === 'SUCCESS' && transaction.status !== 'SUCCESS') {
      console.log('💰 [KwikAPI] Processing rewards for successful transaction:', transaction.id);
      await processTransactionRewards(transaction);
    }

    // If status changed to FAILED, issue refund
    if (transactionStatus === 'FAILED' && transaction.status !== 'FAILED') {
      console.log('💸 [KwikAPI] Processing refund for failed transaction:', transaction.id);
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
      }
    }

    console.log('✅ [KwikAPI] Webhook processed successfully for transaction:', transaction.id);
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      transaction_id: transaction.id,
      status: transactionStatus
    });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error: any) {
    console.error('❌ [KwikAPI] Webhook processing error:', error);
    
    const response = NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
}

// Handle OPTIONS requests for CORS
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

// Process rewards (commission/cashback) for successful transactions
// Uses admin-configured rates from recharge_operators table - supports both web and mobile app
async function processTransactionRewards(transaction: any) {
  try {
    // Get user details to determine role
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', transaction.user_id)
      .single();

    if (!user) {
      console.log('⚠️ [KwikAPI] User not found for transaction:', transaction.id);
      return;
    }

    // Get operator configuration for dynamic commission/cashback rates
    // This works for both web and mobile app transactions
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

    if (!wallet) {
      console.log('⚠️ [KwikAPI] Wallet not found for user:', transaction.user_id);
      return;
    }

    let rewardAmount = 0;
    let rewardType = '';
    let rewardDescription = '';

    if (user.role === 'CUSTOMER') {
      // Customer gets cashback only if enabled for this operator
      if (rechargeOperator?.cashback_enabled && !transaction.cashback_claimed) {
        // Generate random cashback if not already set
        if (!transaction.cashback_amount || transaction.cashback_amount === 0) {
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

        console.log(`💰 [KwikAPI] Customer cashback: ${randomPercentage?.toFixed(2)}% = ₹${rewardAmount.toFixed(2)}`);
      } else if (!rechargeOperator?.cashback_enabled) {
        console.log('ℹ️ [KwikAPI] Cashback not enabled for this operator');
      }
    } else {
      // Retailer/Employee gets commission if not already paid
      if (!transaction.commission_paid) {
        // Calculate commission if not already set
        if (!transaction.commission_amount || transaction.commission_amount === 0) {
          const commissionRate = rechargeOperator?.commission_rate || 2.0;
          rewardAmount = (transaction.amount * commissionRate) / 100;

          // Update transaction with commission info
          await supabase
            .from('recharge_transactions')
            .update({
              commission_amount: rewardAmount,
            })
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

        console.log(`💰 [KwikAPI] Retailer commission: ${rechargeOperator?.commission_rate || 2.0}% = ₹${rewardAmount.toFixed(2)}`);
      }
    }

    // Credit reward to wallet if amount > 0
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
        metadata: {
          recharge_transaction_id: transaction.id,
          service_type: transaction.service_type,
          operator_name: rechargeOperator?.operator_name || 'Unknown',
          source: 'kwikapi_callback'
        }
      });

      console.log(`✅ [KwikAPI] ${rewardType} of ₹${rewardAmount.toFixed(2)} credited for transaction:`, transaction.id);
    } else {
      console.log('ℹ️ [KwikAPI] No reward to credit for transaction:', transaction.id);
    }
  } catch (error) {
    console.error('❌ [KwikAPI] Reward processing error:', error);
  }
}

// Handle GET requests for webhook verification and callbacks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const payid = searchParams.get('payid');
    const client_id = searchParams.get('client_id');
    const operator_ref = searchParams.get('operator_ref');
    const status = searchParams.get('status');

    console.log('🔔 [KwikAPI] Webhook GET request:', { 
      url: request.url,
      params: { payid, client_id, operator_ref, status },
      allParams: Object.fromEntries(searchParams.entries())
    });

    // If this is just a verification request (no parameters), return success
    if (!payid && !client_id && !operator_ref && !status) {
      const response = NextResponse.json({ 
        success: true, 
        message: 'KwikAPI webhook endpoint is active and ready to receive callbacks',
        timestamp: new Date().toISOString(),
        endpoint: request.url
      });
      
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    }

    // If we have webhook parameters, process them
    if (payid || client_id || status) {
      // Create body with all available parameters
      const body: any = {};
      
      // Add all search parameters to body
      for (const [key, value] of searchParams.entries()) {
        body[key] = value;
      }
      
      console.log('🔔 [KwikAPI] Processing GET webhook with params:', body);
      
      // Process the webhook data using the same logic as POST
      // We'll create a mock request to reuse POST logic
      const mockRequest = {
        url: request.url,
        method: 'GET',
        headers: request.headers,
        json: async () => body,
        text: async () => '',
        formData: async () => new FormData()
      } as any;
      
      // Call the main webhook processing logic
      return await processWebhook(body, request);
    }

    // Default response for other GET requests
    const response = NextResponse.json({ 
      success: true, 
      message: 'KwikAPI webhook endpoint - no parameters provided',
      timestamp: new Date().toISOString()
    });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error: any) {
    console.error('❌ [KwikAPI] GET webhook error:', error);
    
    const response = NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
}
