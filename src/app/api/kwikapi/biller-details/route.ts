import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const opid = searchParams.get('opid');

    if (!opid) {
      return NextResponse.json(
        { success: false, message: 'Operator ID (opid) is required' },
        { status: 400 }
      );
    }

    if (!KWIKAPI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'KwikAPI service not available' },
        { status: 500 }
      );
    }

    // Fetch biller details from KwikAPI using correct endpoint
    const formData = new FormData();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('opid', opid);

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

    // Parse parameters from KwikAPI response format
    const parameters = [];
    if (data.parameters && Array.isArray(data.parameters)) {
      data.parameters.forEach((param: any, index: number) => {
        // KwikAPI returns parameters as objects like {"opt1/param1": "Mobile Number"}
        Object.keys(param).forEach(key => {
          const value = param[key];
          if (value && value !== null && value !== '') {
            const paramNumber = key.split('/')[0]; // Extract opt1, opt2, etc.
            parameters.push({
              key: `param_${index + 1}`,
              name: value,
              label: value,
              placeholder: `Enter ${value.toLowerCase()}`,
              required: true,
              order: index + 1,
              type: 'text',
              kwikapi_param: paramNumber, // opt1, opt2, etc.
              description: `Required parameter: ${value}`,
              options: []
            });
          }
        });
      });
    }

    // Transform the response to match our expected format
    const billerInfo = {
      id: opid,
      operator_id: parseInt(data.operator_id || opid),
      operator_name: data.operator_name || 'Unknown',
      service_type: data.service_type || 'UNKNOWN',
      bill_fetch: data.bill_fetch || 'NO',
      amount_minimum: data.amount_minimum || '10',
      amount_maximum: data.amount_maximum || '50000',
      bbps_enabled: data.bbps_enabled || 'NO',
      message: data.message || '',
      description: data.description || '',
      status: data.status || '1',
      biller_status: data.biller_status || 'on',
      supportValidation: data.supportValidation || 'NOT_SUPPORTED',
      parameters: parameters
    };

    return NextResponse.json({
      success: true,
      data: billerInfo
    });

  } catch (error: any) {
    console.error('Biller Details API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}