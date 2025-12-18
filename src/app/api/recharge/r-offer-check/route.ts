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

    const { mobile_number } = await request.json();

    if (!mobile_number || mobile_number.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Valid 10-digit mobile number required' },
        { status: 400 }
      );
    }

    if (!KWIKAPI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'R-OFFER service not available' },
        { status: 500 }
      );
    }

    // First detect the operator to get the opid
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const detectResponse = await fetch(`${baseUrl}/api/recharge/detect-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number }),
    });

    const detectData = await detectResponse.json();
    
    if (!detectData.success || !detectData.data?.kwikapi_opid) {
      return NextResponse.json({
        success: false,
        message: 'Unable to detect operator for R-OFFER check',
        data: { supported: false }
      });
    }

    const opid = detectData.data.kwikapi_opid;
    const operatorName = detectData.data.operator_name;

    // R-OFFER is only available for Airtel (opid: 1) and VI (opid: 3)
    const supportedOpids = [1, 3]; // Airtel and VI
    if (!supportedOpids.includes(parseInt(opid))) {
      return NextResponse.json({
        success: false,
        message: `R-OFFER service is only available for Airtel and VI networks. Your operator: ${operatorName}`,
        data: { 
          supported: false,
          operator_name: operatorName,
          opid: opid
        }
      });
    }

    console.log('🔍 [R-OFFER] Checking R-OFFERS for:', {
      mobile_number,
      operator: operatorName,
      opid
    });

    // Fetch R-offers from KwikAPI
    const formData = new FormData();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('opid', opid.toString());
    formData.append('mobile', mobile_number);

    const response = await fetch(`${KWIKAPI_BASE_URL}/api/v2/R-OFFER_check.php`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to fetch R-offers from KwikAPI');
    }

    const data = await response.json();
    console.log('📦 [R-OFFER] KwikAPI Response:', data);

    if (!data.success) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to fetch R-offers',
        data: { 
          supported: true,
          operator_name: operatorName,
          opid: opid
        }
      });
    }

    const offers = data.offers || [];

    // Transform offers to our format
    const transformedOffers = offers.map((offer: any, index: number) => ({
      id: `roffer_${opid}_${mobile_number}_${index}`,
      price: parseFloat(offer.price),
      amount: parseFloat(offer.price),
      offer_text: offer.ofrtext || '',
      description: offer.ofrtext || '',
      long_description: offer.logdesc || '',
      validity: extractValidity(offer.ofrtext, offer.logdesc),
      data_benefit: extractDataBenefit(offer.ofrtext, offer.logdesc),
      voice_benefit: extractVoiceBenefit(offer.ofrtext, offer.logdesc),
      commission_unit: offer.commissionUnit || 'A',
      commission_amount: parseFloat(offer.commissionAmount || '0'),
      type: 'R-OFFER',
      category: 'SPECIAL_OFFER',
      operator: data.operator || operatorName,
      mobile_number: data.mobile_no || mobile_number,
      original_price: null, // R-offers don't have original price
      discount: null, // Calculate if needed
      features: parseFeatures(offer.ofrtext, offer.logdesc)
    }));

    console.log('✅ [R-OFFER] Found', transformedOffers.length, 'offers for', operatorName);

    return NextResponse.json({
      success: true,
      data: {
        operator_name: data.operator || operatorName,
        mobile_number: data.mobile_no || mobile_number,
        message: data.message,
        hit_credit: data.hit_credit,
        offers: transformedOffers,
        total_offers: transformedOffers.length,
        supported: true,
        opid: opid
      }
    });

  } catch (error: any) {
    console.error('❌ [R-OFFER] API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions to extract information from offer text
function extractValidity(ofrtext: string, logdesc: string): string {
  const text = `${ofrtext} ${logdesc}`.toLowerCase();
  
  // Look for validity patterns
  const validityPatterns = [
    /(\d+)\s*days?/i,
    /(\d+)\s*d(?:\s|$)/i,
    /(\d+)\s*months?/i,
    /(\d+)\s*m(?:\s|$)/i,
    /validity.*?(\d+)/i
  ];

  for (const pattern of validityPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      if (value > 0) {
        if (text.includes('month') || (value > 31 && value < 400)) {
          return `${Math.floor(value / 30)} months`;
        }
        return `${value} days`;
      }
    }
  }

  return 'Check offer details';
}

function extractDataBenefit(ofrtext: string, logdesc: string): string {
  const text = `${ofrtext} ${logdesc}`.toLowerCase();
  
  // Look for data patterns
  const dataPatterns = [
    /(\d+\.?\d*)\s*gb\/day/i,
    /(\d+\.?\d*)\s*gb\/d/i,
    /(\d+\.?\d*)\s*gb\s*data/i,
    /(\d+\.?\d*)\s*gb/i,
    /(\d+)\s*mb\/day/i,
    /(\d+)\s*mb/i,
    /ul\s*data/i,
    /unlimited\s*data/i
  ];

  for (const pattern of dataPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('ul') || pattern.source.includes('unlimited')) {
        return 'Unlimited Data';
      }
      return match[0].toUpperCase();
    }
  }

  return 'Check offer details';
}

function extractVoiceBenefit(ofrtext: string, logdesc: string): string {
  const text = `${ofrtext} ${logdesc}`.toLowerCase();
  
  if (text.includes('ul calls') || text.includes('unlimited calls')) {
    return 'Unlimited Calls';
  }
  
  const voiceMatch = text.match(/(\d+)\s*minutes?/i);
  if (voiceMatch) {
    return `${voiceMatch[1]} minutes`;
  }

  return 'Check offer details';
}

function parseFeatures(ofrtext: string, logdesc: string): string[] {
  const text = `${ofrtext} ${logdesc}`.toLowerCase();
  const features: string[] = [];

  // Common features to look for
  const featurePatterns = [
    { pattern: /jiohotstar|hotstar/i, feature: 'JioHotstar' },
    { pattern: /apple music/i, feature: 'Apple Music' },
    { pattern: /xstream play/i, feature: 'Airtel Xstream Play' },
    { pattern: /netflix/i, feature: 'Netflix' },
    { pattern: /amazon prime/i, feature: 'Amazon Prime' },
    { pattern: /disney/i, feature: 'Disney+' },
    { pattern: /ul 5g|unlimited 5g/i, feature: 'Unlimited 5G' },
    { pattern: /(\d+)\s*sms/i, feature: 'SMS Benefits' },
    { pattern: /roaming/i, feature: 'Roaming Benefits' }
  ];

  featurePatterns.forEach(({ pattern, feature }) => {
    if (pattern.test(text)) {
      features.push(feature);
    }
  });

  return features;
}