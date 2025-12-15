import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

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

// POST /api/wallet/cashfree/test-api - Test Cashfree API connectivity
export async function POST(request: NextRequest) {
  try {
    // Only allow in development/test environment
    if (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION') {
      return addCorsHeaders(NextResponse.json({ error: 'Test API not allowed in production' }, { status: 403 }));
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const { cf_order_id } = body;

    if (!cf_order_id) {
      return addCorsHeaders(NextResponse.json({ error: 'cf_order_id is required' }, { status: 400 }));
    }

    console.log('Testing Cashfree API with cf_order_id:', cf_order_id);

    // Test Cashfree API call
    const cashfreeResponse = await fetch(`${CASHFREE_API_URL}/orders/${cf_order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
    });

    const responseText = await cashfreeResponse.text();
    let orderStatus;
    
    try {
      orderStatus = JSON.parse(responseText);
    } catch (e) {
      orderStatus = { raw_response: responseText };
    }

    console.log('Cashfree API response:', {
      status: cashfreeResponse.status,
      statusText: cashfreeResponse.statusText,
      headers: Object.fromEntries(cashfreeResponse.headers.entries()),
      body: orderStatus
    });

    return addCorsHeaders(NextResponse.json({
      success: cashfreeResponse.ok,
      cf_order_id: cf_order_id,
      api_url: `${CASHFREE_API_URL}/orders/${cf_order_id}`,
      environment: CASHFREE_ENVIRONMENT,
      response: {
        status: cashfreeResponse.status,
        statusText: cashfreeResponse.statusText,
        ok: cashfreeResponse.ok,
        body: orderStatus
      },
      config: {
        has_app_id: !!CASHFREE_APP_ID,
        has_secret_key: !!CASHFREE_SECRET_KEY,
        app_id_prefix: CASHFREE_APP_ID.substring(0, 10) + '...',
      }
    }));
  } catch (error: any) {
    console.error('Test API error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Test API failed',
      stack: error.stack
    }, { status: 500 }));
  }
}