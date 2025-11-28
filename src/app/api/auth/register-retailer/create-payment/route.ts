import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateEmail, validatePhone } from '@/lib/utils';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      base_amount,
      gst_amount,
      total_amount,
    } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!phone || !address || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'All fields are required for retailer registration' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit PIN code' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      );
    }

    // Original check kept for compatibility
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if pending registration already exists
    const { data: existingPending } = await supabaseAdmin
      .from('pending_registrations')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existingPending && existingPending.status === 'pending') {
      return NextResponse.json(
        { error: 'Registration request already submitted and pending approval' },
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

    // Use total_amount from frontend (includes GST) or calculate from base fee
    const amount = total_amount || parseFloat(feeConfig.amount);
    const baseAmount = base_amount || parseFloat(feeConfig.amount);
    const gstAmountValue = gst_amount || 0;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate unique order ID (alphanumeric only, no special characters)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `REG${timestamp}${randomStr}`;

    // Cashfree API endpoint
    const cashfreeUrl = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    // Generate customer ID (alphanumeric only, replace @ and . with underscore)
    const customerId = `REG_${email.replace(/[@.]/g, '_')}_${Date.now()}`;

    // Create Cashfree order using REST API
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${process.env.NEXTAUTH_URL}/payment/success?order_id=${orderId}&amount=${amount}`,
        notify_url: `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`,
        payment_methods: 'cc,dc,nb,upi,app,paylater,cardlessemi,emi',
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

    // Store payment record with registration details in metadata
    const { error: paymentError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .insert({
        pending_registration_id: null, // Will be set after payment success
        order_id: orderId,
        cf_order_id: cashfreeData.cf_order_id,
        amount: amount,
        currency: 'INR',
        status: 'CREATED',
        payment_session_id: cashfreeData.payment_session_id,
        metadata: {
          // Store registration details here temporarily
          name,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          password_hash: hashedPassword,
          plain_password: password, // Store plain password for auto-login (only in TEST mode)
          role: 'RETAILER',
          base_amount: baseAmount,
          gst_amount: gstAmountValue,
          total_amount: amount,
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
