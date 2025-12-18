import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com/api/v2';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY;

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

    const body = await request.json();
    const { opid, number, amount = 10, mobile, opt1, opt2, opt3, opt4, opt5, opt6, opt7, opt8, opt9, opt10 } = body;

    if (!opid || !number) {
      return NextResponse.json(
        { error: 'Missing required parameters: opid and number' },
        { status: 400 }
      );
    }

    // Generate unique order ID (5-14 numeric characters as per KwikAPI requirement)
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits of timestamp
    const orderId = timestamp; // Use timestamp as order ID (10 digits)

    // Build KwikAPI bill validation URL
    const params = new URLSearchParams({
      api_key: KWIKAPI_API_KEY,
      number: number.toString(),
      amount: amount.toString(),
      opid: opid.toString(),
      order_id: orderId,
      opt1: opt1 || '',
      opt2: opt2 || '',
      opt3: opt3 || '',
      opt4: opt4 || '',
      opt5: opt5 || '',
      opt6: opt6 || '',
      opt7: opt7 || '',
      opt8: opt8 || 'Bills',
      opt9: opt9 || '',
      opt10: opt10 || '',
    });

    // Add mobile parameter if provided
    if (mobile) {
      params.append('mobile', mobile.toString());
    }

    const kwikApiUrl = `${KWIKAPI_BASE_URL}/bills/validation.php?${params.toString()}`;

    console.log('🔍 [KwikAPI] Bill fetch request:', {
      opid,
      number,
      amount,
      orderId,
      orderIdLength: orderId.length,
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

    // Call KwikAPI bill validation endpoint
    const response = await fetch(kwikApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'VighnahartaOnlineServices/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`KwikAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📦 [KwikAPI] Bill fetch response:', {
      status: data.status,
      message: data.message,
      hasCustomerName: !!data.customer_name,
      hasDueAmount: !!data.due_amount,
      fullResponse: data
    });

    // Check if the response is successful
    if (data.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        data: {
          status: data.status,
          message: data.message || 'Bill fetched successfully',
          customer_name: data.customer_name || data.customername,
          bill_number: data.bill_number || data.billnumber,
          due_amount: data.due_amount || data.dueamount,
          due_date: data.due_date || data.duedate,
          bill_date: data.bill_date || data.billdate,
          bill_period: data.bill_period || data.billperiod,
          ref_id: data.ref_id || data.refid,
          order_id: orderId,
          kwikapi_response: data
        }
      });
    } else {
      // Handle specific KwikAPI error types
      let userMessage = data.message || 'Bill fetch failed';
      let errorType = 'KWIKAPI_ERROR';

      // Handle specific error cases with user-friendly messages
      if (data.message?.includes('Payment channel') && data.message?.includes('disable')) {
        userMessage = 'This operator is temporarily unavailable for bill fetch. Please try again later or enter the amount manually.';
        errorType = 'OPERATOR_UNAVAILABLE';
      } else if (data.message?.includes('Invalid') || data.message?.includes('not found')) {
        userMessage = 'Invalid mobile number or operator. Please check and try again.';
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
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ [KwikAPI] Bill fetch error:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}