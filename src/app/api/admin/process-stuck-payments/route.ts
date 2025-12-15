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

// POST /api/admin/process-stuck-payments - Manually process stuck payments (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 }));
    }

    const body = await request.json();
    const { order_id, action } = body; // action can be 'mark_paid' or 'mark_failed'

    if (!order_id || !action) {
      return addCorsHeaders(NextResponse.json({ error: 'order_id and action are required' }, { status: 400 }));
    }

    console.log(`Admin ${user.email} processing stuck payment: ${order_id} with action: ${action}`);

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('cashfree_payments')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found:', order_id);
      return addCorsHeaders(NextResponse.json({ error: 'Payment not found' }, { status: 404 }));
    }

    if (action === 'mark_paid') {
      // Mark payment as paid and credit wallet
      
      // Update payment status
      await supabaseAdmin
        .from('cashfree_payments')
        .update({
          status: 'PAID',
          payment_method: 'ADMIN_MANUAL',
          payment_time: new Date().toISOString(),
          webhook_data: {
            manually_processed: true,
            processed_by: user.id,
            processed_at: new Date().toISOString()
          },
        })
        .eq('order_id', order_id);

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', payment.user_id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found for user:', payment.user_id);
        return addCorsHeaders(NextResponse.json({ error: 'Wallet not found' }, { status: 404 }));
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
          description: `Wallet recharge via Cashfree (Manually processed by admin) - Base: ₹${payment.base_amount}, GST: ₹${payment.gst_amount}, Total Paid: ₹${payment.amount}`,
          reference: order_id,
          metadata: {
            payment_method: 'ADMIN_MANUAL',
            cf_order_id: payment.cf_order_id,
            base_amount: payment.base_amount,
            gst_amount: payment.gst_amount,
            total_paid: payment.amount,
            wallet_credited: walletCreditAmount,
            manually_processed: true,
            processed_by: user.id,
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
        message: `₹${walletCreditAmount} has been added to your wallet. Payment processed manually by admin.`,
        type: 'WALLET_CREDIT',
        target_users: [payment.user_id],
        data: {
          amount: walletCreditAmount,
          transaction_id: transaction?.id,
          payment_method: 'ADMIN_MANUAL',
          manually_processed: true,
        },
      });

      console.log(`Payment ${order_id} manually processed as PAID. Amount credited: ₹${walletCreditAmount}`);

      return addCorsHeaders(NextResponse.json({
        success: true,
        message: 'Payment marked as paid and wallet credited',
        amount_credited: walletCreditAmount,
        new_balance: newBalance,
        transaction_id: transaction?.id
      }));

    } else if (action === 'mark_failed') {
      // Mark payment as failed
      await supabaseAdmin
        .from('cashfree_payments')
        .update({
          status: 'FAILED',
          webhook_data: {
            manually_processed: true,
            processed_by: user.id,
            processed_at: new Date().toISOString(),
            reason: 'Manually marked as failed by admin'
          },
        })
        .eq('order_id', order_id);

      console.log(`Payment ${order_id} manually marked as FAILED`);

      return addCorsHeaders(NextResponse.json({
        success: true,
        message: 'Payment marked as failed'
      }));

    } else {
      return addCorsHeaders(NextResponse.json({ error: 'Invalid action. Use "mark_paid" or "mark_failed"' }, { status: 400 }));
    }
  } catch (error: any) {
    console.error('Process stuck payments error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Failed to process stuck payments',
    }, { status: 500 }));
  }
}