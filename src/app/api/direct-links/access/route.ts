import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// POST - Process service access with payment
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const { service_id } = body;

    if (!service_id) {
      return addCorsHeaders(NextResponse.json({ 
        error: 'Service ID is required' 
      }, { status: 400 }));
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('direct_links_services')
      .select('*')
      .eq('id', service_id)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return addCorsHeaders(NextResponse.json({ 
        error: 'Service not found or inactive' 
      }, { status: 404 }));
    }

    // Check if user role is allowed
    if (!service.allowed_roles.includes(user.role)) {
      return addCorsHeaders(NextResponse.json({ 
        error: 'You are not authorized to access this service' 
      }, { status: 403 }));
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return addCorsHeaders(NextResponse.json({ 
        error: 'Wallet not found' 
      }, { status: 404 }));
    }

    // Check if payment is required and user has sufficient balance
    if (service.requires_payment && service.amount > 0) {
      if (wallet.balance < service.amount) {
        return addCorsHeaders(NextResponse.json({ 
          error: 'Insufficient wallet balance',
          required_amount: service.amount,
          current_balance: wallet.balance
        }, { status: 400 }));
      }
    }

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Start transaction - simple payment deduction only
    const { data: transaction, error: transactionError } = await supabase.rpc(
      'process_direct_link_access',
      {
        p_service_id: service_id,
        p_user_id: user.id,
        p_wallet_id: wallet.id,
        p_amount: service.amount,
        p_access_token: accessToken,
        p_ip_address: clientIP,
        p_user_agent: userAgent
      }
    );

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return addCorsHeaders(NextResponse.json({ 
        error: 'Failed to process payment' 
      }, { status: 500 }));
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        access_token: accessToken,
        service_url: service.service_url,
        redirect_type: service.redirect_type,
        amount_paid: service.requires_payment ? service.amount : 0,
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          button_text: service.button_text
        }
      },
      message: service.requires_payment ? 
        `Payment of ₹${service.amount} processed successfully` : 
        'Service access granted'
    }));

  } catch (error: any) {
    console.error('Error processing service access:', error);
    return addCorsHeaders(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }));
  }
}