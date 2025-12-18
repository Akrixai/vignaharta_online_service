import { NextRequest, NextResponse } from 'next/server';

// Ultra-simple callback endpoint that mimics PHP behavior
export async function GET(request: NextRequest) {
  console.log('🔔 [KwikAPI] PHP-style callback GET:', request.url);
  
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('🔔 [KwikAPI] PHP-style callback POST:', request.url);
  
  return new NextResponse('OK', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}