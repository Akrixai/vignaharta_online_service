import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      opid,
      account_number,
      mobile_number,
      service_type,
      opt1,
      opt2,
      opt3,
    } = body;

    if (!opid || !account_number) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: opid and account_number' },
        { status: 400 }
      );
    }

    console.log('🧪 [Test Bill Fetch] Testing bill fetch for:', {
      opid,
      account_number,
      service_type,
      mobile_number,
      opt1,
      opt2,
      opt3
    });

    // Get operator details first
    const operatorResponse = await kwikapi.getOperatorDetails(parseInt(opid));
    
    if (!operatorResponse.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get operator details',
        error: operatorResponse.data
      }, { status: 400 });
    }

    const operatorData = operatorResponse.data;
    console.log('📋 [Test Bill Fetch] Operator Details:', {
      name: operatorData.operator_name,
      service_type: operatorData.service_type,
      bill_fetch: operatorData.bill_fetch,
      bbps_enabled: operatorData.bbps_enabled,
      message: operatorData.message
    });

    if (operatorData.bill_fetch !== 'YES') {
      return NextResponse.json({
        success: false,
        message: `Bill fetch not supported for ${operatorData.operator_name}`,
        operator_details: operatorData
      }, { status: 400 });
    }

    // Prepare bill fetch parameters
    const billFetchParams: any = {
      opid: parseInt(opid),
      number: account_number,
      amount: '10', // Dummy amount
      mobile: mobile_number || account_number || '9999999999',
    };

    // Add optional parameters if provided
    if (opt1) billFetchParams.opt1 = opt1;
    if (opt2) billFetchParams.opt2 = opt2;
    if (opt3) billFetchParams.opt3 = opt3;

    console.log('🔍 [Test Bill Fetch] Calling KWIKAPI with params:', billFetchParams);

    // Call bill fetch API
    const billResponse = await kwikapi.fetchBill(billFetchParams);

    console.log('📦 [Test Bill Fetch] KWIKAPI Response:', {
      success: billResponse.success,
      status: billResponse.data?.status,
      message: billResponse.data?.message,
      data: billResponse.data
    });

    if (billResponse.success && billResponse.data?.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Bill fetch successful',
        operator_details: operatorData,
        bill_data: {
          customer_name: billResponse.data.customer_name || billResponse.data.customername,
          bill_number: billResponse.data.bill_number || billResponse.data.billnumber,
          bill_date: billResponse.data.bill_date || billResponse.data.billdate,
          bill_period: billResponse.data.bill_period || billResponse.data.billperiod,
          due_amount: billResponse.data.due_amount || billResponse.data.dueamount,
          due_date: billResponse.data.due_date || billResponse.data.duedate,
          ref_id: billResponse.data.ref_id || billResponse.data.refid,
        },
        raw_response: billResponse.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: billResponse.data?.message || billResponse.message || 'Bill fetch failed',
        operator_details: operatorData,
        error_details: billResponse.data,
        debug_info: billResponse.debug_info
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ [Test Bill Fetch] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Internal server error',
        stack: error.stack
      },
      { status: 500 }
    );
  }
}