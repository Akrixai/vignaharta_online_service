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

    console.log(`👤 User ${user.email} (Role: ${user.role}) is applying for PAN_CORRECTION`);

    // Check if user has access (RETAILER or ADMIN)
    if (user.role !== 'RETAILER' && user.role !== 'ADMIN') {
      return corsJsonResponse({ success: false, message: 'Access denied. Only Retailers and Admins can use this service.' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('❌ Failed to parse request JSON:', e);
      return corsJsonResponse({ success: false, message: 'Invalid JSON body' }, 400);
    }

    const { mobile_number, mode } = body;
    console.log('📦 Request body:', body);

    if (!mobile_number || !mode) {
      return corsJsonResponse({ success: false, message: 'Missing required fields: mobile_number and mode are required' }, 400);
    }

    if (!/^[0-9]{10}$/.test(mobile_number.toString())) {
      return corsJsonResponse({ success: false, message: 'Invalid mobile number. Must be 10 digits.' }, 400);
    }

    if (!['EKYC', 'ESIGN'].includes(mode)) {
      return corsJsonResponse({ success: false, message: 'Invalid mode. Must be EKYC or ESIGN.' }, 400);
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

    // Get wallet with full details
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }

    // Check wallet balance
    if (wallet.balance < config.price) {
      return corsJsonResponse({
        success: false,
        message: `Insufficient wallet balance. Required: ₹${config.price}, Available: ₹${wallet.balance}. Please add money to your wallet first.`
      }, 400);
    }

    // Generate order ID
    const orderId = inspayService.generateOrderId();

    try {
      console.log('🔄 Calling InsPay PAN Correction API (Balance Reserved - No Deduction Yet) with data:', {
        number: mobile_number,
        mode,
        orderid: orderId
      });

      // Call InsPay API FIRST
      const inspayResponse = await inspayService.panCorrectionRequest({
        number: mobile_number,
        mode,
        orderid: orderId
      });

      console.log('📥 InsPay API Response:', JSON.stringify(inspayResponse, null, 2));

      if (inspayResponse.status === 'Success') {
        console.log('✅ InsPay Success - Creating record with RESERVED payment status (NO MONEY DEDUCTED YET)');

        // Create PAN service record with RESERVED payment status (NO DEDUCTION)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const { data: panService, error: panServiceError } = await supabaseAdmin
          .from('pan_services')
          .insert({
            user_id: user.id,
            service_type: 'PAN_CORRECTION',
            mobile_number,
            mode,
            order_id: orderId,
            inspay_txid: inspayResponse.txid,
            inspay_opid: inspayResponse.opid,
            inspay_url: inspayResponse.url,
            amount: config.price,
            status: 'PENDING',
            payment_status: 'RESERVED', // Changed from DEBITED to RESERVED
            payment_reserved_at: new Date().toISOString(), // Track when balance was reserved
            wallet_balance_at_time: wallet.balance, // Store current balance for verification
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (panServiceError) {
          console.error('❌ Error creating PAN service record after success:', panServiceError);
        }

        return NextResponse.json({
          success: true,
          message: 'PAN correction initiated successfully. Complete your application to proceed with payment.',
          data: {
            id: panService?.id,
            order_id: orderId,
            inspay_url: inspayResponse.url,
            inspay_txid: inspayResponse.txid,
            amount: config.price,
            payment_note: 'Payment will be deducted only after successful completion of your PAN correction.'
          }
        });

      } else {
        console.log('❌ InsPay Error:', inspayResponse.message);
        return corsJsonResponse({
          success: false,
          message: inspayResponse.message || 'Failed to initiate PAN correction. No amount was deducted.'
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
    console.error('Error in PAN correction API:', error);
    return corsJsonResponse({ success: false, message: 'Internal server error' }, 500);
  }
}

export const POST = withCors(handler as any);