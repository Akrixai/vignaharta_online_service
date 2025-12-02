import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { mobile_number } = await request.json();

    if (!mobile_number || !/^[0-9]{10}$/.test(mobile_number)) {
      return NextResponse.json(
        { success: false, message: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('operator_detection_cache')
      .select('*, operator:recharge_operators(*), circle:recharge_circles(*)')
      .eq('mobile_number', mobile_number)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return NextResponse.json({
        success: true,
        data: {
          mobile_number,
          operator_code: cached.operator?.operator_code,
          operator_name: cached.operator?.operator_name,
          circle_code: cached.circle?.circle_code,
          circle_name: cached.circle?.circle_name,
          operator_type: cached.operator_type,
          cached: true,
        },
      });
    }

    // Detect from KWIKAPI
    const detection = await kwikapi.detectOperator(mobile_number);

    if (detection.success) {
      // Find operator and circle in our database
      const { data: operator } = await supabase
        .from('recharge_operators')
        .select('id')
        .eq('operator_code', detection.data.operator_code)
        .single();

      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('id')
        .eq('circle_code', detection.data.circle_code)
        .single();

      // Cache the result
      if (operator && circle) {
        await supabase.from('operator_detection_cache').upsert({
          mobile_number,
          operator_id: operator.id,
          circle_id: circle.id,
          operator_type: detection.data.operator_type,
          detected_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        data: detection.data,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Operator detection failed' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Operator Detection API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
