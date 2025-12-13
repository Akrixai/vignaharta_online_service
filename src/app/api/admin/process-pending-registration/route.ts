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

    // Check if payment is successful
    if (registrationPayment.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed yet' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (registrationPayment.user_id) {
      // User already created, return credentials for auto-login
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, role')
        .eq('id', registrationPayment.user_id)
        .single();

      if (user) {
        return NextResponse.json({
          success: true,
          message: 'Account already exists',
          credentials: {
            email: user.email,
            password: registrationPayment.metadata.plain_password,
            role: user.role,
          },
        });
      }
    }

    // Get registration details from metadata
    const metadata = registrationPayment.metadata;
    
    // Create user account
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name: metadata.name,
        email: metadata.email,
        phone: metadata.phone,
        password_hash: metadata.password_hash,
        address: metadata.address,
        city: metadata.city,
        state: metadata.state,
        pincode: metadata.pincode,
        business_name: metadata.business_name,
        shop_photo_url: metadata.shop_photo_url,
        role: 'RETAILER',
        is_active: true,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('Failed to create user:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
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
      // Don't fail the registration if wallet creation fails, just log it
    }

    // Update registration payment with user_id
    await supabaseAdmin
      .from('cashfree_registration_payments')
      .update({ user_id: newUser.id })
      .eq('order_id', order_id);

    // Create notification for new user
    await supabaseAdmin.from('notifications').insert({
      title: 'Registration Successful!',
      message: `Welcome ${metadata.name}! Your retailer account has been created successfully. You can now start using our services.`,
      type: 'REGISTRATION_SUCCESS',
      target_users: [newUser.id],
      data: {
        registration_fee: registrationPayment.base_amount,
        gst_amount: registrationPayment.gst_amount,
        total_paid: registrationPayment.amount,
        payment_method: registrationPayment.payment_method,
      },
    });

    // Create notification for admins
    await supabaseAdmin.from('notifications').insert({
      title: 'New Retailer Registration',
      message: `${metadata.name} (${metadata.email}) has completed registration with payment of ₹${registrationPayment.amount}.`,
      type: 'NEW_REGISTRATION',
      target_roles: ['ADMIN'],
      data: {
        user_id: newUser.id,
        user_name: metadata.name,
        user_email: metadata.email,
        registration_fee: registrationPayment.base_amount,
        gst_amount: registrationPayment.gst_amount,
        total_paid: registrationPayment.amount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      credentials: {
        email: metadata.email,
        password: metadata.plain_password,
        role: 'RETAILER',
      },
    });

  } catch (error) {
    console.error('Process registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}