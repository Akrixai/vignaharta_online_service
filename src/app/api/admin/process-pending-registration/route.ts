import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/admin/process-pending-registration - Manually process a pending registration payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow admin or allow without auth for testing
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    if (!payment.metadata) {
      return NextResponse.json(
        { error: 'Payment metadata not found' },
        { status: 400 }
      );
    }

    const registrationData = payment.metadata as any;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', registrationData.email)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser
      });
    }

    // Create user account
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        password_hash: registrationData.password_hash,
        role: registrationData.role || 'RETAILER',
        address: registrationData.address,
        city: registrationData.city,
        state: registrationData.state,
        pincode: registrationData.pincode,
        business_name: registrationData.business_name,
        shop_photo_url: registrationData.shop_photo_url,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('Failed to create user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user', details: userError.message },
        { status: 500 }
      );
    }

    // Create wallet for the new user
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: newUser.id,
        balance: 0,
      });

    if (walletError) {
      console.error('Failed to create wallet:', walletError);
    }

    // Update payment record
    await supabaseAdmin
      .from('cashfree_registration_payments')
      .update({
        user_id: newUser.id,
        status: 'SUCCESS',
        payment_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order_id);

    // Get the plain password from metadata for auto-login
    const plainPassword = (registrationData as any).plain_password;

    return NextResponse.json({
      success: true,
      message: 'User account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      credentials: plainPassword ? {
        email: newUser.email,
        password: plainPassword,
        role: newUser.role
      } : null
    });

  } catch (error) {
    console.error('Process registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/process-pending-registration - Get all pending registrations
export async function GET(request: NextRequest) {
  try {
    const { data: pendingPayments, error } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('status', 'CREATED')
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch pending registrations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pendingPayments
    });

  } catch (error) {
    console.error('Get pending registrations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
