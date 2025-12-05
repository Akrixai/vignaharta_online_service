import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com/api/v2';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY!;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    // Check if this is a DTH service
    const isDTH = serviceType === 'DTH';

    console.log(`🔍 Service Type: ${isDTH ? 'DTH' : 'Mobile Prepaid'}`);

    // Fetch plans from KWIKAPI using URLSearchParams (form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('opid', operatorCode);

    // Determine which API endpoint to use based on service type
    // DTH has a dedicated endpoint: DTH_plans.php
    // Mobile Prepaid/Postpaid use: recharge_plans.php
    const apiEndpoint = isDTH ? 'DTH_plans.php' : 'recharge_plans.php';

    // For Mobile Prepaid: state_code (circle) is required
    // For DTH: opid is sufficient (DTH plans are nationwide)
    if (!isDTH && circleCode) {
      formData.append('state_code', circleCode);
    }

    console.log(`🌐 Calling KWIKAPI ${apiEndpoint}:`, {
      url: `${KWIKAPI_BASE_URL}/${apiEndpoint}`,
      opid: operatorCode,
      state_code: circleCode || '(Not required for DTH)',
      serviceType,
      isDTH,
      method: 'POST',
      bodyParams: formData.toString()
    });

    const response = await fetch(`${KWIKAPI_BASE_URL}/${apiEndpoint}`, {
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
          details: errorText,
          is_dth: isDTH
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log('📦 KWIKAPI Full Response:', JSON.stringify(data, null, 2));
    console.log('📦 KWIKAPI Response Summary:', {
      success: data.success,
      hasPlans: !!data.plans,
      planKeys: data.plans ? Object.keys(data.plans) : [],
      planKeysCount: data.plans ? Object.keys(data.plans).length : 0,
      operator: data.operator,
      circle: data.circle,
      message: data.message,
      isDTH
    });

    if (!data.success) {
      console.error('❌ KWIKAPI returned success:false', {
        message: data.message,
        fullResponse: data,
        isDTH
      });

      // Special handling for DTH - KWIKAPI may not support DTH plans
      if (isDTH) {
        console.warn('⚠️ DTH Plans Not Supported by KWIKAPI - This is expected behavior');
        return NextResponse.json({
          success: false,
          isDTH: true,
          message: 'DTH recharge plans are not available through the API. Please enter a custom amount.',
          reason: 'dth_plans_not_supported',
          kwikapi_message: data.message,
          suggestion: 'Common DTH amounts: ₹100, ₹200, ₹300, ₹500, ₹1000'
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch plans from KWIKAPI',
          kwikapi_response: data,
          isDTH
        },
        { status: 500 }
      );
    }

    // Transform the plans data to include categories
    const plans = data.plans || {};
    const categories: any[] = [];

    // Check for authorization error in plans object
    if (plans.msg && typeof plans.msg === 'string' && plans.msg.toLowerCase().includes('not authorize')) {
      console.error('❌ KWIKAPI Authorization Error:', plans.msg);
      return NextResponse.json({
        success: false,
        isDTH,
        message: isDTH
          ? 'DTH plan browsing is not enabled for your KWIKAPI account. Please enter a custom recharge amount.'
          : 'Plan browsing is not enabled for your KWIKAPI account.',
        reason: 'kwikapi_not_authorized',
        kwikapi_message: plans.msg,
        suggestion: isDTH ? 'Common DTH amounts: ₹100, ₹200, ₹300, ₹500, ₹1000' : undefined
      });
    }

    // DTH plans have a different structure than mobile prepaid plans
    // DTH: { Combo: [{ Language, PackCount, Details: [{ PlanName, Channels, PricingList: [{ Amount, Month }] }] }] }
    // Mobile: { DATA: [{ rs, validity, desc }], STV: [...] }
    if (isDTH && data.plans?.Combo && Array.isArray(data.plans.Combo)) {
      console.log('📺 Processing DTH plans with language-based structure');

      // Process DTH plans grouped by language
      const dthLanguagePacks = data.plans.Combo;
      let totalDTHPlans = 0;

      dthLanguagePacks.forEach((languagePack: any) => {
        const language = languagePack.Language || 'General';
        const packCount = parseInt(languagePack.PackCount || '0');
        const details = languagePack.Details || [];

        console.log(`📺 Processing ${language} packs: ${packCount} packs with ${details.length} plans`);

        if (details.length === 0) return;

        // Create a category for each language
        const languagePlans: any[] = [];

        details.forEach((plan: any) => {
          const planName = plan.PlanName || 'Unnamed Plan';
          const channels = plan.Channels || 'N/A';
          const paidChannels = plan.PaidChannels || 'N/A';
          const hdChannels = plan.HdChannels || 'No HD';
          const pricingList = plan.PricingList || [];

          // Each plan can have multiple pricing options (1 month, 3 months, etc.)
          pricingList.forEach((pricing: any) => {
            const amount = pricing.Amount?.replace('₹', '').trim() || '0';
            const validity = pricing.Month || 'N/A';

            languagePlans.push({
              amount: parseFloat(amount),
              validity: validity,
              description: `${planName} - ${channels} (${paidChannels}, ${hdChannels})`,
              type: language,
              planName: planName,
              channels: channels,
              paidChannels: paidChannels,
              hdChannels: hdChannels,
              lastUpdate: plan.last_update || 'N/A'
            });
            totalDTHPlans++;
          });
        });

        if (languagePlans.length > 0) {
          // Language icons
          const languageIcons: Record<string, string> = {
            'Hindi': '🇮🇳',
            'English': '🇬🇧',
            'Tamil': '🎭',
            'Telugu': '🎬',
            'Kannada': '🎪',
            'Malayalam': '🎨',
            'Marathi': '🎯',
            'Bengali': '📚',
            'Bangla': '📚',
            'Gujarati': '🎵',
            'Punjabi': '🎸',
            'Odia': '🎺',
            'Assamese': '🎻'
          };

          categories.push({
            code: language.toUpperCase().replace(/\s+/g, '_'),
            name: `${language} Packs`,
            icon: languageIcons[language] || '📺',
            order: categories.length + 1,
            plans: languagePlans.sort((a, b) => a.amount - b.amount) // Sort by amount
          });
        }
      });

      console.log(`✅ Successfully processed ${categories.length} language categories with ${totalDTHPlans} total DTH plans`);

      return NextResponse.json({
        success: true,
        data: {
          operator: data.operator,
          circle: data.circle,
          message: data.message,
          categories,
          totalPlans: totalDTHPlans,
          isDTH: true
        },
      });
    }

    // Mobile prepaid/postpaid plans processing (existing logic)
    const totalPlanCount = Object.keys(plans).reduce((count, key) => {
      const planArray = plans[key];
      return count + (Array.isArray(planArray) ? planArray.length : 0);
    }, 0);

    console.log(`📊 Total plans found: ${totalPlanCount}`);

    if (totalPlanCount === 0) {
      console.warn('⚠️ No plans returned by KWIKAPI');
      return NextResponse.json({
        success: false,
        isDTH,
        message: isDTH
          ? 'No DTH plans available. Please enter a custom recharge amount.'
          : 'No plans available for this operator.',
        reason: 'no_plans_available',
        suggestion: isDTH ? 'Common DTH amounts: ₹100, ₹200, ₹300, ₹500, ₹1000' : undefined
      });
    }

    // Define category display order and names for mobile prepaid
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
      Combo: { name: 'Combo', icon: '🎁', order: 8 },
      FRC: { name: 'First Recharge', icon: '🆕', order: 9 },
      JioPhone: { name: 'JioPhone', icon: '📞', order: 10 },
      STV: { name: 'Special', icon: '⭐', order: 11 },
    };

    // Process each category for mobile prepaid
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

    console.log(`✅ Successfully processed ${categories.length} plan categories with ${categories.reduce((sum, cat) => sum + cat.plans.length, 0)} total plans`);

    return NextResponse.json({
      success: true,
      data: {
        operator: data.operator,
        circle: data.circle,
        message: data.message,
        categories,
        totalPlans: categories.reduce((sum, cat) => sum + cat.plans.length, 0),
        isDTH
      },
    });
  } catch (error: any) {
    console.error('❌ Plans API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error', error: error.toString() },
      { status: 500 }
    );
  }
}
