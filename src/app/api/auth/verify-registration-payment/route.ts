import { NextRequest, NextResponse } from 'next/server';
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

// POST /api/auth/verify-registration-payment - Manually verify registration payment status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return addCorsHeaders(NextResponse.json({ error: 'Order ID is required' }, { status: 400 }));
    }

    console.log('Manual registration payment verification requested for order:', order_id);

    // Get registration payment record from database
    const { data: registrationPayment, error: paymentError } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (paymentError || !registrationPayment) {
      console.error('Registration payment record not found:', order_id);
      return addCorsHeaders(NextResponse.json({ error: 'Registration payment not found' }, { status: 404 }));
    }

    // If already processed, return success
    if (registrationPayment.status === 'PAID') {
      return addCorsHeaders(NextResponse.json({ 
        success: true, 
        message: 'Registration payment already processed',
        status: 'PAID'
      }));
    }

    // Check if cf_order_id exists
    if (!registrationPayment.cf_order_id) {
      console.error('Missing cf_order_id for registration payment:', registrationPayment.order_id);
      return addCorsHeaders(NextResponse.json({ 
        error: 'Registration payment record missing Cashfree order ID',
        status: 'ERROR'
      }, { status: 400 }));
    }

    // Check payment status with Cashfree API using cf_order_id
    console.log('Querying Cashfree API with cf_order_id:', registrationPayment.cf_order_id);
    
    const cashfreeResponse = await fetch(`${CASHFREE_API_URL}/orders/${registrationPayment.cf_order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
    });

    const orderStatus = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', orderStatus);
      return addCorsHeaders(NextResponse.json({ 
        error: 'Failed to verify payment status',
        details: orderStatus
      }, { status: 500 }));
    }

    console.log('Cashfree registration order status:', orderStatus);

    // Check if payment is successful
    if (orderStatus.order_status === 'PAID') {
      // Update registration payment status
      await supabaseAdmin
        .from('cashfree_registration_payments')
        .update({
          status: 'PAID',
          payment_method: orderStatus.payment_method || 'UNKNOWN',
          payment_time: new Date().toISOString(),
          webhook_data: orderStatus,
        })
        .eq('order_id', order_id);

      // Get registration details from metadata
      const metadata = registrationPayment.metadata;
      
      if (!metadata || !metadata.email) {
        console.error('Missing metadata in registration payment:', registrationPayment.id);
        return addCorsHeaders(NextResponse.json({ error: 'Missing registration metadata' }, { status: 400 }));
      }

      console.log('Creating user account for:', metadata.email);
      
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
        return addCorsHeaders(NextResponse.json({ error: 'Failed to create user account' }, { status: 500 }));
      }

      console.log('User account created successfully:', newUser.id);

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
      } else {
        console.log('Wallet created successfully for user:', newUser.id);
      }

      // Update registration payment with user_id
      await supabaseAdmin
        .from('cashfree_registration_payments')
        .update({ user_id: newUser.id })
        .eq('order_id', order_id);

      // Send welcome email with credentials
      try {
        const { sendWelcomeRetailerEmail } = await import('@/lib/email-service');
        const emailSent = await sendWelcomeRetailerEmail(
          metadata.name,
          metadata.email,
          metadata.password // This is the plain text password from metadata
        );
        
        if (emailSent) {
          console.log('Welcome email sent successfully to:', metadata.email);
        } else {
          console.error('Failed to send welcome email to:', metadata.email);
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the registration if email fails
      }

      // Create notification for new user
      await supabaseAdmin.from('notifications').insert({
        title: 'Registration Successful!',
        message: `Welcome ${metadata.name}! Your retailer account has been created successfully. You can now start using our services. Check your email for login credentials.`,
        type: 'REGISTRATION_SUCCESS',
        target_users: [newUser.id],
        data: {
          registration_fee: registrationPayment.base_amount,
          gst_amount: registrationPayment.gst_amount,
          total_paid: registrationPayment.amount,
          payment_method: orderStatus.payment_method || 'UNKNOWN',
          email_sent: true,
          verified_manually: true,
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
          verified_manually: true,
        },
      });

      console.log('Registration payment verified and processed successfully:', {
        order_id,
        user_id: newUser.id,
        email: metadata.email
      });

      return addCorsHeaders(NextResponse.json({ 
        success: true, 
        message: 'Registration payment verified and account created successfully',
        status: 'PAID',
        user_id: newUser.id,
        credentials: {
          email: metadata.email,
          password: metadata.password,
          role: 'RETAILER'
        }
      }));
    } else {
      // Payment not successful
      const status = orderStatus.order_status || 'UNKNOWN';
      
      // Update payment status if failed
      if (status === 'CANCELLED' || status === 'FAILED') {
        await supabaseAdmin
          .from('cashfree_registration_payments')
          .update({
            status: 'FAILED',
            webhook_data: orderStatus,
          })
          .eq('order_id', order_id);
      }

      return addCorsHeaders(NextResponse.json({ 
        success: false, 
        message: `Registration payment not successful. Status: ${status}`,
        status: status
      }));
    }
  } catch (error: any) {
    console.error('Registration payment verification error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Registration payment verification failed',
    }, { status: 500 }));
  }
}