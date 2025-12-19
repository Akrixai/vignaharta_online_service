import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { inspayService } from '@/lib/inspay';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { withCors, corsJsonResponse } from '@/lib/cors';

async function handler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return corsJsonResponse({ success: false, message: 'Unauthorized' }, 401);
    }

    console.log(`👤 User ${user.email} (Role: ${user.role}) is applying for PAN_CORRECTION`);

    // Check if user has access (RETAILER or ADMIN)
    if (user.role !== 'RETAILER' && user.role !== 'ADMIN') {
      return corsJsonResponse({ success: false, message: 'Access denied. Only Retailers and Admins can use this service.' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return corsJsonResponse({ success: false, message: 'Invalid JSON body' }, 400);
    }

    const { mobile_number, mode } = body;
    console.log('📦 Request body:', body);

    if (!mobile_number || !mode) {
      return corsJsonResponse({ success: false, message: 'Missing required fields: mobile_number and mode are required' }, 400);
    }

    if (!/^[0-9]{10}$/.test(mobile_number.toString())) {
      return corsJsonResponse({ success: false, message: 'Invalid mobile number. Must be 10 digits.' }, 400);
    }

    if (!['EKYC', 'ESIGN'].includes(mode)) {
      return corsJsonResponse({ success: false, message: 'Invalid mode. Must be EKYC or ESIGN.' }, 400);
    }

    // Get configuration
    const { data: config, error: configError } = await supabaseAdmin
      .from('pan_commission_config')
      .select('*')
      .eq('service_type', 'PAN_CORRECTION')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json({ success: false, message: 'Service configuration not found' }, { status: 404 });
    }

    // Get wallet with full details
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }

    // Check wallet balance
    if (wallet.balance < config.price) {
      return NextResponse.json({
        success: false,
        message: `Insufficient wallet balance. Required: ₹${config.price}, Available: ₹${wallet.balance}. Please add money to your wallet first.`
      }, { status: 400 });
    }

    // Generate order ID
    const orderId = inspayService.generateOrderId();

    console.log('💰 Processing instant wallet deduction for PAN Correction...');

    // INSTANT WALLET DEDUCTION - Deduct amount immediately
    const newBalance = wallet.balance - config.price;
    const { error: deductError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('❌ Error deducting from wallet:', deductError);
      return NextResponse.json({
        success: false,
        message: 'Failed to process payment from wallet'
      }, { status: 500 });
    }

    console.log(`✅ Wallet debited: ₹${config.price}. New balance: ₹${newBalance}`);

    // Create debit transaction immediately
    const { data: debitTransaction, error: debitTxError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'WITHDRAWAL',
        amount: -config.price,
        status: 'COMPLETED',
        description: `PAN Service Payment - PAN_CORRECTION (${orderId})`,
        reference: orderId,
        metadata: {
          service_type: 'PAN_CORRECTION',
          order_id: orderId,
          payment_type: 'INSTANT_DEBIT',
          mobile_number,
          mode
        }
      })
      .select()
      .single();

    if (debitTxError) {
      console.error('❌ Error creating debit transaction:', debitTxError);
      // Rollback wallet deduction
      await supabaseAdmin
        .from('wallets')
        .update({
          balance: wallet.balance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return NextResponse.json({
        success: false,
        message: 'Failed to record payment transaction'
      }, { status: 500 });
    }

    console.log('✅ Debit transaction created:', debitTransaction.id);

    // Create PAN service record with payment info
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const { data: panService, error: panServiceError } = await supabaseAdmin
      .from('pan_services')
      .insert({
        user_id: user.id,
        service_type: 'PAN_CORRECTION',
        mobile_number,
        mode,
        order_id: orderId,
        amount: config.price,
        commission_amount: (config.price * config.commission_rate) / 100,
        status: 'PENDING',
        payment_status: 'DEBITED',
        payment_debited_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (panServiceError) {
      console.error('❌ Error creating PAN service record:', panServiceError);

      // Rollback: Refund the amount
      await supabaseAdmin
        .from('wallets')
        .update({
          balance: wallet.balance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Mark debit transaction as cancelled
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'CANCELLED' })
        .eq('id', debitTransaction.id);

      return NextResponse.json({
        success: false,
        message: 'Failed to create service record. Payment has been refunded.'
      }, { status: 500 });
    }

    console.log('✅ PAN service record created:', panService.id);

    try {
      console.log('🔄 Calling InsPay API for PAN Correction...');

      // Call InsPay API
      const inspayResponse = await inspayService.panCorrectionRequest({
        number: mobile_number,
        mode,
        orderid: orderId
      });

      console.log('📥 InsPay API Response:', JSON.stringify(inspayResponse, null, 2));

      if (inspayResponse.status === 'Success') {
        console.log('✅ InsPay Success - Updating PAN service record');

        // Update PAN service with InsPay response
        const { error: updateError } = await supabaseAdmin
          .from('pan_services')
          .update({
            inspay_txid: inspayResponse.txid,
            inspay_opid: inspayResponse.opid,
            inspay_url: inspayResponse.url,
            status: 'PROCESSING',
            updated_at: new Date().toISOString()
          })
          .eq('id', panService.id);

        if (updateError) {
          console.error('❌ Error updating PAN service:', updateError);
        } else {
          console.log('✅ PAN service record updated successfully');
        }

        return NextResponse.json({
          success: true,
          message: 'Payment debited successfully! Redirecting to complete your PAN correction. Complete within 24 hours to avoid auto-refund.',
          data: {
            id: panService.id,
            order_id: orderId,
            inspay_txid: inspayResponse.txid,
            inspay_url: inspayResponse.url,
            amount: config.price,
            commission_amount: (config.price * config.commission_rate) / 100,
            payment_debited: true,
            expires_at: expiresAt.toISOString()
          }
        });

      } else {
        console.log('❌ InsPay Error Response:', inspayResponse);

        console.log('💸 Processing refund due to InsPay error...');

        // Process immediate refund
        const { error: refundWalletError } = await supabaseAdmin
          .from('wallets')
          .update({
            balance: wallet.balance, // Restore original balance
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (!refundWalletError) {
          // Create refund transaction
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: user.id,
              wallet_id: wallet.id,
              type: 'REFUND',
              amount: config.price,
              status: 'COMPLETED',
              description: `PAN Service Refund - InsPay Error (${orderId})`,
              reference: orderId,
              metadata: {
                service_type: 'PAN_CORRECTION',
                pan_service_id: panService.id,
                reason: 'InsPay API error',
                original_error: inspayResponse.message
              }
            });

          console.log('✅ Refund processed successfully');
        }

        // Update PAN service with error and refund info
        await supabaseAdmin
          .from('pan_services')
          .update({
            status: 'FAILURE',
            payment_status: 'REFUNDED',
            refund_processed: true,
            refund_processed_at: new Date().toISOString(),
            error_message: inspayResponse.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', panService.id);

        return corsJsonResponse({
          success: false,
          message: `${inspayResponse.message || 'Failed to initiate PAN correction'}. Amount refunded to your wallet.`,
          refunded: true
        }, 400);
      }

    } catch (inspayError) {
      console.error('💥 InsPay API Exception:', inspayError);
      // ... same logic for refund ...
      return corsJsonResponse({
        success: false,
        message: 'Unable to connect to PAN service provider. Your payment has been refunded to your wallet.',
        refunded: true
      }, 500);
    }

  } catch (error) {
    console.error('Error in PAN correction API:', error);
    return corsJsonResponse({ success: false, message: 'Internal server error' }, 500);
  }
}

export const POST = withCors(handler);
