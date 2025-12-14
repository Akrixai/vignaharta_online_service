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

// POST /api/wallet/cashfree/test-webhook - Test webhook processing manually
export async function POST(request: NextRequest) {
  try {
    // Only allow in development/test environment
    if (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION') {
      return addCorsHeaders(NextResponse.json({ error: 'Test webhook not allowed in production' }, { status: 403 }));
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const { order_id, cf_order_id } = body;

    if (!order_id) {
      return addCorsHeaders(NextResponse.json({ error: 'Order ID is required' }, { status: 400 }));
    }

    console.log('Testing webhook processing for order:', order_id);

    // Create a mock webhook payload
    const mockWebhookPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: order_id,
          cf_order_id: cf_order_id || 'TEST_CF_ORDER_ID',
          order_status: 'PAID',
          payment_method: 'TEST_PAYMENT'
        }
      }
    };

    // Call the webhook endpoint internally
    const webhookResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockWebhookPayload),
    });

    const webhookResult = await webhookResponse.json();

    console.log('Test webhook result:', webhookResult);

    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'Test webhook processed',
      webhook_response: webhookResult,
      mock_payload: mockWebhookPayload
    }));
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Test webhook failed',
    }, { status: 500 }));
  }
}