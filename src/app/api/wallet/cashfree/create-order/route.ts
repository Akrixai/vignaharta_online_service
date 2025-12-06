import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'TEST';
const CASHFREE_API_URL = CASHFREE_ENVIRONMENT === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// Log configuration for debugging (remove in production)
console.log('Cashfree Config:', {
  hasAppId: !!CASHFREE_APP_ID,
  hasSecretKey: !!CASHFREE_SECRET_KEY,
  environment: CASHFREE_ENVIRONMENT,
  apiUrl: CASHFREE_API_URL
});

// POST /api/wallet/cashfree/create-order - Create Cashfree order for wallet recharge with 2% GST
export async function POST(request: NextRequest) {
  try {
    // Support both website (cookie) and app (Bearer token) authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const baseAmount = parseFloat(amount);

    // Validate amount range
    if (baseAmount < 10) {
      return NextResponse.json({ error: 'Minimum amount is ₹10' }, { status: 400 });
    }

    const gstPercentage = 2.00; // 2% GST
    const gstAmount = Math.round((baseAmount * gstPercentage)) / 100; // Round to 2 decimals
    const totalAmount = parseFloat((baseAmount + gstAmount).toFixed(2)); // Ensure exactly 2 decimal places

    // No artificial limits - let Cashfree handle its own account limits
    // Maximum is set to ₹50,000 for safety
    if (baseAmount > 50000) {
      return NextResponse.json({
        error: 'Maximum amount is ₹50,000 per transaction',
        max_amount: 50000
      }, { status: 400 });
    }

    // Generate unique order ID
    const orderId = `WALLET_${user.id.substring(0, 8)}_${Date.now()}`;

    // Create Cashfree order
    const orderRequest = {
      order_id: orderId,
      order_amount: totalAmount, // Now guaranteed to have max 2 decimal places
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_name: user.name || 'User',
        customer_email: user.email,
        customer_phone: user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${process.env.NEXTAUTH_URL}/dashboard/wallet?payment=success`,
        notify_url: `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`,
      },
      order_note: `Wallet recharge - Base: ₹${baseAmount.toFixed(2)}, GST (2%): ₹${gstAmount.toFixed(2)}`,
    };

    const cashfreeResponse = await fetch(`${CASHFREE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(orderRequest),
    });

    const response = await cashfreeResponse.json();

    if (!cashfreeResponse.ok || !response) {
      console.error('Cashfree API error:', {
        status: cashfreeResponse.status,
        statusText: cashfreeResponse.statusText,
        response,
        environment: CASHFREE_ENVIRONMENT,
        amount: totalAmount,
        headers: {
          hasAppId: !!CASHFREE_APP_ID,
          hasSecretKey: !!CASHFREE_SECRET_KEY
        }
      });

      // Provide helpful error messages
      let errorMessage = response?.message || `Cashfree API error: ${cashfreeResponse.statusText}`;

      if (response?.code === 'order_amount_invalid') {
        errorMessage = `${response.message}. This is a Cashfree account limit. Please contact Cashfree support to increase your transaction limits, or use QR Payment for higher amounts (no limits, no GST).`;
      }

      return NextResponse.json({
        error: errorMessage,
        details: response,
        suggestion: 'Use QR Payment (no GST, no limits) for higher amounts'
      }, { status: 500 });
    }

    // Store payment record in database
    const { error: dbError } = await supabaseAdmin
      .from('cashfree_payments')
      .insert({
        user_id: user.id,
        order_id: orderId,
        cf_order_id: response.cf_order_id,
        amount: totalAmount,
        base_amount: baseAmount,
        gst_percentage: gstPercentage,
        gst_amount: gstAmount,
        wallet_credit_amount: baseAmount, // Only base amount will be credited to wallet
        currency: 'INR',
        status: 'CREATED',
        payment_session_id: response.payment_session_id,
        metadata: {
          base_amount: baseAmount,
          gst_percentage: gstPercentage,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          wallet_credit_amount: baseAmount,
        },
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save payment record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        cf_order_id: response.cf_order_id,
        payment_session_id: response.payment_session_id,
        base_amount: baseAmount,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        wallet_credit_amount: baseAmount,
      }
    });
  } catch (error: any) {
    console.error('Error creating Cashfree order:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
