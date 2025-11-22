import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pendingRegistrationId } = body;

    if (!pendingRegistrationId) {
      return NextResponse.json(
        { error: 'Pending registration ID is required' },
        { status: 400 }
      );
    }

    // Get pending registration details
    const { data: pendingReg, error: regError } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('id', pendingRegistrationId)
      .single();

    if (regError || !pendingReg) {
      return NextResponse.json(
        { error: 'Pending registration not found' },
        { status: 404 }
      );
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('pending_registration_id', pendingRegistrationId)
      .eq('status', 'PAID')
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already completed for this registration' },
        { status: 400 }
      );
    }

    // Get registration fee
    const { data: feeConfig } = await supabaseAdmin
      .from('registration_fees')
      .select('*')
      .eq('fee_type', 'RETAILER_REGISTRATION')
      .eq('is_active', true)
      .single();

    if (!feeConfig) {
      return NextResponse.json(
        { error: 'Registration fee not configured' },
        { status: 500 }
      );
    }

    const amount = parseFloat(feeConfig.amount);
    const orderId = `REG-${Date.now()}-${pendingRegistrationId.substring(0, 8)}`;

    // Cashfree API endpoint
    const cashfreeUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    // Create Cashfree order using REST API
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: pendingRegistrationId,
        customer_name: pendingReg.name,
        customer_email: pendingReg.email,
        customer_phone: pendingReg.phone,
      },
      order_meta: {
        return_url: `${process.env.NEXTAUTH_URL}/payment/success?order_id=${orderId}&amount=${amount}`,
        notify_url: `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`,
      },
      order_note: 'Retailer Registration Fee',
    };

    const cashfreeResponse = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(orderRequest),
    });

    if (!cashfreeResponse.ok) {
      const errorData = await cashfreeResponse.json();
      console.error('Cashfree API error:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to create Cashfree order' },
        { status: 500 }
      );
    }

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeData.payment_session_id) {
      console.error('Invalid Cashfree response:', cashfreeData);
      return NextResponse.json(
        { error: 'Invalid response from Cashfree' },
        { status: 500 }
      );
    }

    // Store payment record
    const { error: paymentError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .insert({
        pending_registration_id: pendingRegistrationId,
        order_id: orderId,
        cf_order_id: cashfreeData.cf_order_id,
        amount: amount,
        currency: 'INR',
        status: 'CREATED',
        payment_session_id: cashfreeData.payment_session_id,
        metadata: {
          customer_name: pendingReg.name,
          customer_email: pendingReg.email,
          customer_phone: pendingReg.phone,
        },
      });

    if (paymentError) {
      console.error('Error storing payment record:', paymentError);
      return NextResponse.json(
        { error: 'Failed to store payment record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_session_id: cashfreeData.payment_session_id,
      order_id: orderId,
      amount: amount,
    });

  } catch (error) {
    console.error('Registration payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
