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

// POST /api/wallet/cashfree/simulate-webhook - Simulate a successful payment webhook for testing
export async function POST(request: NextRequest) {
  try {
    // Only allow in development/test environment
    if (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION') {
      return addCorsHeaders(NextResponse.json({ error: 'Webhook simulation not allowed in production' }, { status: 403 }));
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return addCorsHeaders(NextResponse.json({ error: 'Order ID is required' }, { status: 400 }));
    }

    console.log('🧪 Simulating successful webhook for order:', order_id);

    // Create a mock webhook payload for successful payment
    const mockWebhookPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: order_id,
          order_status: 'PAID',
          payment_method: 'TEST_SIMULATION',
          order_amount: 10.20,
          order_currency: 'INR'
        }
      }
    };

    // Call the webhook endpoint internally
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`;
    console.log('🔄 Calling webhook internally:', webhookUrl);

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-simulated-webhook': 'true'
      },
      body: JSON.stringify(mockWebhookPayload),
    });

    const webhookResult = await webhookResponse.json();

    console.log('🧪 Simulated webhook result:', webhookResult);

    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'Webhook simulation completed',
      order_id: order_id,
      webhook_response: webhookResult,
      mock_payload: mockWebhookPayload
    }));
  } catch (error: any) {
    console.error('🧪 Webhook simulation error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Webhook simulation failed',
    }, { status: 500 }));
  }
}