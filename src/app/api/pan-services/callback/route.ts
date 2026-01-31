import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * InsPay PAN Services Callback Endpoint
 * Handles callbacks from InsPay for PAN card applications
 * 
 * InsPay Callback Format (GET request):
 * ?txid=53617270&status=Success&opid=ACK123456789
 * 
 * Status values:
 * - Success: Application completed successfully
 * - Failure: Application failed
 * - Pending: Application is still being processed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');
    const status = searchParams.get('status');
    const opid = searchParams.get('opid');

    // Log the callback for debugging
    const callbackData = {
      txid,
      status,
      opid,
      method: 'GET',
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '::1',
      user_agent: request.headers.get('user-agent') || 'Unknown',
      received_at: new Date().toISOString(),
      search_params: Object.fromEntries(searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries())
    };

    console.log('📞 InsPay PAN Callback received:', callbackData);

    // Validate required parameters
    if (!txid || !status) {
      console.error('❌ Missing required callback parameters:', { txid, status, opid });
      return NextResponse.json(
        { success: false, message: 'Missing required callback parameters (txid, status)' },
        { status: 400 }
      );
    }

    // Find PAN service by order_id (InsPay sends order_id as txid parameter)
    let panService = null;
    let findError = null;

    // First try to find by order_id (most common case)
    const { data: panServiceByOrderId, error: orderIdError } = await supabase
      .from('pan_services')
      .select('*, user:users!pan_services_user_id_fkey(id, email, name, role)')
      .eq('order_id', txid)
      .single();

    if (panServiceByOrderId) {
      panService = panServiceByOrderId;
      console.log('✅ Found PAN service by order_id:', panService.order_id, 'for txid:', txid);
    } else {
      // Fallback: try to find by inspay_txid
      const { data: panServiceByInspayTxid, error: inspayTxidError } = await supabase
        .from('pan_services')
        .select('*, user:users!pan_services_user_id_fkey(id, email, name, role)')
        .eq('inspay_txid', txid)
        .single();

      if (panServiceByInspayTxid) {
        panService = panServiceByInspayTxid;
        console.log('✅ Found PAN service by inspay_txid:', panService.order_id, 'for txid:', txid);
      } else {
        findError = orderIdError || inspayTxidError;
      }
    }

    if (!panService) {
      console.error('❌ PAN service not found for txid:', txid, 'Errors:', { orderIdError, inspayTxidError: findError });
      
      // Log this as a potential callback failure for investigation
      try {
        await supabase
          .from('callback_failures')
          .insert({
            pan_service_id: null, // We don't have the service ID
            order_id: txid,
            callback_data: callbackData,
            failure_reason: `PAN service record not found for transaction ID: ${txid}`,
            retry_count: 0,
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Failed to log callback failure:', logError);
      }
      
      return NextResponse.json(
        { success: false, message: 'PAN service not found for transaction ID: ' + txid },
        { status: 404 }
      );
    }

    console.log('✅ Found PAN service:', panService.order_id, 'for callback txid:', txid);

    // Map InsPay status to our status
    const statusMap: { [key: string]: string } = {
      'Success': 'SUCCESS',
      'Failure': 'FAILURE',
      'Pending': 'PENDING',
      'Failed': 'FAILURE'
    };

    const newStatus = statusMap[status] || 'PENDING';
    const previousStatus = panService.status;

    console.log(`📊 Status change for ${panService.order_id}: ${previousStatus} → ${newStatus}`);

    // Preserve callback history in callback_raw_data
    let callbackHistory: any[] = [];
    if (Array.isArray(panService.callback_raw_data)) {
      callbackHistory = [...panService.callback_raw_data];
    } else if (panService.callback_raw_data && typeof panService.callback_raw_data === 'object' && Object.keys(panService.callback_raw_data).length > 0) {
      callbackHistory = [panService.callback_raw_data];
    }
    callbackHistory.push(callbackData);

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      callback_data: callbackData,
      callback_raw_data: callbackHistory,
      webhook_received_at: new Date().toISOString(),
      callback_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Set acknowledgement number for success, or message for pending/failure
    if (opid && opid.trim() !== '' && opid !== 'Order is under process') {
      if (newStatus === 'SUCCESS') {
        updateData.acknowledgement_number = opid;
        console.log('📋 Setting acknowledgement number:', opid, 'for order:', panService.order_id);
      } else {
        // For PENDING/FAILURE, store opid as error_message for display
        updateData.error_message = opid;
        console.log('📝 Setting status message:', opid, 'for order:', panService.order_id);
      }
    } else {
      console.log('⏳ Received callback status for order:', panService.order_id, 'with no message');
    }

    // Set completion timestamp for final statuses
    if (newStatus === 'SUCCESS' || newStatus === 'FAILURE') {
      updateData.completed_at = new Date().toISOString();
    }

    // Handle status-specific logic
    if (newStatus === 'SUCCESS' && previousStatus !== 'SUCCESS') {
      console.log('💰 Processing SUCCESS for PAN service:', panService.order_id);
      await processSuccessfulPanApplication(panService, updateData);
    } else if (newStatus === 'FAILURE' && previousStatus !== 'FAILURE') {
      console.log('❌ Processing FAILURE for PAN service:', panService.order_id);
      await processFailedPanApplication(panService, updateData);
    }

    // Update the PAN service record with immediate timestamp
    const { error: updateError } = await supabase
      .from('pan_services')
      .update({
        ...updateData,
        // Ensure updated_at is set to trigger real-time updates
        updated_at: new Date().toISOString()
      })
      .eq('id', panService.id);

    if (updateError) {
      console.error('❌ Failed to update PAN service:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update PAN service record' },
        { status: 500 }
      );
    }

    console.log('✅ PAN service updated successfully:', panService.order_id, 'Status:', newStatus);

    // Log the successful callback processing for debugging
    console.log('📊 Callback Summary:', {
      order_id: panService.order_id,
      user_id: panService.user_id,
      old_status: previousStatus,
      new_status: newStatus,
      payment_status: updateData.payment_status || panService.payment_status,
      acknowledgement_number: updateData.acknowledgement_number,
      callback_time: callbackData.received_at
    });

    return NextResponse.json({
      success: true,
      message: 'Callback processed successfully',
      order_id: panService.order_id,
      status: newStatus,
      txid: txid,
      opid: opid
    });

  } catch (error: any) {
    console.error('❌ PAN Callback API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process successful PAN application
 * - Charge payment from wallet
 * - Record transaction
 */
async function processSuccessfulPanApplication(panService: any, updateData: any) {
  try {
    const user = panService.user;
    if (!user) {
      console.error('❌ [CRITICAL] No user found for PAN service:', panService.id);
      return;
    }

    console.log('🔄 [PAYMENT] Starting payment processing for order:', panService.order_id);
    console.log('📊 [PAYMENT] Current payment_status:', panService.payment_status);

    // Check if payment was already charged to avoid double deduction
    if (panService.payment_status === 'CHARGED') {
      console.log('💰 [SKIP] Payment already charged for:', panService.order_id, '- Skipping deduction');
      return;
    }

    // Additional safety check: verify no existing WITHDRAWAL transaction exists
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id, amount, status')
      .eq('reference', panService.order_id)
      .eq('type', 'WITHDRAWAL')
      .eq('status', 'COMPLETED')
      .maybeSingle();

    if (existingTransaction) {
      console.log('⚠️ [SKIP] Withdrawal transaction already exists for:', panService.order_id, '- Marking as CHARGED');
      updateData.payment_status = 'CHARGED';
      updateData.payment_charged_at = new Date().toISOString();
      return;
    }

    console.log('✅ [PAYMENT] No existing transaction found - proceeding with deduction');

    // Get current wallet balance - ALWAYS fetch fresh balance before update
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', panService.user_id)
      .single();

    if (walletError || !wallet) {
      console.error('❌ [CRITICAL] Wallet not found for user:', panService.user_id, 'Error:', walletError);
      // Log to a separate error tracking table or file
      await logCriticalError('WALLET_NOT_FOUND', {
        order_id: panService.order_id,
        user_id: panService.user_id,
        error: walletError
      });
      return;
    }

    console.log('💰 [WALLET] Found wallet:', wallet.id, 'Current balance:', wallet.balance);

    const amountToCharge = parseFloat(panService.amount || '0');
    if (amountToCharge <= 0) {
      console.log('⚠️ [SKIP] No amount to charge for PAN service:', panService.order_id);
      return;
    }

    // Deduct payment from wallet
    const currentBalance = parseFloat(wallet.balance.toString());
    const newBalance = currentBalance - amountToCharge;

    console.log(`💸 [DEDUCTION] Charging ₹${amountToCharge} from wallet`);
    console.log(`💸 [DEDUCTION] Balance change: ₹${currentBalance} -> ₹${newBalance}`);

    // Update wallet balance
    const { error: balanceUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (balanceUpdateError) {
      console.error('❌ [CRITICAL] Failed to update wallet balance:', balanceUpdateError);
      await logCriticalError('WALLET_UPDATE_FAILED', {
        order_id: panService.order_id,
        wallet_id: wallet.id,
        amount: amountToCharge,
        error: balanceUpdateError
      });
      throw balanceUpdateError;
    }

    console.log('✅ [WALLET] Balance updated successfully');

    // Record formal withdrawal transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: panService.user_id,
        wallet_id: wallet.id,
        type: 'WITHDRAWAL',
        amount: amountToCharge,
        status: 'COMPLETED',
        description: `Payment for ${getServiceTypeName(panService.service_type)} application - ${panService.order_id}`,
        reference: panService.order_id,
        metadata: {
          pan_service_id: panService.id,
          service_type: panService.service_type,
          mobile_number: panService.mobile_number,
          payment_mode: panService.mode,
          acknowledgement_number: updateData.acknowledgement_number,
          previous_balance: currentBalance,
          new_balance: newBalance
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ [CRITICAL] Failed to create transaction record:', transactionError);
      // This is critical - wallet was debited but transaction wasn't recorded
      await logCriticalError('TRANSACTION_INSERT_FAILED', {
        order_id: panService.order_id,
        wallet_id: wallet.id,
        amount: amountToCharge,
        error: transactionError,
        note: 'WALLET WAS DEBITED BUT TRANSACTION RECORD FAILED'
      });
      // Don't throw - wallet was already debited
    } else {
      console.log('✅ [TRANSACTION] Transaction record created:', transaction?.id);
    }

    // Update payment status for the main PAN service record
    updateData.payment_status = 'CHARGED';
    updateData.payment_charged_at = new Date().toISOString();

    console.log('✅ [SUCCESS] Payment processing completed for:', panService.order_id);
    console.log('📊 [SUMMARY] Amount: ₹' + amountToCharge + ', New Balance: ₹' + newBalance);

  } catch (error) {
    console.error('❌ [ERROR] Exception in processSuccessfulPanApplication:', error);
    await logCriticalError('PAYMENT_PROCESSING_EXCEPTION', {
      order_id: panService.order_id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Log critical errors for monitoring and debugging
 */
async function logCriticalError(errorType: string, details: any) {
  try {
    console.error('🚨 [CRITICAL ERROR]', errorType, JSON.stringify(details, null, 2));
    // You could also insert into a dedicated error_logs table if needed
  } catch (e) {
    console.error('Failed to log critical error:', e);
  }
}

/**
 * Process failed PAN application
 * - Release reserved payment
 * - Update status
 */
async function processFailedPanApplication(panService: any, updateData: any) {
  try {
    // If payment was reserved but not charged, release it by marking as CANCELLED
    if (panService.payment_status === 'RESERVED') {
      updateData.payment_status = 'CANCELLED';
      console.log('🔓 Payment reservation released (marked CANCELLED) for failed application:', panService.order_id);
    }

    // If payment was already debited (older system/legacy), process refund
    if (panService.payment_status === 'DEBITED' && !panService.refund_processed) {
      await processRefund(panService);
      updateData.refund_processed = true;
      updateData.refund_processed_at = new Date().toISOString();
      updateData.payment_status = 'REFUNDED';
    }

    console.log('✅ Failed PAN application status handling completed:', panService.order_id);

  } catch (error) {
    console.error('❌ Error in processFailedPanApplication:', error);
  }
}

/**
 * Process refund for failed applications
 */
async function processRefund(panService: any) {
  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', panService.user_id)
      .single();

    if (!wallet) return;

    const refundAmount = parseFloat(panService.amount);

    // Add refund to wallet
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + refundAmount })
      .eq('user_id', panService.user_id);

    // Record refund transaction
    const { data: refundTransaction } = await supabase
      .from('transactions')
      .insert({
        user_id: panService.user_id,
        wallet_id: wallet.id,
        type: 'REFUND',
        amount: refundAmount,
        status: 'COMPLETED',
        description: `Refund for failed ${panService.service_type} - ${panService.order_id}`,
        reference: panService.order_id,
        metadata: {
          pan_service_id: panService.id,
          service_type: panService.service_type,
          reason: 'Application failed'
        }
      })
      .select()
      .single();

    // Update PAN service with refund transaction reference
    if (refundTransaction) {
      await supabase
        .from('pan_services')
        .update({ refund_transaction_id: refundTransaction.id })
        .eq('id', panService.id);
    }

    console.log('💸 Refund processed:', refundAmount, 'for:', panService.order_id);

  } catch (error) {
    console.error('❌ Error processing refund:', error);
  }
}

// POST endpoint for testing
export async function POST(request: NextRequest) {
  return GET(request);
}

function getServiceTypeName(serviceType: string): string {
  const names = {
    'NEW_PAN': 'New PAN',
    'PAN_CORRECTION': 'PAN Correction',
    'INCOMPLETE_PAN': 'Incomplete PAN'
  };
  return names[serviceType as keyof typeof names] || serviceType;
}