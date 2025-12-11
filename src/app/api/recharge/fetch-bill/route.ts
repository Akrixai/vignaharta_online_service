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
      mobile_number,
      user_email: user.email
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
      const serviceTypeUpper = service_type?.toUpperCase() || 'UNKNOWN';
      let message = 'Bill fetch not supported for this operator. ';
      
      if (serviceTypeUpper === 'POSTPAID') {
        message += 'Please enter your bill amount manually to proceed with payment.';
      } else if (serviceTypeUpper === 'ELECTRICITY') {
        message += 'Please enter your bill amount manually or check your electricity bill for the amount due.';
      } else {
        message += 'You can proceed with manual amount entry.';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: message,
          allow_manual: true 
        },
        { status: 400 }
      );
    }

    // Parse operator message for required fields
    const operatorMessage = operator.metadata?.message || '';
    console.log('Operator message:', operatorMessage);
    console.log('Operator metadata:', operator.metadata);

    console.log('🔍 [Bill Fetch] Fetching bill for:', {
      operator: operator.operator_name,
      opid: operator.kwikapi_opid,
      accountNumber,
      service_type
    });

    // Parse operator message for additional required fields
    const billFetchParams: any = {
      opid: operator.kwikapi_opid,
      number: accountNumber, // Use the account number (mobile number for postpaid mobile)
      amount: '10', // Dummy amount for bill fetch
      mobile: mobile_number || accountNumber || dbUser.phone || '9999999999',
      // opt8 is set to "Bills" in the kwikapi library
    };

    // Handle special cases based on operator message from KWIKAPI documentation
    if (operatorMessage) {
      const messageUpper = operatorMessage.toUpperCase();
      
      // Handle operators that need mobile number in opt1
      if (messageUpper.includes('MOBILE NUMBER') && messageUpper.includes('OPTIONAL1')) {
        billFetchParams.opt1 = mobile_number || dbUser.phone;
        console.log('📱 [Bill Fetch] Adding mobile number to opt1:', billFetchParams.opt1);
      }
      
      // Handle operators that need billing unit in opt1 (like MSEDC MAHARASHTRA)
      if (messageUpper.includes('BILLING UNIT') && messageUpper.includes('OPTIONAL1')) {
        console.log('⚠️ [Bill Fetch] Operator requires billing unit in opt1:', operator.operator_name);
        // This would need to be provided by the frontend in the request body
        if (body.billing_unit) {
          billFetchParams.opt1 = body.billing_unit;
        }
      }
      
      // Handle operators that need subdivision code (like JBVNL - JHARKHAND)
      if (messageUpper.includes('SUBDIVISION CODE') && messageUpper.includes('OPTIONAL1')) {
        console.log('🏢 [Bill Fetch] Operator requires subdivision code in opt1:', operator.operator_name);
        if (body.subdivision_code) {
          billFetchParams.opt1 = body.subdivision_code;
        }
      }
      
      // Handle operators that need city in opt1 (like Torrent Power operators)
      if (messageUpper.includes('CITY') && messageUpper.includes('OPTIONAL1')) {
        console.log('🏙️ [Bill Fetch] Operator requires city in opt1:', operator.operator_name);
        if (body.city) {
          billFetchParams.opt1 = body.city;
        }
      }
      
      // Handle operators that need account number in opt1 (like MTNL landline)
      if (messageUpper.includes('ACCOUNT NUMBER') && messageUpper.includes('OPTIONAL1')) {
        console.log('🔢 [Bill Fetch] Operator requires account number in opt1:', operator.operator_name);
        if (body.account_number) {
          billFetchParams.opt1 = body.account_number;
        }
      }
      
      // Handle operators that need telephone number in account and account number in opt1
      if (messageUpper.includes('TELEPHONE NUMBER') && messageUpper.includes('ACCOUNT')) {
        console.log('☎️ [Bill Fetch] Operator uses telephone number format:', operator.operator_name);
        // For MTNL operators: pass Telephone Number in 'account' and Account Number in 'optional1'
        if (body.telephone_number && body.account_number) {
          billFetchParams.number = body.telephone_number;
          billFetchParams.opt1 = body.account_number;
        }
      }
    }

    console.log('🔍 [Bill Fetch] KWIKAPI parameters:', {
      opid: billFetchParams.opid,
      number: billFetchParams.number,
      mobile: billFetchParams.mobile,
      opt1: billFetchParams.opt1 || 'not set',
      operator_name: operator.operator_name,
      service_type: service_type
    });

    const billResponse = await kwikapi.fetchBill(billFetchParams);

    console.log('📦 [Bill Fetch] KWIKAPI Response Status:', {
      success: billResponse.success,
      status: billResponse.data?.status,
      message: billResponse.data?.message,
      operator: operator.operator_name
    });

    console.log('Bill Response:', billResponse);

    if (!billResponse.success || billResponse.data?.status !== 'SUCCESS') {
      // Handle specific error cases based on service type
      const errorMessage = billResponse.data?.message || billResponse.message || 'Failed to fetch bill details';
      
      // Service-specific error messages
      const serviceTypeUpper = service_type?.toUpperCase() || 'UNKNOWN';
      
      if (errorMessage.includes('Time Out') || errorMessage.includes('timeout') || errorMessage.includes('undefined Exceptions')) {
        let timeoutMessage = '⏰ Bill fetch timed out. This usually means:\n\n';
        
        if (serviceTypeUpper === 'POSTPAID') {
          timeoutMessage += '• The mobile number may not have an active postpaid connection with this operator\n';
          timeoutMessage += '• The operator\'s billing system is temporarily unavailable\n';
          timeoutMessage += '• Network connectivity issues\n\n';
          timeoutMessage += '💡 You can still proceed with manual amount entry if you know your bill amount.';
        } else if (serviceTypeUpper === 'ELECTRICITY') {
          timeoutMessage += '• The consumer number may be incorrect or inactive\n';
          timeoutMessage += '• The electricity board\'s system is temporarily unavailable\n';
          timeoutMessage += '• Network connectivity issues\n\n';
          timeoutMessage += '💡 Please verify your consumer number or proceed with manual amount entry.';
        } else {
          timeoutMessage += '• The account number may be incorrect or inactive\n';
          timeoutMessage += '• The service provider\'s system is temporarily unavailable\n';
          timeoutMessage += '• Network connectivity issues\n\n';
          timeoutMessage += '💡 You can still proceed with manual amount entry if you know your bill amount.';
        }
        
        return NextResponse.json({
          success: false,
          message: timeoutMessage,
          error_details: billResponse.data,
          allow_manual: true,
        }, { status: 408 });
      }
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('not found')) {
        let invalidMessage = '';
        
        if (serviceTypeUpper === 'POSTPAID') {
          invalidMessage = '❌ Invalid mobile number or no postpaid connection found. Please verify:\n\n';
          invalidMessage += '• The mobile number is correct (10 digits)\n';
          invalidMessage += '• It has an active postpaid connection with this operator\n';
          invalidMessage += '• Try selecting a different operator if needed\n\n';
          invalidMessage += '💡 You can still proceed with manual amount entry.';
        } else if (serviceTypeUpper === 'ELECTRICITY') {
          invalidMessage = '❌ Invalid consumer number or account not found. Please verify:\n\n';
          invalidMessage += '• The consumer number is correct (check your electricity bill)\n';
          invalidMessage += '• The account is active with this electricity board\n';
          invalidMessage += '• Try selecting the correct electricity board for your area\n\n';
          invalidMessage += '💡 You can still proceed with manual amount entry if you know your bill amount.';
        } else {
          invalidMessage = '❌ Invalid account number or service not found. Please verify:\n\n';
          invalidMessage += '• The account/consumer number is correct\n';
          invalidMessage += '• The account is active with this service provider\n';
          invalidMessage += '• Try selecting the correct service provider\n\n';
          invalidMessage += '💡 You can still proceed with manual amount entry.';
        }
        
        return NextResponse.json({
          success: false,
          message: invalidMessage,
          error_details: billResponse.data,
          allow_manual: true,
        }, { status: 404 });
      }

      // Generic error message based on service type
      let genericMessage = `❌ ${errorMessage}\n\n`;
      
      if (serviceTypeUpper === 'POSTPAID') {
        genericMessage += 'Please check the mobile number and operator selection, or proceed with manual amount entry if you know your bill amount.';
      } else if (serviceTypeUpper === 'ELECTRICITY') {
        genericMessage += 'Please check the consumer number and electricity board selection, or proceed with manual amount entry if you know your bill amount.';
      } else {
        genericMessage += 'Please check the account details and service provider selection, or proceed with manual amount entry if you know your bill amount.';
      }

      return NextResponse.json({
        success: false,
        message: genericMessage,
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
