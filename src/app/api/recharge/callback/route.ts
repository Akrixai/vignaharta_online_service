import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and form-data from KwikAPI
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      // Handle form-data from KwikAPI webhook
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    }

    console.log('🔔 [KwikAPI] Webhook received:', body);

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

    // If status changed to SUCCESS and commission not yet credited
    if (transactionStatus === 'SUCCESS' && transaction.status !== 'SUCCESS') {
      console.log('💰 [KwikAPI] Processing commission for successful transaction:', transaction.id);
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (wallet && transaction.commission_amount > 0) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + transaction.commission_amount })
          .eq('user_id', transaction.user_id);

        await supabase.from('transactions').insert({
          user_id: transaction.user_id,
          wallet_id: wallet.id,
          type: 'COMMISSION',
          amount: transaction.commission_amount,
          status: 'COMPLETED',
          description: `Commission for ${transaction.service_type} recharge`,
          reference: transaction.transaction_ref,
        });
      }
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
    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('❌ [KwikAPI] Webhook processing error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const payid = searchParams.get('payid');
    const client_id = searchParams.get('client_id');
    const operator_ref = searchParams.get('operator_ref');
    const status = searchParams.get('status');

    console.log('🔔 [KwikAPI] Webhook GET request:', { payid, client_id, operator_ref, status });

    // If this is a webhook verification, return success
    if (!payid && !client_id) {
      return NextResponse.json({ 
        success: true, 
        message: 'KwikAPI webhook endpoint is active',
        timestamp: new Date().toISOString()
      });
    }

    // Process the webhook data (same logic as POST)
    const body = { payid, client_id, operator_ref, status };
    
    // Reuse the POST logic by calling it internally
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    return await POST(postRequest);

  } catch (error: any) {
    console.error('❌ [KwikAPI] GET webhook error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
