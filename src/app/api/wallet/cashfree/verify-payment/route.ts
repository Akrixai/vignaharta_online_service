import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

// Add CORS headers for cross-origin requests
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'TEST';
const CASHFREE_API_URL = CASHFREE_ENVIRONMENT === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// POST /api/wallet/cashfree/verify-payment - Check payment status (read-only, no processing)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return addCorsHeaders(NextResponse.json({ error: 'Order ID is required' }, { status: 400 }));
    }

    console.log('Payment status check requested for order:', order_id);

    // Get payment record from database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('cashfree_payments')
      .select('*')
      .eq('order_id', order_id)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found:', order_id);
      return addCorsHeaders(NextResponse.json({ error: 'Payment not found' }, { status: 404 }));
    }

    // Return current payment status without processing
    return addCorsHeaders(NextResponse.json({ 
      success: true, 
      message: `Payment status: ${payment.status}`,
      status: payment.status,
      order_id: payment.order_id,
      amount: payment.amount,
      base_amount: payment.base_amount,
      gst_amount: payment.gst_amount,
      wallet_credit_amount: payment.wallet_credit_amount || payment.base_amount,
      payment_method: payment.payment_method,
      created_at: payment.created_at,
      payment_time: payment.payment_time
    }));
  } catch (error: any) {
    console.error('Payment status check error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Payment status check failed',
    }, { status: 500 }));
  }
}