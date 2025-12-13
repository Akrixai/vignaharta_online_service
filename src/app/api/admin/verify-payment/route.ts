import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get the registration payment record
    const { data: registrationPayment, error: paymentError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (paymentError || !registrationPayment) {
      return NextResponse.json(
        { success: false, error: 'Registration payment not found' },
        { status: 404 }
      );
    }

    // If already paid, return success
    if (registrationPayment.status === 'PAID') {
      return NextResponse.json({
        success: true,
        status: 'PAID',
        message: 'Payment already verified',
      });
    }

    // Verify payment status with Cashfree API
    const cashfreeUrl = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
      ? `https://api.cashfree.com/pg/orders/${order_id}`
      : `https://sandbox.cashfree.com/pg/orders/${order_id}`;

    const cashfreeResponse = await fetch(cashfreeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        'x-api-version': '2023-08-01',
      },
    });

    if (!cashfreeResponse.ok) {
      const errorData = await cashfreeResponse.json();
      console.error('Cashfree API error:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to verify payment with Cashfree' },
        { status: 500 }
      );
    }

    const cashfreeData = await cashfreeResponse.json();
    const paymentStatus = cashfreeData.order_status;

    // Update payment status based on Cashfree response
    if (paymentStatus === 'PAID') {
      await supabaseAdmin
        .from('cashfree_registration_payments')
        .update({
          status: 'PAID',
          payment_method: cashfreeData.payment_method || 'UNKNOWN',
          payment_time: new Date().toISOString(),
          webhook_data: { 
            verified_manually: true, 
            cashfree_response: cashfreeData,
            verified_at: new Date().toISOString(),
          },
        })
        .eq('order_id', order_id);

      return NextResponse.json({
        success: true,
        status: 'PAID',
        message: 'Payment verified and updated',
        cashfree_data: cashfreeData,
      });
    } else {
      await supabaseAdmin
        .from('cashfree_registration_payments')
        .update({
          status: paymentStatus,
          webhook_data: { 
            verified_manually: true, 
            cashfree_response: cashfreeData,
            verified_at: new Date().toISOString(),
          },
        })
        .eq('order_id', order_id);

      return NextResponse.json({
        success: false,
        status: paymentStatus,
        message: `Payment status: ${paymentStatus}`,
        cashfree_data: cashfreeData,
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}