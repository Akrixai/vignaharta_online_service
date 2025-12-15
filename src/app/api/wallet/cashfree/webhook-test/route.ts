import { NextRequest, NextResponse } from 'next/server';

// Add CORS headers for cross-origin requests
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  console.log('🧪 Webhook test endpoint accessed:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  return addCorsHeaders(NextResponse.json({
    success: true,
    message: 'Webhook test endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.CASHFREE_ENVIRONMENT || 'TEST',
    ngrok_headers_received: {
      'ngrok-skip-browser-warning': request.headers.get('ngrok-skip-browser-warning'),
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type')
    }
  }));
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST WEBHOOK POST received:', {
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    });

    const body = await request.json();
    
    console.log('🧪 Test webhook payload:', body);

    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'Test webhook received successfully',
      received_data: body,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('🧪 Test webhook error:', error);
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Failed to process test webhook',
      timestamp: new Date().toISOString()
    }, { status: 500 }));
  }
}