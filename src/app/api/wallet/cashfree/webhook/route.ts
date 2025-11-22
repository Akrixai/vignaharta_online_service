import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// GET handler for webhook verification/testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Cashfree webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    console.log('Webhook received:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      bodyLength: body.length,
      timestamp: timestamp,
      environment: process.env.CASHFREE_ENVIRONMENT || 'TEST'
    });

    // Skip signature verification if no webhook secret is configured
    // Many production Cashfree accounts don't provide webhook secrets
    const hasWebhookSecret = !!process.env.CASHFREE_WEBHOOK_SECRET;
    const isTestMode = process.env.CASHFREE_ENVIRONMENT === 'TEST';
    
    if (!hasWebhookSecret) {
      console.log('⚠️ No webhook secret configured - signature verification SKIPPED');
      console.log('This is normal for many Cashfree production accounts');
    } else if (isTestMode) {
      console.log('⚠️ TEST MODE: Webhook signature verification DISABLED');
    } else if (signature && timestamp) {
      try {
        // Cashfree signature format: base64(hmac_sha256(timestamp + raw_body))
        const signatureString = timestamp + body;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET)
          .update(signatureString)
          .digest('base64');

        console.log('Signature verification:', {
          received: signature.substring(0, 20) + '...',
          expected: expectedSignature.substring(0, 20) + '...',
          match: signature === expectedSignature
        });

        if (signature !== expectedSignature) {
          console.error('Invalid webhook signature - verification failed');
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
        console.log('✅ Webhook signature verified successfully');
      } catch (error) {
        console.error('Signature verification error:', error);
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        );
      }
    } else {
      console.log('Webhook signature verification skipped (missing secret or headers)');
    }

    const webhookData = JSON.parse(body);
    const { type, data } = webhookData;

    console.log('Webhook data parsed:', {
      type,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    });

    // Handle payment webhooks
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_FAILED_WEBHOOK' || type === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      const { order, payment } = data;
      const orderId = order.order_id;
      const cfOrderId = order.cf_order_id;
      const orderAmount = parseFloat(order.order_amount);
      const paymentStatus = payment?.payment_status || order.order_status; // 'SUCCESS', 'FAILED', etc.

      console.log('Processing payment:', {
        orderId,
        cfOrderId,
        orderAmount,
        paymentStatus,
        webhookType: type,
        isRegistration: orderId.startsWith('REG-')
      });

      // Check if this is a registration payment or wallet payment
      if (orderId.startsWith('REG-')) {
        // Handle registration payment
        console.log('Handling registration payment...');
        await handleRegistrationPayment(orderId, cfOrderId, orderAmount, paymentStatus, webhookData);
      } else {
        // Handle wallet payment
        console.log('Handling wallet payment...');
        await handleWalletPayment(orderId, cfOrderId, orderAmount, paymentStatus, webhookData);
      }
      
      console.log('Payment processing completed successfully');
    } else {
      console.log('Webhook type not handled:', type);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleWalletPayment(
  orderId: string,
  cfOrderId: string,
  amount: number,
  status: string,
  webhookData: any
) {
  try {
    console.log('handleWalletPayment called:', { orderId, amount, status });
    
    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('cashfree_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found:', orderId, paymentError);
      return;
    }
    
    console.log('Payment record found:', { userId: payment.user_id, currentStatus: payment.status });

    // Update payment status
    await supabaseAdmin
      .from('cashfree_payments')
      .update({
        status: status,
        payment_time: new Date().toISOString(),
        webhook_data: webhookData,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // If payment is successful, credit wallet (Cashfree uses 'SUCCESS' for payment_status)
    if (status === 'PAID' || status === 'SUCCESS') {
      console.log('Payment status is PAID/SUCCESS, crediting wallet...');
      
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', payment.user_id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found for user:', payment.user_id, walletError);
        return;
      }
      
      console.log('Wallet found:', { walletId: wallet.id, currentBalance: wallet.balance });

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: payment.user_id,
          wallet_id: wallet.id,
          type: 'DEPOSIT',
          amount: amount,
          status: 'COMPLETED',
          description: 'Wallet recharge via Cashfree',
          reference: orderId,
          metadata: {
            cf_order_id: cfOrderId,
            payment_method: webhookData.data?.payment?.payment_group || 'UNKNOWN',
          },
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Failed to create transaction:', transactionError);
        return;
      }

      // Update payment record with transaction ID
      await supabaseAdmin
        .from('cashfree_payments')
        .update({ transaction_id: transaction.id })
        .eq('order_id', orderId);

      // Update wallet balance
      const currentBalance = parseFloat(wallet.balance.toString());
      const newBalance = currentBalance + amount;

      console.log('Updating wallet balance:', { currentBalance, amount, newBalance });

      const { error: updateError } = await supabaseAdmin
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (updateError) {
        console.error('Failed to update wallet balance:', updateError);
        throw updateError;
      }

      console.log(`✅ Wallet credited successfully: User ${payment.user_id}, Amount: ₹${amount}, New Balance: ₹${newBalance}`);
    } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'USER_DROPPED') {
      console.log(`❌ Payment ${status} - wallet not credited`);
    } else {
      console.log(`Payment status is ${status}, not PAID/SUCCESS - skipping wallet credit`);
    }
  } catch (error) {
    console.error('❌ Error handling wallet payment:', error);
    throw error;
  }
}

async function handleRegistrationPayment(
  orderId: string,
  cfOrderId: string,
  amount: number,
  status: string,
  webhookData: any
) {
  try {
    // Get registration payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (paymentError || !payment) {
      console.error('Registration payment record not found:', orderId);
      return;
    }

    // Update payment status
    await supabaseAdmin
      .from('cashfree_registration_payments')
      .update({
        status: status,
        payment_method: webhookData.data?.payment?.payment_group || 'UNKNOWN',
        payment_time: new Date().toISOString(),
        webhook_data: webhookData,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // If payment is successful, CREATE user account directly (auto-approved)
    if ((status === 'PAID' || status === 'SUCCESS') && payment.metadata) {
      const registrationData = payment.metadata as any;

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', registrationData.email)
        .single();

      if (existingUser) {
        console.log(`User already exists: ${registrationData.email}`);
        return;
      }

      // Create user account directly (auto-approved after payment)
      const { data: newUser, error: userError} = await supabaseAdmin
        .from('users')
        .insert({
          name: registrationData.name,
          email: registrationData.email,
          phone: registrationData.phone,
          password_hash: registrationData.password_hash,
          role: registrationData.role || 'RETAILER',
          address: registrationData.address,
          city: registrationData.city,
          state: registrationData.state,
          pincode: registrationData.pincode,
          is_active: true,
        })
        .select()
        .single();

      if (userError || !newUser) {
        console.error('Failed to create user account:', userError);
        return;
      }

      // Create wallet for the new user
      const { error: walletError } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: newUser.id,
          balance: 0,
        });

      if (walletError) {
        console.error('Failed to create wallet:', walletError);
      }

      // Update payment record with user_id
      await supabaseAdmin
        .from('cashfree_registration_payments')
        .update({
          user_id: newUser.id,
        })
        .eq('order_id', orderId);

      // Create notification for admin
      await supabaseAdmin
        .from('notifications')
        .insert({
          title: 'New Retailer Registration',
          message: `${newUser.name} has successfully registered and paid ₹${amount}. Account auto-approved.`,
          type: 'REGISTRATION_PAYMENT_SUCCESS',
          data: {
            user_id: newUser.id,
            order_id: orderId,
            amount: amount,
            name: newUser.name,
            email: newUser.email,
          },
          target_roles: ['ADMIN'],
        });

      console.log(`✅ User account created and auto-approved: ${newUser.email}, Amount: ₹${amount}`);
    } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'USER_DROPPED') {
      console.log(`❌ Registration payment ${status} - user account not created`);
    }
  } catch (error) {
    console.error('Error handling registration payment:', error);
  }
}
