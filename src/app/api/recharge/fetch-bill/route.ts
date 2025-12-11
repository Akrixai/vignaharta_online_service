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

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('email', user.email)
      .single();

    if (!dbUser) {
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

    // For postpaid mobile, consumer_number is typically the mobile number
    const accountNumber = consumer_number || mobile_number;

    if (!operator_code || !accountNumber) {
      return NextResponse.json(
        { success: false, message: 'Operator and account/mobile number are required' },
        { status: 400 }
      );
    }

    console.log('🔍 [Bill Fetch API] Request received:', {
      operator_code,
      accountNumber,
      service_type,
      mobile_number
    });

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
    // - number: Consumer/Account number (for postpaid mobile, this is the mobile number)
    // - amount: Dummy amount (usually 10)
    // - opid: Operator ID
    // - order_id: Unique transaction ID
    // - opt8: "Bills" (required literal)
    // - mobile: Customer mobile
    // - opt1-opt10: Additional fields as per operator requirements

    console.log('🔍 [Bill Fetch] Fetching bill for:', {
      operator: operator.operator_name,
      opid: operator.kwikapi_opid,
      accountNumber,
      service_type
    });

    const billResponse = await kwikapi.fetchBill({
      opid: operator.kwikapi_opid,
      number: accountNumber, // Use the account number (mobile number for postpaid mobile)
      amount: '10', // Dummy amount for bill fetch
      mobile: mobile_number || accountNumber || dbUser.phone || '9999999999',
      // opt8 is set to "Bills" in the kwikapi library
    });

    console.log('Bill Response:', billResponse);

    if (!billResponse.success || billResponse.data?.status !== 'SUCCESS') {
      // Handle specific error cases
      const errorMessage = billResponse.data?.message || billResponse.message || 'Failed to fetch bill details';
      
      if (errorMessage.includes('Time Out') || errorMessage.includes('timeout') || errorMessage.includes('undefined Exceptions')) {
        return NextResponse.json({
          success: false,
          message: '⏰ Bill fetch timed out. This usually means:\n\n• The mobile number may not have an active postpaid connection with this operator\n• The operator\'s system is temporarily unavailable\n• Network connectivity issues\n\n💡 You can still proceed with manual amount entry if you know your bill amount.',
          error_details: billResponse.data,
          allow_manual: true,
        }, { status: 408 });
      }
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('not found')) {
        return NextResponse.json({
          success: false,
          message: '❌ Invalid mobile number or no postpaid connection found. Please verify:\n\n• The mobile number is correct (10 digits)\n• It has an active postpaid connection with this operator\n• Try selecting a different operator if needed\n\n💡 You can still proceed with manual amount entry.',
          error_details: billResponse.data,
          allow_manual: true,
        }, { status: 404 });
      }

      return NextResponse.json({
        success: false,
        message: `❌ ${errorMessage}\n\nPlease check the mobile number and operator selection, or proceed with manual amount entry if you know your bill amount.`,
        error_details: billResponse.data,
        allow_manual: true,
      }, { status: 400 });
    }

    // Extract bill data
    const billData = billResponse.data;

    // Save bill fetch history
    try {
      await supabase.from('bill_fetch_history').insert({
        user_id: dbUser.id,
        operator_id: operator.id,
        consumer_number: accountNumber,
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
