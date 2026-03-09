import { NextRequest, NextResponse } from 'next/server';

// This is an alternative webhook endpoint that bypasses ngrok browser warning
// Use this URL in Cashfree dashboard: https://your-ngrok-url.ngrok-free.app/api/cashfree-webhook

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

export async function GET(request: NextRequest) {
  return addCorsHeaders(NextResponse.json({
    success: true,
    message: 'Cashfree webhook endpoint (alternative path)',
    timestamp: new Date().toISOString()
  }));
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 ALTERNATIVE CASHFREE WEBHOOK RECEIVED!', {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Forward to the main webhook handler
    const mainWebhookUrl = `${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`;
    
    const body = await request.text(); // Get raw body
    
    console.log('🔄 Forwarding to main webhook handler:', mainWebhookUrl);
    
    const forwardResponse = await fetch(mainWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-from': 'alternative-webhook'
      },
      body: body,
    });

    const result = await forwardResponse.json();
    
    console.log('✅ Webhook forwarded successfully:', result);

    return addCorsHeaders(NextResponse.json(result, { 
      status: forwardResponse.status 
    }));
  } catch (error: any) {
    console.error('❌ Alternative webhook error:', error);
    return addCorsHeaders(NextResponse.json({
      error: error.message || 'Webhook processing failed',
    }, { status: 500 }));
  }
}