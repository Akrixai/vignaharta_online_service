import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PAN Services Status Check API
 * Uses InsPay status API to check pending PAN applications
 * 
 * POST /api/pan-services/check-status
 * Body: { order_id: string }
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking status for order:', order_id, 'by user:', session.user.email);

    // Find the PAN service
    const { data: panService, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select('*')
      .eq('order_id', order_id)
      .eq('user_id', session.user.id) // Ensure user can only check their own orders
      .single();

    if (findError || !panService) {
      return NextResponse.json(
        { success: false, message: 'PAN service not found or access denied' },
        { status: 404 }
      );
    }

    // Only allow status check for PENDING applications
    if (panService.status !== 'PENDING') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot check status for ${panService.status} applications. Status check is only available for PENDING applications.`,
          current_status: panService.status
        },
        { status: 400 }
      );
    }

    // Check if we have inspay_txid (required for status API)
    if (!panService.inspay_txid) {
      return NextResponse.json(
        { success: false, message: 'InsPay transaction ID not found. Cannot check status.' },
        { status: 400 }
      );
    }

    // Call InsPay status API
    const statusResult = await checkInspayStatus(panService.inspay_txid);

    if (!statusResult.success) {
      return NextResponse.json(
        { success: false, message: statusResult.error },
        { status: 500 }
      );
    }

    const statusData = statusResult.data;
    console.log('📊 InsPay status response:', statusData);

    // Process the status response
    const processResult = await processStatusResponse(panService, statusData, session.user.id);

    if (processResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Status updated successfully',
        data: {
          order_id: panService.order_id,
          old_status: 'PENDING',
          new_status: processResult.new_status,
          inspay_response: statusData,
          acknowledgement_number: processResult.acknowledgement_number,
          payment_charged: processResult.payment_charged
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: processResult.error },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Call InsPay status API
 */
async function checkInspayStatus(inspayTxid: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const username = process.env.INSPAY_USERNAME;
    const token = process.env.INSPAY_TOKEN;

    if (!username || !token) {
      throw new Error('InsPay credentials not configured');
    }

    const statusUrl = `https://www.connect.inspay.in/v3/recharge/status?username=${username}&token=${token}&orderid=${inspayTxid}&format=json`;

    console.log('🌐 Calling InsPay status API for txid:', inspayTxid);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'VignahartaOnlineServices/1.0',
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`InsPay API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 InsPay status response:', data);

    // Validate response structure
    if (!data.txid || !data.status) {
      throw new Error('Invalid response from InsPay status API');
    }

    return { success: true, data };

  } catch (error) {
    console.error('❌ InsPay status API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check status with InsPay' 
    };
  }
}

/**
 * Process status response and update database
 */
async function processStatusResponse(
  panService: any, 
  statusData: any, 
  userId: string
): Promise<{ success: boolean; new_status?: string; acknowledgement_number?: string; payment_charged?: boolean; error?: string }> {
  try {
    const { txid, status, opid, number, amount, orderid } = statusData;

    // Map InsPay status to our status
    const statusMap: { [key: string]: string } = {
      'Success': 'SUCCESS',
      'Failure': 'FAILURE',
      'Pending': 'PENDING'
    };

    const newStatus = statusMap[status] || 'PENDING';
    
    // If still pending, no update needed
    if (newStatus === 'PENDING') {
      return {
        success: true,
        new_status: 'PENDING',
        payment_charged: false
      };
    }

    console.log(`📊 Status update for ${panService.order_id}: PENDING → ${newStatus}`);

    // Prepare status data for logging
    const statusCheckData = {
      inspay_txid: txid,
      status: status,
      opid: opid,
      number: number,
      amount: amount,
      orderid: orderid,
      status_check_timestamp: new Date().toISOString(),
      checked_by_user: userId
    };

    // Preserve callback history
    let callbackHistory: any[] = [];
    if (Array.isArray(panService.callback_raw_data)) {
      callbackHistory = [...panService.callback_raw_data];
    } else if (panService.callback_raw_data && typeof panService.callback_raw_data === 'object') {
      callbackHistory = [panService.callback_raw_data];
    }
    callbackHistory.push(statusCheckData);

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      callback_data: statusCheckData,
      callback_raw_data: callbackHistory,
      webhook_received_at: new Date().toISOString(),
      callback_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_checked_by_user: true,
      status_check_timestamp: new Date().toISOString()
    };

    let acknowledgementNumber = null;
    let paymentCharged = false;

    // Set acknowledgement number for success, or error message for failure
    if (opid && opid.trim() !== '' && opid !== '0') {
      if (newStatus === 'SUCCESS') {
        updateData.acknowledgement_number = opid;
        acknowledgementNumber = opid;
        console.log('📋 Setting acknowledgement number:', opid, 'for order:', panService.order_id);
      } else {
        updateData.error_message = opid;
        console.log('📝 Setting error message:', opid, 'for order:', panService.order_id);
      }
    }

    // Set completion timestamp for final statuses
    if (newStatus === 'SUCCESS' || newStatus === 'FAILURE') {
      updateData.completed_at = new Date().toISOString();
    }

    // Handle status-specific logic
    if (newStatus === 'SUCCESS') {
      console.log('💰 Processing SUCCESS for PAN service:', panService.order_id);
      const paymentResult = await processSuccessfulPanApplication(panService, updateData);
      paymentCharged = paymentResult.charged;
    } else if (newStatus === 'FAILURE') {
      console.log('❌ Processing FAILURE for PAN service:', panService.order_id);
      await processFailedPanApplication(panService, updateData);
    }

    // Update the PAN service record
    const { error: updateError } = await supabaseAdmin
      .from('pan_services')
      .update(updateData)
      .eq('id', panService.id);

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      new_status: newStatus,
      acknowledgement_number: acknowledgementNumber,
      payment_charged: paymentCharged
    };

  } catch (error) {
    console.error('❌ Error in processStatusResponse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process successful PAN application (charge payment)
 */
async function processSuccessfulPanApplication(panService: any, updateData: any): Promise<{ charged: boolean }> {
  try {
    console.log('🔄 Starting payment processing for order:', panService.order_id);

    // Check if payment was already charged
    if (panService.payment_status === 'CHARGED') {
      console.log('💰 [SKIP] Payment already charged for:', panService.order_id);
      return { charged: false };
    }

    // Check for existing transaction
    const { data: existingTransaction } = await supabaseAdmin
      .from('transactions')
      .select('id, amount, status')
      .eq('reference', panService.order_id)
      .eq('type', 'WITHDRAWAL')
      .eq('status', 'COMPLETED')
      .maybeSingle();

    if (existingTransaction) {
      console.log('⚠️ [SKIP] Transaction already exists for:', panService.order_id);
      updateData.payment_status = 'CHARGED';
      updateData.payment_charged_at = new Date().toISOString();
      return { charged: false };
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', panService.user_id)
      .single();

    if (walletError || !wallet) {
      console.error('❌ [CRITICAL] Wallet not found for user:', panService.user_id);
      return { charged: false };
    }

    const amountToCharge = parseFloat(panService.amount || '0');
    if (amountToCharge <= 0) {
      console.log('⚠️ [SKIP] No amount to charge for PAN service:', panService.order_id);
      return { charged: false };
    }

    // Deduct payment
    const currentBalance = parseFloat(wallet.balance.toString());
    const newBalance = currentBalance - amountToCharge;

    console.log(`💸 Charging ₹${amountToCharge} from wallet (Status Check)`);

    // Update wallet balance
    const { error: balanceUpdateError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (balanceUpdateError) {
      console.error('❌ [CRITICAL] Failed to update wallet balance:', balanceUpdateError);
      throw balanceUpdateError;
    }

    // Record transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: panService.user_id,
        wallet_id: wallet.id,
        type: 'WITHDRAWAL',
        amount: amountToCharge,
        status: 'COMPLETED',
        description: `Payment for ${getServiceTypeName(panService.service_type)} application - ${panService.order_id} (Status Check)`,
        reference: panService.order_id,
        metadata: {
          pan_service_id: panService.id,
          service_type: panService.service_type,
          mobile_number: panService.mobile_number,
          payment_mode: panService.mode,
          acknowledgement_number: updateData.acknowledgement_number,
          previous_balance: currentBalance,
          new_balance: newBalance,
          status_check_payment: true
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ [CRITICAL] Failed to create transaction record:', transactionError);
    } else {
      console.log('✅ [TRANSACTION] Status check transaction record created:', transaction?.id);
    }

    // Update payment status
    updateData.payment_status = 'CHARGED';
    updateData.payment_charged_at = new Date().toISOString();

    console.log('✅ [SUCCESS] Status check payment processing completed for:', panService.order_id);
    return { charged: true };

  } catch (error) {
    console.error('❌ [ERROR] Exception in processSuccessfulPanApplication (status check):', error);
    return { charged: false };
  }
}

/**
 * Process failed PAN application
 */
async function processFailedPanApplication(panService: any, updateData: any) {
  try {
    if (panService.payment_status === 'RESERVED') {
      updateData.payment_status = 'CANCELLED';
      console.log('🔓 Payment reservation released for failed application:', panService.order_id);
    }

    console.log('✅ Failed PAN application status check completed:', panService.order_id);

  } catch (error) {
    console.error('❌ Error in processFailedPanApplication (status check):', error);
  }
}

function getServiceTypeName(serviceType: string): string {
  const names = {
    'NEW_PAN': 'New PAN',
    'PAN_CORRECTION': 'PAN Correction',
    'INCOMPLETE_PAN': 'Incomplete PAN'
  };
  return names[serviceType as keyof typeof names] || serviceType;
}