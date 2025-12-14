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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mobile_number } = await request.json();

    if (!mobile_number || !/^[0-9]{10}$/.test(mobile_number)) {
      return NextResponse.json(
        { success: false, message: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    console.log('🔍 [API] Real-time operator detection requested for:', mobile_number);

    // ALWAYS fetch from KWIKAPI in real-time (no cache check)
    const detection = await kwikapi.detectOperator(mobile_number);

    console.log('📦 [API] KWIKAPI detection result:', detection);

    if (detection.success) {
      // Find operator in our database - try multiple matching strategies
      let operator = null;
      
      // Strategy 1: Try to match by kwikapi_opid if available
      if (detection.data.kwikapi_opid) {
        const { data: opByOpid } = await supabase
          .from('recharge_operators')
          .select('*')
          .eq('kwikapi_opid', detection.data.kwikapi_opid)
          .eq('service_type', 'PREPAID')
          .eq('is_active', true)
          .single();
        operator = opByOpid;
        if (operator) {
          console.log('✅ [API] Operator matched by kwikapi_opid:', operator.operator_name);
        }
      }
      
      // Strategy 2: If not found by opid, try exact match by operator_code
      if (!operator && detection.data.operator_code) {
        const { data: opByCode } = await supabase
          .from('recharge_operators')
          .select('*')
          .eq('operator_code', detection.data.operator_code)
          .eq('service_type', 'PREPAID')
          .eq('is_active', true)
          .single();
        operator = opByCode;
        if (operator) {
          console.log('✅ [API] Operator matched by exact operator_code:', operator.operator_name);
        }
      }
      
      // Strategy 2b: If still not found, try pattern matching by operator_code
      if (!operator && detection.data.operator_code) {
        const { data: opByCodePattern } = await supabase
          .from('recharge_operators')
          .select('*')
          .ilike('operator_code', `%${detection.data.operator_code}%`)
          .eq('service_type', 'PREPAID')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        operator = opByCodePattern;
        if (operator) {
          console.log('✅ [API] Operator matched by operator_code pattern:', operator.operator_name);
        }
      }
      
      // Strategy 3: If still not found, try matching by operator name
      if (!operator && detection.data.operator_name) {
        const operatorName = detection.data.operator_name.toUpperCase();
        let searchPattern = '';
        
        // Map common operator names to search patterns
        if (operatorName.includes('JIO') || operatorName.includes('RELIANCE')) {
          searchPattern = '%JIO_OFFICIAL%';
        } else if (operatorName.includes('AIRTEL')) {
          searchPattern = '%AIRTEL_OFFICIAL%';
        } else if (operatorName.includes('VI') || operatorName.includes('VODAFONE') || operatorName.includes('IDEA')) {
          searchPattern = '%VI_OFFICIAL%';
        } else if (operatorName.includes('BSNL')) {
          searchPattern = '%BSNL%';
        }
        
        if (searchPattern) {
          const { data: opByName } = await supabase
            .from('recharge_operators')
            .select('*')
            .ilike('operator_code', searchPattern)
            .eq('service_type', 'PREPAID')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          operator = opByName;
          if (operator) {
            console.log('✅ [API] Operator matched by name pattern:', operator.operator_name);
          }
        }
      }

      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('*')
        .eq('circle_code', detection.data.circle_code)
        .single();

      console.log('📊 [API] Database lookup:', {
        operator: operator ? {
          id: operator.id,
          name: operator.operator_name,
          code: operator.operator_code,
          kwikapi_opid: operator.kwikapi_opid
        } : null,
        circle: circle ? {
          id: circle.id,
          name: circle.circle_name,
          code: circle.circle_code
        } : null
      });

      // Update cache with latest real-time data (for reference only, not used for detection)
      if (operator && circle) {
        await supabase.from('operator_detection_cache').upsert({
          mobile_number,
          operator_id: operator.id,
          circle_id: circle.id,
          operator_type: detection.data.operator_type,
          detected_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        console.log('💾 [API] Cache updated with real-time data');
      }

      return NextResponse.json({
        success: true,
        data: {
          mobile_number,
          operator_code: operator?.operator_code || detection.data.operator_code,
          operator_name: operator?.operator_name || detection.data.operator_name,
          circle_code: circle?.circle_code || detection.data.circle_code,
          circle_name: circle?.circle_name || detection.data.circle_name,
          operator_type: detection.data.operator_type,
          kwikapi_opid: detection.data.kwikapi_opid,
          detection_method: detection.data.detection_method,
          cached: false, // Always false since we always fetch real-time
          credit_balance: detection.data.api_response?.credit_balance,
        },
      });
    }

    console.warn('⚠️ [API] Operator detection failed');
    return NextResponse.json(
      { success: false, message: detection.message || 'Operator detection failed' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('❌ [API] Operator Detection Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
