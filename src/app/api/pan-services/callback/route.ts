import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');
    const status = searchParams.get('status');
    const opid = searchParams.get('opid');

    console.log('📞 PAN Webhook received:', { txid, status, opid, timestamp: new Date().toISOString() });

    if (!txid || !status) {
      console.error('❌ Missing required webhook parameters');
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters'
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
        message: 'PAN service record not found'
      }, { status: 404 });
    }

    console.log('📋 Found PAN service:', {
      id: panService.id,
      order_id: panService.order_id,
      current_status: panService.status,
      payment_status: panService.payment_status,
      service_type: panService.service_type
    });

    // Prevent duplicate webhook processing
    if (panService.status !== 'PENDING' && panService.status !== 'PROCESSING') {
      console.log('⚠️ Webhook already processed for txid:', txid, 'Current status:', panService.status);
      return NextResponse.json({
        success: true,
        message: 'Webhook already processed',
        data: {
          order_id: panService.order_id,
          status: panService.status
        }
      });
    }

    const updateData: any = {
      webhook_received_at: new Date().toISOString(),
      callback_data: {
        txid,
        status,
        opid,
        received_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    if (opid) {
      updateData.inspay_opid = opid;
    }

    // Handle SUCCESS (case-insensitive)
    if (status.toLowerCase() === 'success') {
      console.log('✅ Processing SUCCESS webhook - Deducting payment now');

      updateData.status = 'SUCCESS';
      updateData.completed_at = new Date().toISOString();

      // DEDUCT MONEY ONLY NOW (on success)
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
              updated_at: new Date().toISOString()
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
                  mobile_number: panService.mobile_number,
                  mode: panService.mode,
                  payment_type: 'post_success_deduction'
                }
              })
              .select()
              .single();

            updateData.payment_status = 'CHARGED';
            updateData.payment_charged_at = new Date().toISOString();
            updateData.commission_processed = true;
            updateData.commission_processed_at = new Date().toISOString();

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
    // Handle PENDING (case-insensitive)
    else if (status.toLowerCase() === 'pending') {
      console.log('⏳ Processing PENDING webhook - No payment action needed');
      updateData.status = 'PENDING';
      // Keep payment_status as RESERVED - no money deducted yet
    }
    // Handle FAILURE (case-insensitive) - includes any status that's not Success or Pending
    else {
      console.log(`❌ Processing ${status.toUpperCase()} webhook - No payment deduction needed`);

      updateData.status = 'FAILURE';
      updateData.completed_at = new Date().toISOString();
      updateData.error_message = `Transaction failed with status: ${status}`;

      // For RESERVED payments, no refund needed since money was never deducted
      if (panService.payment_status === 'RESERVED') {
        console.log('ℹ️ No refund needed - payment was only reserved, never deducted');
        updateData.payment_status = 'CANCELLED'; // New status for cancelled reservations
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
              updated_at: new Date().toISOString()
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
                  reason: 'Service failed',
                  webhook_status: status
                }
              })
              .select()
              .single();

            updateData.payment_status = 'REFUNDED';
            updateData.refund_processed = true;
            updateData.refund_processed_at = new Date().toISOString();
            updateData.refund_transaction_id = refundTransaction?.id;

            console.log('✅ Refund transaction created:', refundTransaction?.id);
          } else {
            console.error('❌ Error processing refund:', refundWalletError);
          }
        } else {
          console.error('❌ Wallet not found for refund:', panService.user_id);
        }
      } else {
        console.log('ℹ️ No refund needed - payment_status:', panService.payment_status, 'refund_processed:', panService.refund_processed);
      }
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
        message: 'Failed to update PAN service'
      }, { status: 500 });
    }

    console.log('✅ Webhook processed successfully:', {
      order_id: panService.order_id,
      new_status: updateData.status,
      refund_processed: updateData.refund_processed || false
    });

    return NextResponse.json({
      success: true,
      message: `PAN service ${updateData.status} processed`,
      data: {
        txid,
        status: updateData.status,
        order_id: panService.order_id,
        service_type: panService.service_type,
        refund_processed: updateData.refund_processed || false
      }
    });

  } catch (error) {
    console.error('💥 Error in PAN webhook:', error);
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
