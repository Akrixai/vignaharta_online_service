import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { inspayService } from '@/lib/inspay';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access (only for specific retailer)
    if (session.user.email !== 'AkrixRetailerTest@gmail.com') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { mobile_number, mode } = body;

    if (!mobile_number || !mode) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return NextResponse.json({ success: false, message: 'Invalid mobile number' }, { status: 400 });
    }

    if (!['EKYC', 'ESIGN'].includes(mode)) {
      return NextResponse.json({ success: false, message: 'Invalid mode' }, { status: 400 });
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

    // Check wallet balance (but don't deduct yet - will deduct on success callback)
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', session.user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }

    if (wallet.balance < config.price) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient wallet balance. Required: ₹${config.price}. Please add money to your wallet first.` 
      }, { status: 400 });
    }

    // Generate order ID
    const orderId = inspayService.generateOrderId();

    // Create PAN service record
    const { data: panService, error: panServiceError } = await supabaseAdmin
      .from('pan_services')
      .insert({
        user_id: session.user.id,
        service_type: 'PAN_CORRECTION',
        mobile_number,
        mode,
        order_id: orderId,
        amount: config.price,
        commission_amount: (config.price * config.commission_rate) / 100,
        status: 'PENDING'
      })
      .select()
      .single();

    if (panServiceError) {
      console.error('Error creating PAN service record:', panServiceError);
      return NextResponse.json({ success: false, message: 'Failed to create service record' }, { status: 500 });
    }

    try {
      // Call InsPay API
      const inspayResponse = await inspayService.panCorrectionRequest({
        number: mobile_number,
        mode,
        orderid: orderId
      });

      if (inspayResponse.status === 'Success') {
        // Don't deduct money here - will be deducted on success callback
        // Just store the wallet balance check for later verification

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
          console.error('Error updating PAN service:', updateError);
        }

        return NextResponse.json({
          success: true,
          message: 'PAN correction initiated successfully',
          data: {
            id: panService.id,
            order_id: orderId,
            inspay_txid: inspayResponse.txid,
            inspay_url: inspayResponse.url,
            amount: config.price,
            commission_amount: (config.price * config.commission_rate) / 100
          }
        });

      } else {
        // Update PAN service with error
        await supabaseAdmin
          .from('pan_services')
          .update({
            status: 'FAILURE',
            error_message: inspayResponse.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', panService.id);

        return NextResponse.json({
          success: false,
          message: inspayResponse.message || 'Failed to initiate PAN correction'
        }, { status: 400 });
      }

    } catch (inspayError) {
      console.error('InsPay API error:', inspayError);
      
      // Update PAN service with error
      await supabaseAdmin
        .from('pan_services')
        .update({
          status: 'FAILURE',
          error_message: 'InsPay API error',
          updated_at: new Date().toISOString()
        })
        .eq('id', panService.id);

      return NextResponse.json({
        success: false,
        message: 'Failed to connect to PAN service provider'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in PAN correction API:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}