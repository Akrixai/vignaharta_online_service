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

    // Handle SUCCESS
    if (status.toLowerCase() === 'success') {
      console.log('✅ Processing SUCCESS webhook');
      
      updateData.status = 'SUCCESS';
      updateData.completed_at = new Date().toISOString();
      
      // Add commission to wallet
      if (panService.commission_amount > 0) {
        console.log(`💰 Adding commission: ₹${panService.commission_amount}`);
        
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('user_id', panService.user_id)
          .single();

        if (wallet) {
          const newBalance = wallet.balance + panService.commission_amount;
          
          const { error: walletUpdateError } = await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', panService.user_id);

          if (!walletUpdateError) {
            console.log(`✅ Commission added. New balance: ₹${newBalance}`);
            
            // Create commission transaction
            await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: panService.user_id,
                wallet_id: wallet.id,
                type: 'COMMISSION',
                amount: panService.commission_amount,
                status: 'COMPLETED',
                description: `PAN Service Commission - ${panService.service_type} (${panService.order_id})`,
                reference: panService.order_id,
                metadata: {
                  service_type: panService.service_type,
                  pan_service_id: panService.id,
                  inspay_txid: txid,
                  inspay_opid: opid
                }
              });
            
            console.log('✅ Commission transaction created');
          } else {
            console.error('❌ Error updating wallet for commission:', walletUpdateError);
          }
        } else {
          console.error('❌ Wallet not found for user:', panService.user_id);
        }
      }
    } 
    // Handle FAILURE
    else {
      console.log('❌ Processing FAILURE webhook - Initiating refund');
      
      updateData.status = 'FAILURE';
      updateData.completed_at = new Date().toISOString();
      updateData.error_message = `Transaction failed with status: ${status}`;
      
      // Process refund only if payment was debited
      if (panService.payment_status === 'DEBITED' && !panService.refund_processed) {
        console.log(`💸 Processing refund: ₹${panService.amount}`);
        
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
        console.log('ℹ️ Refund not needed - payment_status:', panService.payment_status, 'refund_processed:', panService.refund_processed);
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
        refund_processed: updateData.refund_processed || false,
        commission_added: status.toLowerCase() === 'success' && panService.commission_amount > 0
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
