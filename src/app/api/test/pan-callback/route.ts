import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'success'; // success, pending, failure
    const txid = searchParams.get('txid') || '53604359'; // Use existing order
    
    let status: string;
    let opid: string;
    
    switch (testType.toLowerCase()) {
      case 'success':
        status = 'Success';
        opid = 'ACK123456789'; // Sample acknowledgement number
        break;
      case 'pending':
        status = 'Pending';
        opid = 'Order is under process';
        break;
      case 'failure':
        status = 'Failure';
        opid = 'Application rejected';
        break;
      default:
        status = 'Success';
        opid = 'ACK123456789';
    }

    console.log(`🧪 Testing PAN callback - Type: ${testType}`, { txid, status, opid });

    // Call our actual callback endpoint
    const callbackUrl = new URL('/api/pan-services/callback', request.url);
    callbackUrl.searchParams.set('txid', txid);
    callbackUrl.searchParams.set('status', status);
    callbackUrl.searchParams.set('opid', opid);

    const response = await fetch(callbackUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InsPay-Test-Agent/1.0'
      }
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Test callback executed - ${testType}`,
      test_params: { txid, status, opid, type: testType },
      callback_result: result,
      callback_status: response.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Error in test callback:', error);
    return NextResponse.json({
      success: false,
      message: 'Test callback failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}