import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      operator_code,
      consumer_number,
      mobile_number,
      service_type,
    } = body;

    if (!operator_code || !consumer_number) {
      return NextResponse.json(
        { success: false, message: 'Operator and consumer number are required' },
        { status: 400 }
      );
    }

    // Get operator details
    const { data: operator } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('operator_code', operator_code)
      .single();

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Invalid operator' },
        { status: 400 }
      );
    }

    // Check if operator supports bill fetch
    const billFetchSupported = operator.metadata?.bill_fetch === 'YES';
    
    if (!billFetchSupported) {
      return NextResponse.json(
        { success: false, message: 'Bill fetch not supported for this operator. You can proceed with manual amount entry.' },
        { status: 400 }
      );
    }

    // Parse operator message for required fields
    const operatorMessage = operator.metadata?.message || '';
    console.log('Operator message:', operatorMessage);
    console.log('Operator metadata:', operator.metadata);

    // Fetch bill from KWIKAPI
    // According to KWIKAPI docs, bill fetch requires:
    // - number: Consumer/Account number
    // - amount: Dummy amount (usually 10)
    // - opid: Operator ID
    // - order_id: Unique transaction ID
    // - opt8: "Bills" (required literal)
    // - mobile: Customer mobile
    // - opt1-opt10: Additional fields as per operator requirements
    
    const billResponse = await kwikapi.fetchBill({
      opid: operator.kwikapi_opid,
      number: consumer_number,
      amount: '10', // Dummy amount for bill fetch
      mobile: mobile_number || user.phone || user.email || '9999999999',
      // opt8 is set to "Bills" in the kwikapi library
    });

    console.log('Bill Response:', billResponse);

    if (!billResponse.success || billResponse.data?.status !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        message: billResponse.message || billResponse.data?.message || 'Failed to fetch bill details. Please check the consumer number and try again.',
        error_details: billResponse.data,
      }, { status: 400 });
    }

    // Extract bill data
    const billData = billResponse.data;
    
    // Save bill fetch history
    try {
      await supabase.from('bill_fetch_history').insert({
        user_id: user.id,
        operator_id: operator.id,
        consumer_number,
        consumer_name: billData.customer_name || billData.customername || 'N/A',
        bill_amount: parseFloat(billData.bill_amount || billData.billamount || '0'),
        due_amount: parseFloat(billData.due_amount || billData.dueamount || '0'),
        bill_month: billData.bill_month || billData.billmonth,
        bill_year: billData.bill_year || billData.billyear,
        due_date: billData.due_date || billData.duedate,
        bill_data: billData,
      });
    } catch (historyError) {
      console.error('Error saving bill history:', historyError);
      // Don't fail the request if history save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        consumer_name: billData.customer_name || billData.customername || 'N/A',
        bill_number: billData.bill_number || billData.billnumber || 'N/A',
        bill_date: billData.bill_date || billData.billdate || 'N/A',
        bill_period: billData.bill_period || billData.billperiod || 'N/A',
        bill_amount: billData.bill_amount || billData.billamount || '0',
        due_amount: billData.due_amount || billData.dueamount || '0',
        due_date: billData.due_date || billData.duedate || 'N/A',
        ref_id: billData.ref_id || billData.refid, // CRITICAL for payment!
        additional_info: billData,
      },
    });
  } catch (error: any) {
    console.error('Fetch Bill API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}
