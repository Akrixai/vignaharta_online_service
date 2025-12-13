import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Handle registration payment success
async function handleRegistrationPaymentSuccess(registrationPayment: any, order: any, webhookData: any) {
  try {
    console.log('Processing registration payment success:', {
      order_id: order.order_id,
      payment_method: order.payment_method,
      customer_email: registrationPayment.metadata?.email
    });

    // Update registration payment status
    const { error: updateError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .update({
        status: 'PAID',
        payment_method: order.payment_method,
        payment_time: new Date().toISOString(),
        webhook_data: webhookData,
      })
      .eq('order_id', order.order_id);

    if (updateError) {
      console.error('Failed to update registration payment status:', updateError);
      throw new Error('Failed to update payment status');
    }

    // Get registration details from metadata
    const metadata = registrationPayment.metadata;
    
    if (!metadata || !metadata.email) {
      console.error('Missing metadata in registration payment:', registrationPayment.id);
      throw new Error('Missing registration metadata');
    }

    console.log('Creating user account for:', metadata.email);
    
    // Create user account
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name: metadata.name,
        email: metadata.email,
        phone: metadata.phone,
        password_hash: metadata.password_hash,
        address: metadata.address,
        city: metadata.city,
        state: metadata.state,
        pincode: metadata.pincode,
        business_name: metadata.business_name,
        shop_photo_url: metadata.shop_photo_url,
        role: 'RETAILER',
        is_active: true,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('Failed to create user:', userError);
      throw new Error('Failed to create user account');
    }

    console.log('User account created successfully:', newUser.id);

    // Create wallet for the new user
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: newUser.id,
        balance: 0,
      });

    if (walletError) {
      console.error('Failed to create wallet:', walletError);
      // Don't fail the registration if wallet creation fails, just log it
    } else {
      console.log('Wallet created successfully for user:', newUser.id);
    }

    // Update registration payment with user_id
    await supabaseAdmin
      .from('cashfree_registration_payments')
      .update({ user_id: newUser.id })
      .eq('order_id', order.order_id);

    // Send welcome email with credentials
    try {
      const { sendWelcomeRetailerEmail } = await import('@/lib/email-service');
      const emailSent = await sendWelcomeRetailerEmail(
        metadata.name,
        metadata.email,
        metadata.password // This is the plain text password from metadata
      );
      
      if (emailSent) {
        console.log('Welcome email sent successfully to:', metadata.email);
      } else {
        console.error('Failed to send welcome email to:', metadata.email);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    // Create notification for new user
    await supabaseAdmin.from('notifications').insert({
      title: 'Registration Successful!',
      message: `Welcome ${metadata.name}! Your retailer account has been created successfully. You can now start using our services. Check your email for login credentials.`,
      type: 'REGISTRATION_SUCCESS',
      target_users: [newUser.id],
      data: {
        registration_fee: registrationPayment.base_amount,
        gst_amount: registrationPayment.gst_amount,
        total_paid: registrationPayment.amount,
        payment_method: order.payment_method,
        email_sent: true,
      },
    });

    // Create notification for admins
    await supabaseAdmin.from('notifications').insert({
      title: 'New Retailer Registration',
      message: `${metadata.name} (${metadata.email}) has completed registration with payment of ₹${registrationPayment.amount}.`,
      type: 'NEW_REGISTRATION',
      target_roles: ['ADMIN'],
      data: {
        user_id: newUser.id,
        user_name: metadata.name,
        user_email: metadata.email,
        registration_fee: registrationPayment.base_amount,
        gst_amount: registrationPayment.gst_amount,
        total_paid: registrationPayment.amount,
      },
    });

    return NextResponse.json({ success: true, message: 'Registration completed successfully' });
  } catch (error) {
    console.error('Registration payment processing error:', error);
    return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 });
  }
}

// POST /api/wallet/cashfree/webhook - Handle Cashfree payment webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log webhook for debugging
    console.log('Cashfree webhook received:', {
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: new Date().toISOString()
    });
    
    // Verify webhook signature (but don't fail if missing in development)
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    
    // Only enforce signature verification in production
    const isProduction = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION';
    
    if (isProduction && (!signature || !timestamp)) {
      console.error('Missing webhook signature or timestamp in production');
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    // Verify signature if available
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (webhookSecret && signature && timestamp) {
      const payload = timestamp + JSON.stringify(body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('base64');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature:', {
          received: signature,
          expected: expectedSignature,
          payload: payload
        });
        
        // In production, reject invalid signatures
        if (isProduction) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        } else {
          console.warn('Signature mismatch in development - proceeding anyway');
        }
      }
    } else if (!webhookSecret) {
      console.warn('CASHFREE_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    const { type, data } = body;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      
      // Try to get wallet payment record first
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('cashfree_payments')
        .select('*')
        .eq('order_id', order.order_id)
        .single();

      // If not found in wallet payments, check registration payments
      if (paymentError || !payment) {
        const { data: registrationPayment, error: regPaymentError } = await supabaseAdmin
          .from('cashfree_registration_payments')
          .select('*')
          .eq('order_id', order.order_id)
          .single();

        if (regPaymentError || !registrationPayment) {
          console.error('Payment record not found in both tables:', order.order_id);
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Handle registration payment success
        return await handleRegistrationPaymentSuccess(registrationPayment, order, data);
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
      
      // Try wallet payments first
      const { data: walletPayment } = await supabaseAdmin
        .from('cashfree_payments')
        .select('id')
        .eq('order_id', order.order_id)
        .single();

      if (walletPayment) {
        await supabaseAdmin
          .from('cashfree_payments')
          .update({
            status: 'FAILED',
            webhook_data: data,
          })
          .eq('order_id', order.order_id);
      } else {
        // Check registration payments
        const { data: registrationPayment } = await supabaseAdmin
          .from('cashfree_registration_payments')
          .select('id')
          .eq('order_id', order.order_id)
          .single();

        if (registrationPayment) {
          await supabaseAdmin
            .from('cashfree_registration_payments')
            .update({
              status: 'FAILED',
              webhook_data: data,
            })
            .eq('order_id', order.order_id);
        }
      }

      return NextResponse.json({ success: true, message: 'Payment failure recorded' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
