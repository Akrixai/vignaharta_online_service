import { NextRequest, NextResponse } from 'next/server';

// Ultra-simple webhook endpoint for KwikAPI validation
export async function GET(request: NextRequest) {
  console.log('🔔 [KwikAPI] Simple webhook GET:', request.url);
  
  return new NextResponse('SUCCESS', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('🔔 [KwikAPI] Simple webhook POST:', request.url);
  
  try {
    const body = await request.text();
    console.log('POST Body:', body);
    
    return new NextResponse('SUCCESS', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('POST Error:', error);
    return new NextResponse('ERROR', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}