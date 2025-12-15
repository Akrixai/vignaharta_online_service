import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

// Add CORS headers for cross-origin requests
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'TEST';
const CASHFREE_API_URL = CASHFREE_ENVIRONMENT === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// POST /api/wallet/cashfree/verify-payment - Manually verify payment status and process if successful
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return addCorsHeaders(NextResponse.json({ error: 'Order ID is required' }, { status: 400 }));
    }

    console.log('Manual payment verification requested for order:', order_id);

    // Get payment record from database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('cashfree_payments')
      .select('*')
      .eq('order_id', order_id)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found:', order_id);
      return addCorsHeaders(NextResponse.json({ error: 'Payment not found' }, { status: 404 }));
    }

    // If already processed, return success without processing again
    if (payment.status === 'PAID') {
      console.log('Payment already processed by webhook, skipping manual verification:', order_id);
      return addCorsHeaders(NextResponse.json({ 
        success: true, 
        message: 'Payment already processed by webhook',
        status: 'PAID',
        already_processed: true
      }));
    }

    // Check if cf_order_id exists
    if (!payment.cf_order_id) {
      console.error('Missing cf_order_id for payment:', payment.order_id);
      return addCorsHeaders(NextResponse.json({ 
        error: 'Payment record missing Cashfree order ID',
        status: 'ERROR'
      }, { status: 400 }));
    }

    // Check payment status with Cashfree API using cf_order_id
    console.log('Querying Cashfree API with cf_order_id:', payment.cf_order_id);
    
    const cashfreeResponse = await fetch(`${CASHFREE_API_URL}/orders/${payment.cf_order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
    });

    const orderStatus = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', orderStatus);
      return addCorsHeaders(NextResponse.json({ 
        error: 'Failed to verify payment status',
        details: orderStatus
      }, { status: 500 }));
    }

    console.log('Cashfree order status:', orderStatus);

    // Check if payment is successful
    if (orderStatus.order_status === 'PAID') {
      // Update payment status
      await supabaseAdmin
        .from('cashfree_payments')
        .update({
          status: 'PAID',
          payment_method: orderStatus.payment_method || 'UNKNOWN',
          payment_time: new Date().toISOString(),
          webhook_data: orderStatus,
        })
        .eq('order_id', order_id);

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found for user:', user.id);
        return addCorsHeaders(NextResponse.json({ error: 'Wallet not found' }, { status: 404 }));
      }

      // Credit only base amount to wallet (without GST)
      const walletCreditAmount = payment.wallet_credit_amount || payment.base_amount;
      const newBalance = parseFloat(wallet.balance.toString()) + walletCreditAmount;

      await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      // Create transaction record
      const { data: transaction } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'DEPOSIT',
          amount: walletCreditAmount,
          status: 'COMPLETED',
          description: `Wallet recharge via Cashfree (Base: ₹${payment.base_amount}, GST: ₹${payment.gst_amount}, Total Paid: ₹${payment.amount})`,
          reference: order_id,
          metadata: {
            payment_method: orderStatus.payment_method || 'UNKNOWN',
            cf_order_id: payment.cf_order_id,
            base_amount: payment.base_amount,
            gst_amount: payment.gst_amount,
            total_paid: payment.amount,
            wallet_credited: walletCreditAmount,
            verified_manually: true,
            processed_by: 'manual_verification'
          },
        })
        .select()
        .single();

      // Update cashfree_payments with transaction_id
      if (transaction) {
        await supabaseAdmin
          .from('cashfree_payments')
          .update({ transaction_id: transaction.id })
          .eq('order_id', order_id);
      }

      // Create notification for user
      await supabaseAdmin.from('notifications').insert({
        title: 'Wallet Recharged Successfully',
        message: `₹${walletCreditAmount} has been added to your wallet via Cashfree payment gateway.`,
        type: 'WALLET_CREDIT',
        target_users: [user.id],
        data: {
          amount: walletCreditAmount,
          transaction_id: transaction?.id,
          payment_method: orderStatus.payment_method || 'UNKNOWN',
          verified_manually: true,
        },
      });

      console.log('Payment verified and processed successfully:', {
        order_id,
        amount_credited: walletCreditAmount,
        new_balance: newBalance
      });

      return addCorsHeaders(NextResponse.json({ 
        success: true, 
        message: 'Payment verified and processed successfully',
        status: 'PAID',
        amount_credited: walletCreditAmount,
        new_balance: newBalance
      }));
    } else {
      // Payment not successful
      const status = orderStatus.order_status || 'UNKNOWN';
      
      // Update payment status if failed
      if (status === 'CANCELLED' || status === 'FAILED') {
        await supabaseAdmin
          .from('cashfree_payments')
          .update({
            status: 'FAILED',
            webhook_data: orderStatus,
          })
          .eq('order_id', order_id);
      }

      return addCorsHeaders(NextResponse.json({ 
        success: false, 
        message: `Payment not successful. Status: ${status}`,
        status: status
      }));
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Payment verification failed',
    }, { status: 500 }));
  }
}