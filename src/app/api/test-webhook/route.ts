import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Query parameters would be logged here in development

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  const expectedToken = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  
  // Token comparison would be logged here in development

  if (mode === 'subscribe' && token === expectedToken) {
    // Webhook verification successful
    return new NextResponse(challenge, { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  // Webhook verification failed
  return NextResponse.json({ 
    error: 'Verification failed',
    received: { mode, token },
    expected: { mode: 'subscribe', token: expectedToken }
  }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    // Webhook POST body would be logged here in development

    return NextResponse.json({
      status: 'received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Webhook POST errors would be logged here in development
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
