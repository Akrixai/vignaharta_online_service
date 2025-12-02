import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorCode = searchParams.get('operator_code');
    const circleCode = searchParams.get('circle_code');
    const serviceType = searchParams.get('service_type');

    if (!operatorCode) {
      return NextResponse.json(
        { success: false, message: 'Operator code is required' },
        { status: 400 }
      );
    }

    // Fetch from KWIKAPI based on service type
    let plansResponse;
    
    if (serviceType === 'DTH') {
      plansResponse = await kwikapi.fetchDTHPlans({
        operator_code: operatorCode,
      });
    } else {
      // Prepaid
      if (!circleCode) {
        return NextResponse.json(
          { success: false, message: 'Circle code is required for prepaid plans' },
          { status: 400 }
        );
      }
      
      plansResponse = await kwikapi.fetchPrepaidPlans({
        operator_code: operatorCode,
        circle_code: circleCode,
      });
    }

    if (plansResponse.success) {
      // Get operator and circle IDs
      const { data: operator } = await supabase
        .from('recharge_operators')
        .select('id')
        .eq('operator_code', operatorCode)
        .single();

      let circleId = null;
      if (circleCode) {
        const { data: circle } = await supabase
          .from('recharge_circles')
          .select('id')
          .eq('circle_code', circleCode)
          .single();
        circleId = circle?.id;
      }

      // Store/update plans in database
      if (operator && plansResponse.data.plans) {
        const plansToUpsert = plansResponse.data.plans.map((plan: any) => ({
          operator_id: operator.id,
          circle_id: circleId,
          plan_id: plan.plan_id,
          amount: plan.amount,
          validity: plan.validity,
          plan_type: plan.type || plan.category,
          description: plan.description,
          data_benefit: plan.data || null,
          voice_benefit: plan.voice || null,
          sms_benefit: plan.sms || null,
          features: plan.features || [],
          is_active: true,
        }));

        await supabase
          .from('recharge_plans')
          .upsert(plansToUpsert, {
            onConflict: 'plan_id,operator_id,circle_id',
          });
      }

      return NextResponse.json({
        success: true,
        data: plansResponse.data,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch plans' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Plans API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
