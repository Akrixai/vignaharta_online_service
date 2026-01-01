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

    // Get configuration for incomplete PAN
    const { data: config, error: configError } = await supabaseAdmin
      .from('pan_commission_config')
      .select('*')
      .eq('service_type', 'INCOMPLETE_PAN')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json({ success: false, message: 'Service configuration not found' }, { status: 404 });
    }

    // Check wallet balance
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

    try {
      console.log('🔄 Calling InsPay API (Balance Reserved - No Deduction Yet) for Incomplete PAN...');

      // First, try to find existing PAN service record
      const { data: existingService, error: findError } = await supabaseAdmin
        .from('pan_services')
        .select('*')
        .eq('order_id', order_id)
        .eq('user_id', user.id)
        .single();

      if (findError || !existingService) {
        console.error('❌ Existing PAN service not found for order_id:', order_id);
        return corsJsonResponse({
          success: false,
          message: 'Original PAN application not found. Please check your order ID.'
        }, 404);
      }

      console.log('📋 Found existing service:', {
        id: existingService.id,
        service_type: existingService.service_type,
        status: existingService.status,
        mobile_number: existingService.mobile_number
      });

      // Call InsPay API
      const inspayResponse = await inspayService.incompletePanRequest({
        orderid: order_id
      });

      console.log('📥 InsPay API Response:', JSON.stringify(inspayResponse, null, 2));

      if (inspayResponse.status === 'Success') {
        console.log('✅ InsPay Success - Updating existing record with new InsPay details');

        // Update the existing record instead of creating a new one
        const { data: updatedService, error: updateError } = await supabaseAdmin
          .from('pan_services')
          .update({
            service_type: 'INCOMPLETE_PAN', // Update service type
            inspay_txid: inspayResponse.txid, // New txid from InsPay
            inspay_opid: inspayResponse.opid, // New opid
            inspay_url: inspayResponse.url, // New URL
            amount: config.price, // Update amount if different
            status: 'PROCESSING', // Reset to processing
            payment_status: config.price > 0 ? 'RESERVED' : 'COMPLETED',
            payment_reserved_at: config.price > 0 ? new Date().toISOString() : null,
            wallet_balance_at_time: wallet.balance,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingService.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating PAN service record:', updateError);
          return corsJsonResponse({
            success: false,
            message: 'Failed to update PAN service record. Please try again.'
          }, 500);
        }

        return NextResponse.json({
          success: true,
          message: config.price > 0 
            ? 'Incomplete PAN application resumed successfully. Complete your application to proceed with payment.'
            : 'Incomplete PAN application resumed successfully.',
          data: {
            id: updatedService?.id,
            order_id: order_id,
            inspay_url: inspayResponse.url,
            amount: config.price,
            payment_note: config.price > 0 
              ? 'Payment will be deducted only after successful completion of your PAN application.'
              : 'No additional payment required.'
          }
        });

      } else {
        console.log('❌ InsPay Error:', inspayResponse.message);
        return corsJsonResponse({
          success: false,
          message: inspayResponse.message || 'Failed to resume incomplete PAN application. No amount was deducted.'
        }, 400);
      }

    } catch (inspayError) {
      console.error('💥 InsPay API Exception:', inspayError);
      return corsJsonResponse({
        success: false,
        message: 'Unable to connect to PAN service provider. No amount was deducted.'
      }, 500);
    }

  } catch (error) {
    console.error('Error in incomplete PAN API:', error);
    return corsJsonResponse({ success: false, message: 'Internal server error' }, 500);
  }
}

export const POST = withCors(handler as any);