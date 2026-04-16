import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENVIRONMENT = process.env.CASHFREE_ENVIRONMENT || 'TEST';
const CASHFREE_API_URL = CASHFREE_ENVIRONMENT === 'PRODUCTION'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// POST /api/subscriptions/create-order
// Creates a Cashfree payment order for a subscription plan (with 2% GST)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan_id } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Fetch the plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    const baseAmount = parseFloat(plan.amount);
    const gstPercentage = 2.0;
    const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
    const totalAmount = parseFloat((baseAmount + gstAmount).toFixed(2));

    // Generate unique order ID with SUB_ prefix so webhook knows it's a subscription
    const orderId = `SUB_${user.id.substring(0, 8)}_${Date.now()}`;

    const orderRequest = {
      order_id: orderId,
      order_amount: totalAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_name: user.name || 'User',
        customer_email: user.email,
        customer_phone: user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${process.env.NEXTAUTH_URL}/payment/success?order_id=${orderId}&amount=${totalAmount}&type=subscription`,
        notify_url: `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`,
      },
      order_note: `Subscription: ${plan.name} - Base: ₹${baseAmount}, GST (2%): ₹${gstAmount}`,
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

    const cfData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok || !cfData.payment_session_id) {
      console.error('Cashfree subscription order error:', cfData);
      return NextResponse.json({
        error: cfData.message || 'Failed to create payment order',
        details: cfData,
      }, { status: 500 });
    }

    // Store in cashfree_payments with subscription metadata
    await supabaseAdmin.from('cashfree_payments').insert({
      user_id: user.id,
      order_id: orderId,
      cf_order_id: cfData.cf_order_id,
      amount: totalAmount,
      base_amount: baseAmount,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      wallet_credit_amount: 0, // No wallet credit for subscriptions
      currency: 'INR',
      status: 'CREATED',
      payment_session_id: cfData.payment_session_id,
      metadata: {
        type: 'SUBSCRIPTION',
        plan_id: plan.id,
        plan_name: plan.name,
        billing_period: plan.billing_period,
        base_amount: baseAmount,
        gst_amount: gstAmount,
        total_amount: totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        cf_order_id: cfData.cf_order_id,
        payment_session_id: cfData.payment_session_id,
        plan_name: plan.name,
        base_amount: baseAmount,
        gst_amount: gstAmount,
        total_amount: totalAmount,
      },
    });
  } catch (error: any) {
    console.error('Subscription create-order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
