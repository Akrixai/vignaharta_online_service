import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txid = searchParams.get('txid');
    const status = searchParams.get('status');
    const opid = searchParams.get('opid');

    console.log('PAN Callback received:', { txid, status, opid });

    if (!txid || !status) {
      return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 });
    }

    // Find the PAN service record by inspay_txid
    const { data: panService, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select('*')
      .eq('inspay_txid', txid)
      .single();

    if (findError || !panService) {
      console.error('PAN service not found for txid:', txid, findError);
      return NextResponse.json({ success: false, message: 'PAN service record not found' }, { status: 404 });
    }

    // Update the PAN service status based on callback
    let newStatus: string;
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status.toLowerCase() === 'success') {
      newStatus = 'SUCCESS';
      updateData.status = newStatus;
      
      if (opid) {
        updateData.inspay_opid = opid;
      }

      // Get user's wallet for payment processing
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', panService.user_id)
        .single();

      if (!walletError && wallet) {
        // Check if user has sufficient balance
        if (wallet.balance >= panService.amount) {
          // Deduct service amount from wallet
          const newBalance = wallet.balance - panService.amount + panService.commission_amount;
          
          const { error: walletUpdateError } = await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', panService.user_id);

          if (!walletUpdateError) {
            // Create service charge transaction record
            await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: panService.user_id,
                wallet_id: wallet.id,
                type: 'WITHDRAWAL',
                amount: -panService.amount,
                status: 'COMPLETED',
                description: `PAN Service Charge - ${panService.service_type} (${panService.order_id})`,
                reference: panService.order_id,
                metadata: {
                  service_type: panService.service_type,
                  pan_service_id: panService.id,
                  inspay_txid: txid,
                  inspay_opid: opid
                }
              });

            // Create commission transaction record if there's commission
            if (panService.commission_amount > 0) {
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
            }
          } else {
            console.error('Error updating wallet balance:', walletUpdateError);
            // Mark as failed if we can't process payment
            newStatus = 'FAILURE';
            updateData.status = newStatus;
            updateData.error_message = 'Failed to process payment from wallet';
          }
        } else {
          console.error('Insufficient wallet balance for PAN service:', panService.user_id);
          // Mark as failed if insufficient balance
          newStatus = 'FAILURE';
          updateData.status = newStatus;
          updateData.error_message = `Insufficient wallet balance. Required: ₹${panService.amount}`;
        }
      } else {
        console.error('Wallet not found for user:', panService.user_id);
        // Mark as failed if wallet not found
        newStatus = 'FAILURE';
        updateData.status = newStatus;
        updateData.error_message = 'Wallet not found';
      }
    } else {
      newStatus = 'FAILURE';
      updateData.status = newStatus;
      updateData.error_message = `Transaction failed with status: ${status}`;
    }

    // Update the PAN service record
    const { error: updateError } = await supabaseAdmin
      .from('pan_services')
      .update(updateData)
      .eq('id', panService.id);

    if (updateError) {
      console.error('Error updating PAN service:', updateError);
      return NextResponse.json({ success: false, message: 'Failed to update PAN service' }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `PAN service ${newStatus.toLowerCase()} callback processed`,
      data: {
        txid,
        status: newStatus,
        opid,
        order_id: panService.order_id,
        service_type: panService.service_type
      }
    });

  } catch (error) {
    console.error('Error in PAN callback API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Handle POST callbacks as well (some providers send POST)
  return GET(request);
}