import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');
    const status = searchParams.get('status');
    const opid = searchParams.get('opid');

    console.log('📞 PAN Callback received:', { 
      txid, 
      status, 
      opid, 
      timestamp: new Date().toISOString(),
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    if (!txid || !status) {
      console.error('❌ Missing required callback parameters');
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters (txid, status)'
      }, { status: 400 });
    }

    // Find PAN service by inspay_txid
    const { data: panService, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select('*')
      .eq('inspay_txid', txid)
      .single();

    if (findError || !panService) {
      console.error('❌ PAN service not found for txid:', txid, findError);
      return NextResponse.json({
        success: false,
        message: 'PAN service record not found',
        txid: txid
      }, { status: 404 });
    }

    console.log('📋 Found PAN service:', {
      id: panService.id,
      order_id: panService.order_id,
      current_status: panService.status,
      payment_status: panService.payment_status,
      service_type: panService.service_type
    });

    // Store complete callback data for audit trail
    const callbackTimestamp = new Date().toISOString();
    const callbackData = {
      txid,
      status,
      opid,
      received_at: callbackTimestamp,
      url: request.url,
      method: request.method,
      user_agent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    };

    const updateData: any = {
      webhook_received_at: callbackTimestamp,
      callback_processed_at: callbackTimestamp,
      callback_data: callbackData,
      callback_raw_data: {
        ...callbackData,
        headers: Object.fromEntries(request.headers.entries()),
        search_params: Object.fromEntries(searchParams.entries())
      },
      updated_at: callbackTimestamp
    };

    // Store opid as acknowledgement number for tracking (if valid)
    if (opid && opid !== 'Order is under process' && opid.trim() !== '') {
      updateData.inspay_opid = opid;
      updateData.acknowledgement_number = opid;
    }

    // Handle different callback statuses
    const callbackStatus = status.toLowerCase();
    
    if (callbackStatus === 'success') {
      console.log('✅ Processing SUCCESS callback - Application completed successfully');
      
      updateData.status = 'SUCCESS';
      updateData.completed_at = callbackTimestamp;
      updateData.receipt_generated = false; // Will be generated on demand

      // DEDUCT MONEY ONLY ON SUCCESS
      if (panService.payment_status === 'RESERVED' && !panService.commission_processed) {
        console.log(`💳 Processing payment deduction: ₹${panService.amount}`);

        // Get current wallet
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('user_id', panService.user_id)
          .single();

        if (wallet && wallet.balance >= panService.amount) {
          const newBalance = wallet.balance - panService.amount;

          // Deduct the amount
          const { error: deductError } = await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: callbackTimestamp
            })
            .eq('user_id', panService.user_id);

          if (!deductError) {
            console.log(`✅ Payment deducted successfully. New balance: ₹${newBalance}`);

            // Create transaction record
            const { data: transaction } = await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: panService.user_id,
                wallet_id: wallet.id,
                type: 'WITHDRAWAL',
                amount: -panService.amount,
                status: 'COMPLETED',
                description: `PAN Service Payment - ${panService.service_type} Completed (${panService.order_id})`,
                reference: panService.order_id,
                metadata: {
                  service_type: panService.service_type,
                  pan_service_id: panService.id,
                  inspay_txid: txid,
                  inspay_opid: opid,
                  acknowledgement_number: opid,
                  mobile_number: panService.mobile_number,
                  mode: panService.mode,
                  payment_type: 'post_success_deduction',
                  callback_timestamp: callbackTimestamp,
                  callback_status: status
                }
              })
              .select()
              .single();

            updateData.payment_status = 'CHARGED';
            updateData.payment_charged_at = callbackTimestamp;
            updateData.commission_processed = true;
            updateData.commission_processed_at = callbackTimestamp;

            console.log('✅ Payment transaction created:', transaction?.id);
          } else {
            console.error('❌ Error deducting payment on success:', deductError);
            updateData.error_message = 'Payment deduction failed after success. Please contact support.';
          }
        } else {
          console.error('❌ Insufficient balance for payment deduction:', {
            required: panService.amount,
            available: wallet?.balance || 0
          });
          updateData.error_message = 'Insufficient balance for payment deduction. Please contact support.';
        }
      } else {
        console.log('ℹ️ Payment already processed or not in RESERVED status');
      }
    }
    else if (callbackStatus === 'pending') {
      console.log('⏳ Processing PENDING callback - Application still in progress');
      
      updateData.status = 'PROCESSING';
      // Keep payment_status as RESERVED - no money action needed
      // Application is still being processed by InsPay
      
      console.log('ℹ️ Application status updated to PROCESSING, waiting for final status');
    }
    else if (callbackStatus === 'failure' || callbackStatus === 'failed') {
      console.log(`❌ Processing ${status.toUpperCase()} callback - Application failed`);

      updateData.status = 'FAILURE';
      updateData.completed_at = callbackTimestamp;
      updateData.error_message = `Application failed with status: ${status}`;

      // For RESERVED payments, no refund needed since money was never deducted
      if (panService.payment_status === 'RESERVED') {
        console.log('ℹ️ No refund needed - payment was only reserved, never deducted');
        updateData.payment_status = 'CANCELLED';
      }
      // Handle legacy DEBITED payments (old flow) - still need refund
      else if (panService.payment_status === 'DEBITED' && !panService.refund_processed) {
        console.log(`💸 Processing refund for legacy payment: ₹${panService.amount}`);

        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('user_id', panService.user_id)
          .single();

        if (wallet) {
          const newBalance = wallet.balance + panService.amount;

          // Refund the amount
          const { error: refundWalletError } = await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: callbackTimestamp
            })
            .eq('user_id', panService.user_id);

          if (!refundWalletError) {
            console.log(`✅ Refund processed. New balance: ₹${newBalance}`);

            // Create refund transaction
            const { data: refundTransaction } = await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: panService.user_id,
                wallet_id: wallet.id,
                type: 'REFUND',
                amount: panService.amount,
                status: 'COMPLETED',
                description: `PAN Service Refund - ${panService.service_type} Failed (${panService.order_id})`,
                reference: panService.order_id,
                metadata: {
                  service_type: panService.service_type,
                  pan_service_id: panService.id,
                  inspay_txid: txid,
                  inspay_opid: opid,
                  acknowledgement_number: opid,
                  reason: 'Application failed',
                  webhook_status: status,
                  callback_timestamp: callbackTimestamp
                }
              })
              .select()
              .single();

            updateData.payment_status = 'REFUNDED';
            updateData.refund_processed = true;
            updateData.refund_processed_at = callbackTimestamp;
            updateData.refund_transaction_id = refundTransaction?.id;

            console.log('✅ Refund transaction created:', refundTransaction?.id);
          } else {
            console.error('❌ Error processing refund:', refundWalletError);
            updateData.error_message = 'Refund processing failed. Please contact support.';
          }
        } else {
          console.error('❌ Wallet not found for refund:', panService.user_id);
          updateData.error_message = 'Wallet not found for refund. Please contact support.';
        }
      } else {
        console.log('ℹ️ No refund needed - payment_status:', panService.payment_status, 'refund_processed:', panService.refund_processed);
      }
    }
    else {
      // Handle unknown status
      console.log(`⚠️ Processing UNKNOWN status: ${status} - treating as pending`);
      updateData.status = 'PROCESSING';
      updateData.error_message = `Unknown callback status received: ${status}`;
    }

    // Update PAN service record
    const { error: updateError } = await supabaseAdmin
      .from('pan_services')
      .update(updateData)
      .eq('id', panService.id);

    if (updateError) {
      console.error('❌ Error updating PAN service:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Failed to update PAN service record'
      }, { status: 500 });
    }

    console.log('✅ Callback processed successfully:', {
      order_id: panService.order_id,
      old_status: panService.status,
      new_status: updateData.status,
      payment_status: updateData.payment_status,
      acknowledgement_number: updateData.acknowledgement_number,
      callback_status: status
    });

    return NextResponse.json({
      success: true,
      message: `PAN service ${updateData.status} processed successfully`,
      data: {
        txid,
        status: updateData.status,
        order_id: panService.order_id,
        service_type: panService.service_type,
        payment_status: updateData.payment_status,
        acknowledgement_number: updateData.acknowledgement_number,
        callback_processed_at: callbackTimestamp
      }
    });

  } catch (error) {
    console.error('💥 Error in PAN callback:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle POST callbacks as well (some providers send POST)
export async function POST(request: NextRequest) {
  return GET(request);
}
