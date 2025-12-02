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

    // Get operator with kwikapi_opid
    const { data: operator } = await supabase
      .from('recharge_operators')
      .select('id, operator_code, operator_name, kwikapi_opid, service_type')
      .eq('operator_code', operatorCode)
      .single();

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Operator not found' },
        { status: 404 }
      );
    }

    if (!operator.kwikapi_opid) {
      console.log('Operator missing kwikapi_opid:', operator.operator_code);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Operator not synced with KWIKAPI. Please sync operators from admin panel first.',
          data: { plans: [] }
        },
        { status: 200 } // Return 200 with empty plans instead of error
      );
    }

    console.log('Fetching plans for operator:', {
      operator_code: operatorCode,
      kwikapi_opid: operator.kwikapi_opid,
      circle_code: circleCode,
      service_type: serviceType
    });

    // Fetch plans from KWIKAPI
    let plansResponse;
    
    if (serviceType === 'DTH' || operator.service_type === 'DTH') {
      // DTH plans don't need circle
      plansResponse = await kwikapi.fetchDTHPlans({
        opid: operator.kwikapi_opid,
      });
    } else {
      // Prepaid/Postpaid need circle code
      if (!circleCode) {
        return NextResponse.json(
          { success: false, message: 'Circle code is required for prepaid/postpaid plans' },
          { status: 400 }
        );
      }

      plansResponse = await kwikapi.fetchPrepaidPlans({
        opid: operator.kwikapi_opid,
        circle_code: circleCode,
      });
    }

    if (!plansResponse.success) {
      console.error('KWIKAPI plans fetch failed:', plansResponse);
      return NextResponse.json(
        { 
          success: false, 
          message: plansResponse.message || 'Failed to fetch plans from KWIKAPI',
          data: { plans: [] }
        },
        { status: 200 } // Return 200 with empty plans
      );
    }

    // Format plans for frontend
    const plans = plansResponse.data.plans || [];
    const formattedPlans = plans.map((plan: any) => ({
      plan_id: plan.plan_id,
      amount: parseFloat(plan.amount),
      validity: plan.validity || 'N/A',
      type: plan.plan_type || plan.category || 'GENERAL',
      category: plan.category || 'GENERAL',
      description: plan.description || `₹${plan.amount} Plan`,
      data: plan.data || '',
      voice: plan.voice || '',
      sms: plan.sms || '',
      features: [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans: formattedPlans,
        operator: plansResponse.data.operator || operator.operator_name,
        circle: plansResponse.data.circle,
        total: formattedPlans.length,
        message: plansResponse.data.message,
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
