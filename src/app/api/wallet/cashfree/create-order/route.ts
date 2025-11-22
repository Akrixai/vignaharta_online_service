import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount } = await request.json();

    // Validate amount
    if (!amount || amount < 10 || amount > 50000) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Must be between ₹10 and ₹50,000' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `ORDER_${session.user.id.substring(0, 8)}_${Date.now()}`;

    // Cashfree API endpoint
    const cashfreeUrl = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    // Generate customer ID (use user ID which is already alphanumeric)
    const customerId = `USER_${session.user.id.replace(/-/g, '_')}`;

    // Create Cashfree order using REST API
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: session.user.name || 'User',
        customer_email: session.user.email,
        customer_phone: session.user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${process.env.NEXTAUTH_URL}/payment/success?order_id=${orderId}&amount=${amount}`,
        notify_url: `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`,
        payment_methods: 'cc,dc,nb,upi,app,paylater,cardlessemi,emi',
      },
      order_note: 'Wallet Recharge',
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
      throw new Error(errorData.message || 'Failed to create Cashfree order');
    }

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeData.payment_session_id) {
      throw new Error('Invalid response from Cashfree');
    }

    // Store order in database using admin client to bypass RLS
    const { error: dbError } = await supabaseAdmin
      .from('cashfree_payments')
      .insert({
        user_id: session.user.id,
        order_id: orderId,
        cf_order_id: cashfreeData.cf_order_id,
        amount: amount,
        currency: 'INR',
        status: 'CREATED',
        payment_session_id: cashfreeData.payment_session_id,
        metadata: {
          customer_details: orderRequest.customer_details,
        },
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store payment record');
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: orderId,
        payment_session_id: cashfreeData.payment_session_id,
        cf_order_id: cashfreeData.cf_order_id,
      },
    });
  } catch (error) {
    console.error('Cashfree order creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment order',
      },
      { status: 500 }
    );
  }
}
