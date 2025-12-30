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
      console.log('🔄 Calling InsPay API (Pre-deduction) for Incomplete PAN...');

      // Call InsPay API FIRST
      const inspayResponse = await inspayService.incompletePanRequest({
        orderid: order_id
      });

      console.log('📥 InsPay API Response:', JSON.stringify(inspayResponse, null, 2));

      if (inspayResponse.status === 'Success') {
        console.log('✅ InsPay Success - Processing wallet deduction and record creation...');

        // NOW DEDUCT FROM WALLET ONLY IF PRICE > 0
        if (config.price > 0) {
          const { data: currentWallet } = await supabaseAdmin
            .from('wallets')
            .select('balance, id')
            .eq('user_id', user.id)
            .single();

          if (!currentWallet || currentWallet.balance < config.price) {
            return corsJsonResponse({
              success: false,
              message: 'Insufficient balance to resume application.'
            }, 400);
          }

          const newBalance = currentWallet.balance - config.price;
          const { error: deductError } = await supabaseAdmin
            .from('wallets')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (deductError) {
            console.error('❌ Critical Error deducting from wallet after InsPay success:', deductError);
            return NextResponse.json({
              success: false,
              message: 'Failed to process payment. Please contact support.'
            }, { status: 500 });
          }

          console.log(`✅ Wallet debited: ₹${config.price}. New balance: ₹${newBalance}`);

          // Create transaction history record
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: user.id,
              wallet_id: currentWallet.id,
              type: 'WITHDRAWAL',
              amount: -config.price,
              status: 'COMPLETED',
              description: `PAN Service Payment - INCOMPLETE_PAN (${order_id})`,
              reference: order_id,
              metadata: {
                service_type: 'INCOMPLETE_PAN',
                order_id: order_id
              }
            });
        }

        // Create PAN service record with status PROCESSING immediately
        const { data: panService, error: panServiceError } = await supabaseAdmin
          .from('pan_services')
          .insert({
            user_id: user.id,
            service_type: 'INCOMPLETE_PAN',
            order_id: order_id,
            inspay_txid: inspayResponse.txid,
            inspay_opid: inspayResponse.opid,
            inspay_url: inspayResponse.url,
            amount: config.price,
            status: 'PROCESSING',
            payment_status: config.price > 0 ? 'DEBITED' : 'COMPLETED',
            payment_debited_at: config.price > 0 ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (panServiceError) {
          console.error('❌ Error creating PAN service record after success:', panServiceError);
        }

        return NextResponse.json({
          success: true,
          message: 'Incomplete PAN application resumed successfully',
          data: {
            id: panService?.id,
            order_id: order_id,
            inspay_url: inspayResponse.url,
            amount: config.price
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