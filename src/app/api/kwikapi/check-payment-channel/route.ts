import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!KWIKAPI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'KwikAPI service not available' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { opid } = body;

    if (!opid) {
      return NextResponse.json(
        { success: false, message: 'Operator ID (opid) is required' },
        { status: 400 }
      );
    }

    // Fetch biller details from KwikAPI to check payment channels
    const formData = new FormData();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('opid', opid.toString());

    const response = await fetch(`${KWIKAPI_BASE_URL}/api/v2/operatorFetch.php`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to fetch biller details from KwikAPI');
    }

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to fetch biller details'
      });
    }

    // Check if AGT payment channel is supported
    const supportsAGT = data.payment_channels?.includes('AGT') || 
                       data.payment_channel_info?.AGT === 'Y' ||
                       data.payment_modes?.some((mode: any) => mode.channel === 'AGT');

    return NextResponse.json({
      success: true,
      data: {
        opid: opid,
        operator_name: data.operator_name,
        supports_agt: supportsAGT,
        payment_channels: data.payment_channels || [],
        payment_channel_info: data.payment_channel_info || {},
        raw_response: data
      }
    });

  } catch (error: any) {
    console.error('Payment Channel Check API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}