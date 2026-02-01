import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com/api/v2';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY;

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Bill fetch API endpoint. Use POST method with opid, number, and mobile parameters.',
    example: {
      method: 'POST',
      body: {
        opid: 29,
        number: '9876543210',
        mobile: '9876543210',
        amount: 10
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!KWIKAPI_API_KEY) {
      return NextResponse.json(
        { error: 'KwikAPI secret key not configured' },
        { status: 500 }
      );
    }

    // Import Supabase client for session management
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user from database
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('📥 [Bill Fetch] Received request body:', body);
    
    const { 
      opid, 
      number, 
      account_number, 
      consumer_number, 
      mobile_number,
      amount = 10, 
      mobile, 
      opt1, 
      opt2, 
      opt3, 
      opt4, 
      opt5, 
      opt6, 
      opt7, 
      opt8, 
      opt9, 
      opt10,
      optional_params = {}
    } = body;

    // Extract the account number from various possible field names
    const accountNumber = number || account_number || consumer_number || mobile_number;

    console.log('📥 [Bill Fetch] Extracted parameters:', { opid, accountNumber, amount, mobile });

    if (!opid || !accountNumber) {
      console.error('❌ [Bill Fetch] Missing parameters:', { opid, accountNumber, hasOpid: !!opid, hasAccountNumber: !!accountNumber });
      return NextResponse.json(
        { error: 'Missing required parameters: opid and account number', received: { opid, accountNumber } },
        { status: 400 }
      );
    }

    // Generate unique order ID (5-14 numeric characters as per KwikAPI requirement)
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits of timestamp
    const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const orderId = timestamp + randomSuffix; // 14 digits total

    // Build KwikAPI bill validation URL with all required parameters
    const params = new URLSearchParams({
      api_key: KWIKAPI_API_KEY,
      number: accountNumber.toString(),
      amount: amount.toString(),
      opid: opid.toString(),
      order_id: orderId,
      opt1: opt1 || '', // For Torrent Power, this should be City
      opt2: opt2 || '',
      opt3: opt3 || '',
      opt4: opt4 || '',
      opt5: opt5 || '',
      opt6: opt6 || '',
      opt7: opt7 || '',
      opt8: opt8 || 'Bills', // Required for bill fetch
      opt9: opt9 || '',
      opt10: opt10 || '',
      mobile: mobile || mobile_number || '9999999999', // Default mobile for electricity bills
    });

    const kwikApiUrl = `${KWIKAPI_BASE_URL}/bills/validation.php?${params.toString()}`;

    console.log('🔍 [KwikAPI] Bill fetch request:', {
      opid,
      accountNumber,
      amount,
      orderId,
      orderIdLength: orderId.length,
      mobile: mobile || mobile_number || accountNumber,
      url: kwikApiUrl.replace(KWIKAPI_API_KEY, 'HIDDEN')
    });

    // Validate order ID length (KwikAPI requires 5-14 characters)
    if (orderId.length < 5 || orderId.length > 14) {
      return NextResponse.json({
        success: false,
        message: `Invalid order ID length: ${orderId.length}. Must be 5-14 characters.`,
        error: 'INVALID_ORDER_ID'
      }, { status: 400 });
    }

    // Call KwikAPI bill validation endpoint (GET request)
    const response = await fetch(kwikApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'VighnahartaOnlineServices/1.0',
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      console.error('KwikAPI HTTP Error:', response.status, response.statusText);
      
      // Handle specific HTTP error codes with user-friendly messages
      let userMessage = 'Unable to fetch bill details at the moment. Please try again.';
      let errorType = 'KWIKAPI_ERROR';
      
      if (response.status === 522) {
        userMessage = 'The bill fetch service is temporarily slow. Please try again in a few moments.';
        errorType = 'TIMEOUT_ERROR';
      } else if (response.status === 503 || response.status === 502) {
        userMessage = 'The bill fetch service is temporarily unavailable. Please try again later.';
        errorType = 'SERVICE_UNAVAILABLE';
      } else if (response.status === 404) {
        userMessage = 'Bill fetch service not found for this operator. Please enter the amount manually.';
        errorType = 'SERVICE_NOT_FOUND';
      } else if (response.status >= 500) {
        userMessage = 'Server error occurred while fetching bill details. Please try again.';
        errorType = 'SERVER_ERROR';
      }
      
      return NextResponse.json({
        success: false,
        message: userMessage,
        error: errorType,
        http_status: response.status
      }, { status: 200 }); // Return 200 so frontend can handle gracefully
    }

    const responseText = await response.text();
    console.log('📦 [KwikAPI] Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid response from operator. Please try again.',
        error: 'PARSE_ERROR'
      }, { status: 500 });
    }
    
    console.log('📦 [KwikAPI] Bill fetch response:', {
      status: data.status,
      message: data.message,
      hasCustomerName: !!data.customer_name,
      hasDueAmount: !!data.due_amount,
      fullResponse: data
    });

    // Check if the response is successful
    if (data.status === 'SUCCESS') {
      const billData = {
        status: data.status,
        message: data.message || 'Bill fetched successfully',
        customer_name: data.customer_name || data.customername,
        bill_number: data.bill_number || data.billnumber,
        due_amount: data.due_amount || data.dueamount,
        due_date: data.due_date || data.duedate,
        bill_date: data.bill_date || data.billdate,
        bill_period: data.bill_period || data.billperiod,
        ref_id: data.ref_id || data.refid,
        refrence_id: data.ref_id || data.refid, // Alternative spelling
        order_id: orderId,
        kwikapi_response: data // Store the complete raw response
      };

      // CRITICAL FIX: Store bill fetch session for ref_id tracking
      try {
        // Clean up any existing sessions for this user/consumer combination
        await supabase
          .from('bill_fetch_sessions')
          .delete()
          .eq('user_id', dbUser.id)
          .eq('consumer_number', accountNumber)
          .eq('used_for_payment', false);

        // Create new bill fetch session
        const { data: session, error: sessionError } = await supabase
          .from('bill_fetch_sessions')
          .insert({
            user_id: dbUser.id,
            consumer_number: accountNumber,
            mobile_number: mobile || mobile_number || '9999999999',
            ref_id: billData.ref_id,
            bill_data: billData,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
          })
          .select()
          .single();

        if (sessionError) {
          console.error('❌ [Bill Fetch] Failed to store session:', sessionError);
          // Continue anyway - don't fail the bill fetch
        } else {
          console.log('✅ [Bill Fetch] Session stored with ref_id:', billData.ref_id);
        }
      } catch (sessionStoreError) {
        console.error('❌ [Bill Fetch] Session storage error:', sessionStoreError);
        // Continue anyway - don't fail the bill fetch
      }

      return NextResponse.json({
        success: true,
        data: billData
      });
    } else {
      // Handle specific KwikAPI error types
      let userMessage = data.message || 'Bill fetch failed';
      let errorType = 'KWIKAPI_ERROR';

      // Handle specific error cases with user-friendly messages
      if (data.message?.includes('Payment channel') && data.message?.includes('disable')) {
        userMessage = 'This operator is temporarily unavailable for bill fetch. Please try again later or enter the amount manually.';
        errorType = 'OPERATOR_UNAVAILABLE';
      } else if (data.message?.includes('Invalid Account Number') || data.message?.includes('Invalid') || data.message?.includes('not found')) {
        userMessage = 'Invalid mobile number for this operator. Please check and try again.';
        errorType = 'INVALID_DETAILS';
      } else if (data.message?.includes('Order Id')) {
        userMessage = 'Technical error with order generation. Please try again.';
        errorType = 'ORDER_ERROR';
      }

      return NextResponse.json({
        success: false,
        message: userMessage,
        error: errorType,
        kwikapi_message: data.message, // Keep original message for debugging
        kwikapi_response: data
      }, { status: 200 }); // Return 200 for failed bill fetch, not 400
    }

  } catch (error: any) {
    console.error('❌ [KwikAPI] Bill fetch error:', error);
    
    // Handle different types of errors with user-friendly messages
    let userMessage = 'Unable to fetch bill details at the moment. Please try again.';
    let errorType = 'INTERNAL_ERROR';
    
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      userMessage = 'Request timed out. The bill fetch service is taking too long to respond. Please try again.';
      errorType = 'TIMEOUT_ERROR';
    } else if (error.message?.includes('fetch')) {
      userMessage = 'Network error occurred while fetching bill details. Please check your connection and try again.';
      errorType = 'NETWORK_ERROR';
    } else if (error.message?.includes('KwikAPI request failed')) {
      userMessage = 'The bill fetch service is temporarily unavailable. Please try again later or enter the amount manually.';
      errorType = 'SERVICE_ERROR';
    }
    
    return NextResponse.json({
      success: false,
      message: userMessage,
      error: errorType,
      debug_message: error.message // Keep for debugging
    }, { status: 200 }); // Return 200 so frontend can handle gracefully
  }
}