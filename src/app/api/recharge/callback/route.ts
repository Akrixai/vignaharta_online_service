import { NextRequest, NextResponse } from 'next/server';

// Legacy callback endpoint for KwikAPI compatibility
// This endpoint redirects/proxies to the new kwikapi-callback endpoint
// to maintain backward compatibility with existing KwikAPI dashboard configuration

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const allParams = Object.fromEntries(searchParams.entries());

    console.log('🔄 [LEGACY-CALLBACK] Received request at /api/recharge/callback:', {
      url: request.url,
      params: allParams,
      timestamp: new Date().toISOString(),
    });

    // If no parameters, return simple validation response for KwikAPI
    if (Object.keys(allParams).length === 0) {
      console.log('✅ [LEGACY-CALLBACK] Validation request - returning OK');
      return new NextResponse('OK', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // Forward the callback to the new endpoint
    console.log('🔄 [LEGACY-CALLBACK] Forwarding to /api/kwikapi-callback');
    
    // Build the new URL with the same parameters
    const baseUrl = new URL(request.url).origin;
    const newUrl = new URL('/api/kwikapi-callback', baseUrl);
    
    // Copy all search parameters
    Object.entries(allParams).forEach(([key, value]) => {
      newUrl.searchParams.set(key, value);
    });

    // Make internal request to the new callback endpoint
    const response = await fetch(newUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-Redirect',
      },
    });

    const responseText = await response.text();
    
    console.log('✅ [LEGACY-CALLBACK] Forwarded successfully:', {
      status: response.status,
      response: responseText,
    });

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('❌ [LEGACY-CALLBACK] Error:', error);
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// POST handler for legacy compatibility
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';

    // Handle different content types
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      const text = await request.text();
      if (text) {
        try {
          body = Object.fromEntries(new URLSearchParams(text));
        } catch {
          body = JSON.parse(text);
        }
      }
    }

    console.log('🔄 [LEGACY-CALLBACK] POST request received:', {
      contentType,
      body,
      timestamp: new Date().toISOString()
    });

    // Forward to the new callback endpoint
    const baseUrl = new URL(request.url).origin;
    const newUrl = new URL('/api/kwikapi-callback', baseUrl);

    const response = await fetch(newUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    
    console.log('✅ [LEGACY-CALLBACK] POST forwarded successfully:', {
      status: response.status,
      response: responseText,
    });

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('❌ [LEGACY-CALLBACK] POST Error:', error);
    return new NextResponse('ERROR', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}