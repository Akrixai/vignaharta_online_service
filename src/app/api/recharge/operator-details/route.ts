import { NextRequest, NextResponse } from 'next/server';
import kwikapi from '@/lib/kwikapi';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    // Optional: If you want to enforce auth for this endpoint, uncomment below:
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const opid = searchParams.get('opid');

    if (!opid) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameter: opid' },
        { status: 400 }
      );
    }

    const response = await kwikapi.getOperatorDetails(parseInt(opid));

    if (response.success) {
      return NextResponse.json({
        success: true,
        data: {
          operator_name: response.data.operator_name,
          operator_id: response.data.operator_id,
          service_type: response.data.service_type,
          status: response.data.status,
          bill_fetch: response.data.bill_fetch,
          bbps_enabled: response.data.bbps_enabled,
          message: response.data.message,
          description: response.data.description,
          amount_minimum: response.data.amount_minimum,
          amount_maximum: response.data.amount_maximum,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch operator details' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Operator Details API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
