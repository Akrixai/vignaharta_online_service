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

    console.log(`👤 User ${user.email} (Role: ${user.role}) is resuming INCOMPLETE_PAN`);

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

    const { existing_order_id } = body;
    const order_id = existing_order_id;
    console.log('📦 Request body:', body);

    if (!order_id) {
      return corsJsonResponse({ success: false, message: 'Existing order ID is required' }, 400);
    }

    // Get configuration for incomplete PAN (usually free or minimal cost)
    const { data: config, error: configError } = await supabaseAdmin
      .from('pan_commission_config')
      .select('*')
      .eq('service_type', 'INCOMPLETE_PAN')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json({ success: false, message: 'Service configuration not found' }, { status: 404 });
    }

    // Check wallet balance (but don't deduct yet - will deduct on success callback)
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }

    if (wallet.balance < config.price) {
      return corsJsonResponse({
        success: false,
        message: `Insufficient wallet balance. Required: ₹${config.price}. Please add money to your wallet first.`
      }, 400);
    }

    // Create PAN service record
    const { data: panService, error: panServiceError } = await supabaseAdmin
      .from('pan_services')
      .insert({
        user_id: user.id,
        service_type: 'INCOMPLETE_PAN',
        order_id: order_id,
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
      const inspayResponse = await inspayService.incompletePanRequest({
        orderid: order_id
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
          message: 'Incomplete PAN application resumed successfully',
          data: {
            id: panService.id,
            order_id: order_id,
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

        return corsJsonResponse({
          success: false,
          message: inspayResponse.message || 'Failed to resume incomplete PAN application'
        }, 400);
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

      return corsJsonResponse({
        success: false,
        message: 'Failed to connect to PAN service provider'
      }, 500);
    }

  } catch (error) {
    console.error('Error in incomplete PAN API:', error);
    return corsJsonResponse({ success: false, message: 'Internal server error' }, 500);
  }
}

export const POST = withCors(handler);