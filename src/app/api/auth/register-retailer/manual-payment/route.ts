import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateEmail, validatePhone } from '@/lib/utils';
import bcrypt from 'bcryptjs';

// Add CORS headers for cross-origin requests (Flutter app)
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Registration details
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const pincode = formData.get('pincode') as string;
    const businessName = formData.get('business_name') as string;
    const shopPhotoUrl = formData.get('shop_photo_url') as string;
    
    // Payment details
    const amount = parseFloat(formData.get('amount') as string);
    const paymentScreenshot = formData.get('payment_screenshot') as File;
    const utrNumber = formData.get('utr_number') as string;
    const payerName = formData.get('payer_name') as string;
    const payerPhone = formData.get('payer_phone') as string;
    const payerUpiId = formData.get('payer_upi_id') as string;
    const transactionDate = formData.get('transaction_date') as string;

    // Validation
    if (!name || !email || !password) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      ));
    }

    if (!validateEmail(email)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      ));
    }

    if (phone && !validatePhone(phone)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      ));
    }
    if (password.length < 8) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      ));
    }

    if (!phone || !address || !city || !state || !pincode || !businessName || !shopPhotoUrl) {
      return addCorsHeaders(NextResponse.json(
        { error: 'All fields including business name and shop photo are required for retailer registration' },
        { status: 400 }
      ));
    }

    if (!/^\d{6}$/.test(pincode)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Please enter a valid 6-digit PIN code' },
        { status: 400 }
      ));
    }

    // Payment validation
    if (!amount || amount <= 0) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      ));
    }

    if (!paymentScreenshot) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Payment screenshot is required' },
        { status: 400 }
      ));
    }

    if (!payerName || !payerPhone) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Payer name and phone are required' },
        { status: 400 }
      ));
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      ));
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhone) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      ));
    }
    // Check if pending registration already exists
    const { data: existingPending } = await supabaseAdmin
      .from('pending_registrations')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existingPending && existingPending.status === 'pending') {
      return addCorsHeaders(NextResponse.json(
        { error: 'Registration request already submitted and pending approval' },
        { status: 400 }
      ));
    }

    // Get registration fee
    const { data: feeConfig } = await supabaseAdmin
      .from('registration_fees')
      .select('*')
      .eq('fee_type', 'RETAILER_REGISTRATION')
      .eq('is_active', true)
      .single();

    if (!feeConfig) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Registration fee not configured' },
        { status: 500 }
      ));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Upload payment screenshot to Supabase Storage
    const fileExt = paymentScreenshot.name.split('.').pop();
    const fileName = `registration_${email.replace(/[@.]/g, '_')}_${Date.now()}.${fileExt}`;
    const bytes = await paymentScreenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('registration-screenshots')
      .upload(fileName, buffer, {
        contentType: paymentScreenshot.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to upload payment screenshot' },
        { status: 500 }
      ));
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('registration-screenshots')
      .getPublicUrl(fileName);

    // Create pending registration with payment screenshot
    const { data: pendingRegistration, error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .insert({
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        password_hash: hashedPassword,
        role: 'RETAILER',
        status: 'pending',
        payment_screenshot_url: publicUrl,
      })
      .select()
      .single();
    if (pendingError) {
      console.error('Error creating pending registration:', pendingError);
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to submit registration request' },
        { status: 500 }
      ));
    }

    // Create a wallet request for the registration payment (for admin tracking)
    const { data: walletRequest, error: walletError } = await supabaseAdmin
      .from('wallet_requests')
      .insert({
        user_id: null, // No user yet, will be linked after approval
        type: 'TOPUP',
        amount: amount,
        base_amount: amount,
        gst_percentage: 0, // No GST for manual payments
        gst_amount: 0,
        total_amount_paid: amount,
        status: 'PENDING',
        payment_mode: 'MANUAL_QR',
        screenshot_url: publicUrl,
        utr_number: utrNumber || null,
        payer_name: payerName,
        payer_phone: payerPhone,
        payer_upi_id: payerUpiId || null,
        transaction_date: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString(),
        description: `Manual registration payment for ${name} (${email}) - ₹${amount}`,
        metadata: {
          payment_method: 'QR_CODE',
          submission_time: new Date().toISOString(),
          no_gst: true,
          registration_type: 'RETAILER',
          pending_registration_id: pendingRegistration.id,
          business_name: businessName,
          shop_photo_url: shopPhotoUrl,
        },
      })
      .select()
      .single();

    if (walletError) {
      console.error('Error creating wallet request:', walletError);
      // Don't fail the registration, just log the error
    }

    // Create notification for admin/employee
    await supabaseAdmin.from('notifications').insert({
      title: 'New Manual Registration Payment',
      message: `${name} has submitted a manual registration payment for ₹${amount}`,
      type: 'REGISTRATION_PAYMENT',
      target_roles: ['ADMIN', 'EMPLOYEE'],
      data: {
        pending_registration_id: pendingRegistration.id,
        wallet_request_id: walletRequest?.id,
        amount: amount,
        email: email,
        name: name,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Registration and payment details submitted successfully. Your registration will be processed after payment verification.',
      registration: {
        id: pendingRegistration.id,
        name: pendingRegistration.name,
        email: pendingRegistration.email,
        status: pendingRegistration.status,
      },
      payment_request: walletRequest ? {
        id: walletRequest.id,
        amount: walletRequest.amount,
        status: walletRequest.status,
      } : null,
    });

    return addCorsHeaders(response);

  } catch (error) {
    console.error('Manual registration payment error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}