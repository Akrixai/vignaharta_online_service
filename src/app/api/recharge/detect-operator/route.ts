import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        { success: false, message: 'Operator detection service not available' },
        { status: 500 }
      );
    }

    // Check cache first
    const { data: cachedResult } = await supabase
      .from('operator_detection_cache')
      .select('*')
      .eq('mobile_number', mobile_number)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResult) {
      const { data: operator } = await supabase
        .from('kwikapi_billers')
        .select('*')
        .eq('id', cachedResult.operator_id)
        .single();

      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('*')
        .eq('id', cachedResult.circle_id)
        .single();

      if (operator && circle) {
        return NextResponse.json({
          success: true,
          data: {
            mobile_number,
            operator_code: `KWIKAPI_${operator.operator_id}`,
            operator_name: operator.operator_name,
            kwikapi_opid: operator.operator_id,
            circle_code: circle.circle_code,
            circle_name: circle.circle_name,
            detection_method: 'cache'
          }
        });
      }
    }

    // Fetch from KwikAPI
    const formData = new FormData();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('number', mobile_number);

    const response = await fetch(`${KWIKAPI_BASE_URL}/api/v2/operator_fetch_v2.php`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to detect operator from KwikAPI');
    }

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to detect operator'
      });
    }

    const details = data.details;
    if (!details || !details.provider || !details.opid) {
      return NextResponse.json({
        success: false,
        message: 'Incomplete operator information received'
      });
    }

    // Find matching operator in our database using kwikapi_billers table
    const { data: operators } = await supabase
      .from('kwikapi_billers')
      .select('*')
      .eq('operator_id', parseInt(details.opid))
      .eq('service_type', 'Prepaid')
      .eq('is_active', true);

    let matchedOperator = null;
    if (operators && operators.length > 0) {
      matchedOperator = operators[0];
    } else {
      // Try to find by name matching
      const { data: allOperators } = await supabase
        .from('kwikapi_billers')
        .select('*')
        .eq('service_type', 'Prepaid')
        .eq('is_active', true);

      if (allOperators) {
        const providerName = details.provider.toUpperCase();
        matchedOperator = allOperators.find(op => {
          const opName = op.operator_name.toUpperCase();
          return (providerName.includes('JIO') && opName.includes('JIO')) ||
                 (providerName.includes('AIRTEL') && opName.includes('AIRTEL')) ||
                 (providerName.includes('VI') && opName.includes('VI')) ||
                 (providerName.includes('VODAFONE') && opName.includes('VODAFONE')) ||
                 (providerName.includes('IDEA') && opName.includes('IDEA')) ||
                 (providerName.includes('BSNL') && opName.includes('BSNL'));
        });
      }
    }

    // Find circle (use default if not found)
    let matchedCircle = null;
    if (details.circle_code && details.circle_code !== 'Unknown') {
      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('*')
        .eq('circle_code', details.circle_code)
        .single();
      matchedCircle = circle;
    }

    // Use default circle if not found
    if (!matchedCircle) {
      const { data: defaultCircle } = await supabase
        .from('recharge_circles')
        .select('*')
        .eq('circle_code', '4') // Maharashtra as default
        .single();
      matchedCircle = defaultCircle;
    }

    if (!matchedOperator || !matchedCircle) {
      return NextResponse.json({
        success: false,
        message: 'Operator or circle not found in our database'
      });
    }

    // Cache the result
    await supabase
      .from('operator_detection_cache')
      .upsert({
        mobile_number,
        operator_id: matchedOperator.id,
        circle_id: matchedCircle.id,
        operator_type: 'PREPAID',
        detected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      }, { onConflict: 'mobile_number' });

    return NextResponse.json({
      success: true,
      data: {
        mobile_number,
        operator_code: `KWIKAPI_${matchedOperator.operator_id}`,
        operator_name: matchedOperator.operator_name,
        kwikapi_opid: matchedOperator.operator_id,
        circle_code: matchedCircle.circle_code,
        circle_name: matchedCircle.circle_name,
        detection_method: 'kwikapi',
        raw_response: data
      }
    });

  } catch (error: any) {
    console.error('Operator Detection API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}