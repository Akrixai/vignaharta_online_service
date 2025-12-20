import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const KWIKAPI_BASE_URL = process.env.KWIKAPI_BASE_URL || 'https://www.kwikapi.com';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY || '';

/**
 * R-Offer Check API for Airtel and VI operators
 * POST /api/recharge/r-offer-check
 * 
 * This API checks available R-Offers for a mobile number on Airtel and VI networks
 * R-Offers are special recharge plans that provide additional benefits
 */
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
    const { mobile_number, opid } = body;

    // Validate inputs
    if (!mobile_number || !opid) {
      return NextResponse.json(
        { success: false, message: 'Mobile number and operator ID are required' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    // Check if operator supports R-Offer
    // Airtel (1, 177), VI/Vodafone (21, 3, 178), Jio (8, 181)
    const supportedOperators = [1, 21, 3, 177, 178, 8, 181];
    if (!supportedOperators.includes(parseInt(opid))) {
      return NextResponse.json(
        {
          success: false,
          message: `R-Offer check is not available for operator ID ${opid}. Currently supported: Airtel, VI, and Jio.`,
          supported_operators: ['Airtel', 'VI', 'Jio']
        },
        { status: 400 }
      );
    }

    console.log('🎯 [R-OFFER] Checking R-Offers for:', {
      mobile_number: mobile_number.substring(0, 6) + 'XXXX', // Mask for privacy
      opid,
      operator: opid === 1 ? 'Airtel' : 'VI/Vodafone'
    });

    // Prepare form data for KWIKAPI R-Offer check
    const formData = new URLSearchParams();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('opid', opid.toString());
    formData.append('mobile', mobile_number);

    console.log('📡 [R-OFFER] API Call:', {
      url: `${KWIKAPI_BASE_URL}/api/v2/R-OFFER_check.php`,
      opid,
      mobile: mobile_number.substring(0, 6) + 'XXXX'
    });

    // Implement timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Call KWIKAPI R-Offer check endpoint
    const response = await fetch(`${KWIKAPI_BASE_URL}/api/v2/R-OFFER_check.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('📦 [R-OFFER] Raw Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [R-OFFER] JSON Parse Error:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid response from R-Offer service',
        error: 'PARSE_ERROR'
      }, { status: 500 });
    }

    console.log('📦 [R-OFFER] Parsed Response:', data);

    // Check if the response indicates success
    if (data.success === true || data.success === 'true') {
      // Process and format the offers
      const offers = (data.offers || []).map((offer: any, index: number) => ({
        id: `roffer_${index}`,
        price: parseFloat(offer.price || 0),
        amount: parseFloat(offer.price || 0),
        description: offer.ofrtext || offer.logdesc || 'Special R-Offer',
        validity: extractValidity(offer.ofrtext || offer.logdesc || ''),
        data_benefit: extractDataBenefit(offer.ofrtext || offer.logdesc || ''),
        voice_benefit: extractVoiceBenefit(offer.ofrtext || offer.logdesc || ''),
        sms_benefit: extractSMSBenefit(offer.ofrtext || offer.logdesc || ''),
        plan_type: 'R-OFFER',
        commission_unit: offer.commissionUnit || 'A',
        commission_amount: parseFloat(offer.commissionAmount || 0),
        features: parseFeatures(offer.ofrtext || offer.logdesc || ''),
        raw_offer: offer // Keep original data for reference
      }));

      return NextResponse.json({
        success: true,
        data: {
          mobile_number,
          operator: data.operator || (opid === 1 ? 'Airtel' : 'VI/Vodafone'),
          hit_credit: data.hit_credit,
          message: data.message || 'R-Offers fetched successfully',
          offers_count: offers.length,
          offers: offers
        }
      });
    } else {
      // Handle API errors
      const errorMessage = data.message || 'Failed to fetch R-Offers';
      console.warn('⚠️ [R-OFFER] KwikAPI returned failure:', {
        message: errorMessage,
        mobile: mobile_number.substring(0, 6) + 'XXXX',
        opid,
        full_response: data
      });

      return NextResponse.json({
        success: false,
        message: errorMessage,
        error: 'API_ERROR',
        kwikapi_response: data
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ [R-OFFER] API Error:', error);

    let errorMessage = 'Failed to check R-Offers';
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network connection failed. Please check your internet connection.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: 'NETWORK_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper functions to extract benefits from offer text
function extractValidity(text: string): string {
  const validityMatch = text.match(/(\d+)\s*(day|days|D)/i);
  if (validityMatch) {
    return `${validityMatch[1]} days`;
  }

  const monthMatch = text.match(/(\d+)\s*(month|months|M)/i);
  if (monthMatch) {
    return `${monthMatch[1]} months`;
  }

  return 'N/A';
}

function extractDataBenefit(text: string): string {
  // Look for data patterns like "2GB", "1.5GB/day", "UL data"
  const dataMatch = text.match(/(UL|unlimited|\d+(?:\.\d+)?)\s*(GB|MB|gb|mb)(?:\/day|\/D)?/i);
  if (dataMatch) {
    if (dataMatch[1].toLowerCase() === 'ul' || dataMatch[1].toLowerCase() === 'unlimited') {
      return 'Unlimited';
    }
    return `${dataMatch[1]}${dataMatch[2].toUpperCase()}${text.includes('/day') || text.includes('/D') ? '/day' : ''}`;
  }

  return 'N/A';
}

function extractVoiceBenefit(text: string): string {
  if (text.toLowerCase().includes('ul call') || text.toLowerCase().includes('unlimited call')) {
    return 'Unlimited';
  }

  const voiceMatch = text.match(/(\d+)\s*(min|minutes)/i);
  if (voiceMatch) {
    return `${voiceMatch[1]} minutes`;
  }

  return 'N/A';
}

function extractSMSBenefit(text: string): string {
  const smsMatch = text.match(/(\d+)\s*SMS(?:\/day|\/D)?/i);
  if (smsMatch) {
    return `${smsMatch[1]} SMS${text.includes('/day') || text.includes('/D') ? '/day' : ''}`;
  }

  return 'N/A';
}

function parseFeatures(text: string): string[] {
  const features: string[] = [];

  if (text.toLowerCase().includes('hotstar') || text.toLowerCase().includes('jiohotstar')) {
    features.push('JioHotstar');
  }

  if (text.toLowerCase().includes('apple music')) {
    features.push('Apple Music');
  }

  if (text.toLowerCase().includes('xstream') || text.toLowerCase().includes('airtel xstream')) {
    features.push('Airtel Xstream Play');
  }

  if (text.toLowerCase().includes('5g') || text.toLowerCase().includes('ul 5g')) {
    features.push('5G Data');
  }

  if (text.toLowerCase().includes('roaming')) {
    features.push('Roaming');
  }

  return features;
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'R-Offer Check API',
    description: 'Check available R-Offers for Airtel and VI mobile numbers',
    supported_operators: [
      { opid: 1, name: 'Airtel' },
      { opid: 21, name: 'VI/Vodafone' }
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/recharge/r-offer-check',
      body: {
        mobile_number: '9999999999',
        opid: 1
      }
    }
  });
}