import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// POST /api/wallet/cashfree/webhook - Handle Cashfree payment webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    
    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    // Verify signature (implement based on Cashfree docs)
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const payload = timestamp + JSON.stringify(body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('base64');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { type, data } = body;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      
      // Get payment record
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('cashfree_payments')
        .select('*')
        .eq('order_id', order.order_id)
        .single();

      if (paymentError || !payment) {
        console.error('Payment record not found:', order.order_id);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      // Update payment status
      await supabaseAdmin
        .from('cashfree_payments')
        .update({
          status: 'PAID',
          payment_method: order.payment_method,
          payment_time: new Date().toISOString(),
          webhook_data: data,
        })
        .eq('order_id', order.order_id);

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', payment.user_id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found for user:', payment.user_id);
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      // Credit only base amount to wallet (without GST)
      const walletCreditAmount = payment.wallet_credit_amount || payment.base_amount;
      const newBalance = parseFloat(wallet.balance.toString()) + walletCreditAmount;

      await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', payment.user_id);

      // Create transaction record
      const { data: transaction } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: payment.user_id,
          wallet_id: wallet.id,
          type: 'DEPOSIT',
          amount: walletCreditAmount,
          status: 'COMPLETED',
          description: `Wallet recharge via Cashfree (Base: ₹${payment.base_amount}, GST: ₹${payment.gst_amount}, Total Paid: ₹${payment.amount})`,
          reference: order.order_id,
          metadata: {
            payment_method: order.payment_method,
            cf_order_id: order.cf_order_id,
            base_amount: payment.base_amount,
            gst_amount: payment.gst_amount,
            total_paid: payment.amount,
            wallet_credited: walletCreditAmount,
          },
        })
        .select()
        .single();

      // Update cashfree_payments with transaction_id
      if (transaction) {
        await supabaseAdmin
          .from('cashfree_payments')
          .update({ transaction_id: transaction.id })
          .eq('order_id', order.order_id);
      }

      // Create notification for user
      await supabaseAdmin.from('notifications').insert({
        title: 'Wallet Recharged Successfully',
        message: `₹${walletCreditAmount} has been added to your wallet via Cashfree payment gateway.`,
        type: 'WALLET_CREDIT',
        target_users: [payment.user_id],
        data: {
          amount: walletCreditAmount,
          transaction_id: transaction?.id,
          payment_method: order.payment_method,
        },
      });

      return NextResponse.json({ success: true, message: 'Payment processed' });
    }

    if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const { order } = data;
      
      await supabaseAdmin
        .from('cashfree_payments')
        .update({
          status: 'FAILED',
          webhook_data: data,
        })
        .eq('order_id', order.order_id);

      return NextResponse.json({ success: true, message: 'Payment failure recorded' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
