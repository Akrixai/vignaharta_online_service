import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'KwikAPI callback endpoint test - GET method working',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'GET'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    return NextResponse.json({
      success: true,
      message: 'KwikAPI callback endpoint test - POST method working',
      timestamp: new Date().toISOString(),
      url: request.url,
      method: 'POST',
      body: body
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error in POST test',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}