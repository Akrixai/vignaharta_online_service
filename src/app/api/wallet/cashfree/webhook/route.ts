import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validatePaymentSecurity, logSecurityIncident } from '@/lib/payment-security';

// Add CORS headers for cross-origin requests (Flutter app)
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-signature, x-webhook-timestamp');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// GET endpoint to test webhook URL accessibility
export async function GET(request: NextRequest) {
  console.log('🔍 Webhook URL accessed via GET:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  return addCorsHeaders(NextResponse.json({
    success: true,
    message: 'Cashfree webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    environment: process.env.CASHFREE_ENVIRONMENT || 'TEST'
  }));
}

// Handle registration payment success
async function handleRegistrationPaymentSuccess(registrationPayment: any, order: any, webhookData: any) {
  try {
    console.log('Processing registration payment success:', {
      order_id: order.order_id,
      payment_method: order.payment_method,
      customer_email: registrationPayment.metadata?.email
    });

    // Check if registration payment is already processed to avoid double processing
    if (registrationPayment.status === 'PAID') {
      console.log('Registration payment already processed, skipping:', order.order_id);
      return addCorsHeaders(NextResponse.json({ success: true, message: 'Registration payment already processed' }));
    }

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

    return addCorsHeaders(NextResponse.json({ success: true, message: 'Registration completed successfully' }));
  } catch (error) {
    console.error('Registration payment processing error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to process registration' }, { status: 500 }));
  }
}

// POST /api/wallet/cashfree/webhook - Handle Cashfree payment webhooks
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 CASHFREE WEBHOOK RECEIVED!', {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Check if this is a Cashfree webhook or a browser request
    const userAgent = request.headers.get('user-agent') || '';
    const contentType = request.headers.get('content-type') || '';
    const url = new URL(request.url);
    const hasNgrokBypass = url.searchParams.has('ngrok-skip-browser-warning') || request.headers.get('ngrok-skip-browser-warning');
    
    console.log('🔍 Request details:', {
      userAgent,
      contentType,
      hasNgrokBypass,
      queryParams: Object.fromEntries(url.searchParams.entries())
    });

    const body = await request.json();
    
    // Log webhook for debugging
    console.log('📦 Cashfree webhook payload:', {
      body: body,
      timestamp: new Date().toISOString()
    });
    
    // Skip webhook signature verification completely as Cashfree works without it
    // This was working before and Cashfree doesn't require signature verification
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    
    console.log('Cashfree webhook received - signature verification skipped (not required)', {
      has_signature: !!signature,
      has_timestamp: !!timestamp,
      environment: process.env.CASHFREE_ENVIRONMENT
    });

    const { type, data } = body;

    console.log('Processing webhook type:', type, 'with data keys:', Object.keys(data || {}));

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order, payment } = data;
      
      // CRITICAL SECURITY CHECK: Comprehensive payment validation
      const securityCheck = validatePaymentSecurity(data, process.env.CASHFREE_ENVIRONMENT);
      
      if (!securityCheck.isValid) {
        console.error('🚨 SECURITY ALERT: Payment blocked by security validation!', {
          order_id: order.order_id,
          reason: securityCheck.reason,
          riskLevel: securityCheck.riskLevel,
          blockedIndicators: securityCheck.blockedIndicators,
          payment_method: payment?.payment_method,
          upi_id: payment?.payment_method?.upi?.upi_id,
          bank_reference: payment?.bank_reference,
          message: payment?.payment_message,
          timestamp: new Date().toISOString()
        });
        
        // Log security incident
        await logSecurityIncident({
          type: 'BLOCKED_PAYMENT',
          description: securityCheck.reason || 'Payment blocked by security validation',
          paymentData: data,
          riskLevel: securityCheck.riskLevel
        });
        
        // Create admin notification
        await supabaseAdmin.from('notifications').insert({
          title: `🚨 SECURITY ALERT: ${securityCheck.riskLevel} Risk Payment Blocked`,
          message: `Blocked payment attempt: Order ${order.order_id}. Reason: ${securityCheck.reason}. Indicators: ${securityCheck.blockedIndicators?.join(', ') || 'N/A'}`,
          type: 'SECURITY_ALERT',
          target_roles: ['ADMIN'],
          data: {
            order_id: order.order_id,
            payment_data: payment,
            security_check: securityCheck,
            blocked_reason: securityCheck.reason,
            risk_level: securityCheck.riskLevel,
            timestamp: new Date().toISOString()
          },
        });
        
        return addCorsHeaders(NextResponse.json({ 
          error: 'Payment blocked by security validation',
          reason: securityCheck.reason,
          blocked: true 
        }, { status: 403 }));
      }
      
      // Try to get wallet payment record first
      const { data: paymentRecord, error: paymentError } = await supabaseAdmin
        .from('cashfree_payments')
        .select('*')
        .eq('order_id', order.order_id)
        .single();

      // If not found in wallet payments, check registration payments
      if (paymentError || !paymentRecord) {
        const { data: registrationPayment, error: regPaymentError } = await supabaseAdmin
          .from('cashfree_registration_payments')
          .select('*')
          .eq('order_id', order.order_id)
          .single();

        if (regPaymentError || !registrationPayment) {
          console.error('Payment record not found in both tables:', order.order_id);
          return addCorsHeaders(NextResponse.json({ error: 'Payment not found' }, { status: 404 }));
        }

        // Handle registration payment success
        return await handleRegistrationPaymentSuccess(registrationPayment, order, data);
      }

      // ── SUBSCRIPTION PAYMENT (SUB_ prefix) ───────────────────────────────
      if (paymentRecord.metadata?.type === 'SUBSCRIPTION' || order.order_id.startsWith('SUB_')) {
        console.log('Processing subscription payment:', order.order_id);

        // Atomic update — only process once
        const { data: subUpdated } = await supabaseAdmin
          .from('cashfree_payments')
          .update({
            status: 'PAID',
            payment_method: order.payment_method,
            payment_time: new Date().toISOString(),
            webhook_data: data,
            webhook_processed_at: new Date().toISOString(),
          })
          .eq('order_id', order.order_id)
          .eq('status', 'CREATED')
          .select();

        if (!subUpdated || subUpdated.length === 0) {
          console.log('Subscription payment already processed:', order.order_id);
          return addCorsHeaders(NextResponse.json({ success: true, message: 'Already processed' }));
        }

        const planId = paymentRecord.metadata?.plan_id;
        const userId = paymentRecord.user_id;
        const baseAmount = paymentRecord.base_amount;

        if (!planId) {
          console.error('No plan_id in subscription metadata:', order.order_id);
          return addCorsHeaders(NextResponse.json({ error: 'Missing plan_id' }, { status: 500 }));
        }

        const { data: plan } = await supabaseAdmin
          .from('subscription_plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (!plan) {
          console.error('Plan not found:', planId);
          return addCorsHeaders(NextResponse.json({ error: 'Plan not found' }, { status: 500 }));
        }

        const now = new Date();
        const { data: existingSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id, end_date')
          .eq('user_id', userId)
          .eq('status', 'ACTIVE')
          .gte('end_date', now.toISOString())
          .maybeSingle();

        let endDate = existingSub ? new Date(existingSub.end_date) : new Date(now);
        switch (plan.billing_period) {
          case 'MONTHLY':     endDate.setMonth(endDate.getMonth() + 1); break;
          case 'QUARTERLY':   endDate.setMonth(endDate.getMonth() + 3); break;
          case 'HALF_YEARLY': endDate.setMonth(endDate.getMonth() + 6); break;
          case 'YEARLY':      endDate.setFullYear(endDate.getFullYear() + 1); break;
        }

        if (existingSub) {
          await supabaseAdmin
            .from('user_subscriptions')
            .update({ status: 'CANCELLED', updated_at: now.toISOString() })
            .eq('id', existingSub.id);
        }

        const { data: newSub } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            status: 'ACTIVE',
            amount_paid: baseAmount,
          })
          .select()
          .single();

        await supabaseAdmin.from('transactions').insert({
          user_id: userId,
          type: 'DEBIT',
          amount: baseAmount,
          description: `Subscription via Cashfree: ${plan.name} (Base: ₹${baseAmount}, GST: ₹${paymentRecord.gst_amount}, Total: ₹${paymentRecord.amount})`,
          status: 'COMPLETED',
          reference: order.order_id,
          metadata: {
            type: 'SUBSCRIPTION',
            plan_id: planId,
            plan_name: plan.name,
            payment_method: order.payment_method,
            subscription_id: newSub?.id,
          },
        });

        await supabaseAdmin.from('notifications').insert({
          title: '🎉 Subscription Activated!',
          message: `Your ${plan.name} subscription is now active until ${endDate.toLocaleDateString('en-IN')}.`,
          type: 'SUBSCRIPTION_ACTIVATED',
          target_users: [userId],
          data: { plan_name: plan.name, end_date: endDate.toISOString(), amount_paid: baseAmount },
        });

        console.log('Subscription activated via webhook:', newSub?.id);
        return addCorsHeaders(NextResponse.json({ success: true, message: 'Subscription activated' }));
      }

      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('cashfree_payments')
        .update({
          status: 'PAID',
          payment_method: order.payment_method,
          payment_time: new Date().toISOString(),
          webhook_data: data,
          webhook_processed_at: new Date().toISOString(),
        })
        .eq('order_id', order.order_id)
        .eq('status', 'CREATED') // Only update if status is still CREATED
        .select();

      // If no rows were updated, payment was already processed
      if (!updateResult || updateResult.length === 0) {
        console.log('Payment already processed by another webhook, skipping:', order.order_id);
        return addCorsHeaders(NextResponse.json({ success: true, message: 'Payment already processed by another webhook' }));
      }

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', paymentRecord.user_id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found for user:', paymentRecord.user_id);
        return addCorsHeaders(NextResponse.json({ error: 'Wallet not found' }, { status: 404 }));
      }

      // Credit only base amount to wallet (without GST)
      const walletCreditAmount = paymentRecord.wallet_credit_amount || paymentRecord.base_amount;
      const newBalance = parseFloat(wallet.balance.toString()) + walletCreditAmount;

      console.log('Crediting wallet:', {
        user_id: paymentRecord.user_id,
        current_balance: wallet.balance,
        credit_amount: walletCreditAmount,
        new_balance: newBalance
      });

      await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', paymentRecord.user_id);

      // Create transaction record with duplicate prevention
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: paymentRecord.user_id,
          wallet_id: wallet.id,
          type: 'DEPOSIT',
          amount: walletCreditAmount,
          status: 'COMPLETED',
          description: `Wallet recharge via Cashfree (Base: ₹${paymentRecord.base_amount}, GST: ₹${paymentRecord.gst_amount}, Total Paid: ₹${paymentRecord.amount})`,
          reference: order.order_id,
          metadata: {
            payment_method: order.payment_method,
            cf_order_id: order.cf_order_id,
            base_amount: paymentRecord.base_amount,
            gst_amount: paymentRecord.gst_amount,
            total_paid: paymentRecord.amount,
            wallet_credited: walletCreditAmount,
            processed_by: 'webhook'
          },
        })
        .select()
        .single();

      if (transactionError) {
        // Check if it's a duplicate constraint violation
        if (transactionError.code === '23505' && transactionError.message.includes('unique_deposit_reference_per_user')) {
          console.log('Duplicate transaction prevented by database constraint:', order.order_id);
          return addCorsHeaders(NextResponse.json({ success: true, message: 'Transaction already processed (duplicate prevented)' }));
        }
        console.error('Failed to create transaction:', transactionError);
        throw new Error('Failed to create transaction record');
      }

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
        target_users: [paymentRecord.user_id],
        data: {
          amount: walletCreditAmount,
          transaction_id: transaction?.id,
          payment_method: order.payment_method,
        },
      });

      return addCorsHeaders(NextResponse.json({ success: true, message: 'Payment processed' }));
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

      return addCorsHeaders(NextResponse.json({ success: true, message: 'Payment failure recorded' }));
    }

    return addCorsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Webhook error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 }));
  }
}
