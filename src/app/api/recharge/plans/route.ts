import { NextRequest, NextResponse } from 'next/server';

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com/api/v2';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorCode = searchParams.get('operator_code');
    const circleCode = searchParams.get('circle_code');
    const serviceType = searchParams.get('service_type');

    console.log('📋 Plans API Request:', {
      operatorCode,
      circleCode,
      serviceType,
      hasApiKey: !!KWIKAPI_API_KEY,
      apiKeyLength: KWIKAPI_API_KEY?.length,
      apiKeyPreview: KWIKAPI_API_KEY ? `${KWIKAPI_API_KEY.substring(0, 6)}...` : 'undefined'
    });

    if (!operatorCode) {
      return NextResponse.json(
        { success: false, message: 'Operator code is required' },
        { status: 400 }
      );
    }

    // For DTH, circle is not required
    if (serviceType !== 'DTH' && !circleCode) {
      return NextResponse.json(
        { success: false, message: 'Circle code is required for mobile recharge' },
        { status: 400 }
      );
    }

    // Fetch plans from KWIKAPI using URLSearchParams (form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('opid', operatorCode);

    // Only add state_code for non-DTH services (mobile recharge needs circle)
    if (circleCode && serviceType !== 'DTH') {
      formData.append('state_code', circleCode);
    }

    console.log('🌐 Calling KWIKAPI:', {
      url: `${KWIKAPI_BASE_URL}/recharge_plans.php`,
      opid: operatorCode,
      state_code: (serviceType === 'DTH') ? 'Not required for DTH' : (circleCode || 'N/A'),
      serviceType,
      method: 'POST (form-urlencoded)'
    });

    const response = await fetch(`${KWIKAPI_BASE_URL}/recharge_plans.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('📡 KWIKAPI Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ KWIKAPI HTTP Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return NextResponse.json(
        {
          success: false,
          message: `KWIKAPI returned ${response.status}: ${response.statusText}`,
          details: errorText
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log('📦 KWIKAPI Response Data:', {
      success: data.success,
      hasPlans: !!data.plans,
      planKeys: data.plans ? Object.keys(data.plans) : [],
      operator: data.operator,
      circle: data.circle,
      message: data.message
    });

    if (!data.success) {
      console.error('❌ KWIKAPI returned success:false', data);
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch plans from KWIKAPI',
          kwikapi_response: data
        },
        { status: 500 }
      );
    }

    // Transform the plans data to include categories
    const plans = data.plans || {};
    const categories: any[] = [];

    // Define category display order and names
    const categoryConfig: Record<string, { name: string; icon: string; order: number }> = {
      FULLTT: { name: 'All-in-One', icon: '🎯', order: 1 },
      TOPUP: { name: 'Top-up', icon: '💰', order: 2 },
      DATA: { name: 'Data', icon: '📊', order: 3 },
      SMS: { name: 'SMS', icon: '💬', order: 4 },
      'RATE_CUTTER': { name: 'Rate Cutter', icon: '✂️', order: 5 },
      '2G': { name: '2G', icon: '📱', order: 6 },
      TwoG: { name: '2G', icon: '📱', order: 6 },
      Romaing: { name: 'Roaming', icon: '✈️', order: 7 },
      COMBO: { name: 'Combo', icon: '🎁', order: 8 },
      FRC: { name: 'First Recharge', icon: '🆕', order: 9 },
      JioPhone: { name: 'JioPhone', icon: '📞', order: 10 },
      STV: { name: 'Special', icon: '⭐', order: 11 },
    };

    // Process each category
    Object.keys(plans).forEach((categoryKey) => {
      const categoryPlans = plans[categoryKey];

      // Skip if no plans or null
      if (!categoryPlans || categoryPlans.length === 0) {
        return;
      }

      const config = categoryConfig[categoryKey] || {
        name: categoryKey,
        icon: '📋',
        order: 99,
      };

      categories.push({
        code: categoryKey,
        name: config.name,
        icon: config.icon,
        order: config.order,
        plans: categoryPlans.map((plan: any) => ({
          amount: plan.rs,
          validity: plan.validity,
          description: plan.desc,
          type: plan.Type || categoryKey,
        })),
      });
    });

    // Sort categories by order
    categories.sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      data: {
        operator: data.operator,
        circle: data.circle,
        message: data.message,
        categories,
        totalPlans: categories.reduce((sum, cat) => sum + cat.plans.length, 0),
      },
    });
  } catch (error: any) {
    console.error('Plans API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
