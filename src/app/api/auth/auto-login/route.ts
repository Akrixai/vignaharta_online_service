import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sign } from 'jsonwebtoken';

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

// POST /api/auth/auto-login - Auto login after successful registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, email } = body;

    console.log('Auto-login attempt:', { order_id, email });

    // Validate required fields
    if (!order_id || !email) {
      return addCorsHeaders(NextResponse.json(
        {
          success: false,
          message: 'Order ID and email are required',
        },
        { status: 400 }
      ));
    }

    // Check if registration payment was successful
    const { data: registrationPayment, error: paymentError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('order_id', order_id)
      .eq('status', 'PAID')
      .single();

    if (paymentError || !registrationPayment) {
      console.log('Registration payment not found or not paid:', order_id);
      return addCorsHeaders(NextResponse.json(
        {
          success: false,
          message: 'Registration not completed or payment not successful',
        },
        { status: 404 }
      ));
    }

    // Get user account created from this registration
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        designation,
        is_active,
        address,
        city,
        state,
        pincode,
        date_of_birth,
        gender,
        occupation,
        employee_id,
        department,
        profile_photo_url,
        referral_code,
        territory_state,
        territory_district,
        territory_area,
        parent_employee_id,
        created_at,
        wallets (
          id,
          balance
        )
      `)
      .eq('email', email)
      .eq('role', 'RETAILER')
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      console.log('User not found or not active:', email);
      return addCorsHeaders(NextResponse.json(
        {
          success: false,
          message: 'User account not found or not activated',
        },
        { status: 404 }
      ));
    }

    console.log('Auto-login successful for user:', user.id);

    // Generate JWT token
    const token = sign(
      {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Return success response with user data
    return addCorsHeaders(NextResponse.json(
      {
        success: true,
        message: 'Auto-login successful',
        data: {
          token,
          user_id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          designation: user.designation,
          is_active: user.is_active,
          address: user.address,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          occupation: user.occupation,
          employee_id: user.employee_id,
          department: user.department,
          profile_photo_url: user.profile_photo_url,
          referral_code: user.referral_code,
          territory_state: user.territory_state,
          territory_district: user.territory_district,
          territory_area: user.territory_area,
          parent_employee_id: user.parent_employee_id,
          created_at: user.created_at,
          wallet: user.wallets?.[0] || null,
          registration_details: {
            order_id: registrationPayment.order_id,
            registration_fee: registrationPayment.base_amount,
            gst_amount: registrationPayment.gst_amount,
            total_paid: registrationPayment.amount,
            payment_date: registrationPayment.payment_time,
          },
        },
      },
      { status: 200 }
    ));

  } catch (error: any) {
    console.error('Auto-login error:', error);
    return addCorsHeaders(NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred during auto-login',
      },
      { status: 500 }
    ));
  }
}