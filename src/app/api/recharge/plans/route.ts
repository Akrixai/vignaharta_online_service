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

    // Get operator
    const { data: operator } = await supabase
      .from('recharge_operators')
      .select('id, operator_code, operator_name')
      .eq('operator_code', operatorCode)
      .single();

    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Operator not found' },
        { status: 404 }
      );
    }

    // Build query for plans from database
    let query = supabase
      .from('recharge_plans')
      .select('*')
      .eq('operator_id', operator.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('amount', { ascending: true });

    // For prepaid, filter by circle
    if (serviceType !== 'DTH' && circleCode) {
      const { data: circle } = await supabase
        .from('recharge_circles')
        .select('id')
        .eq('circle_code', circleCode)
        .single();

      if (circle) {
        query = query.eq('circle_id', circle.id);
      }
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Database error fetching plans:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch plans from database' },
        { status: 500 }
      );
    }

    // Format plans for frontend
    const formattedPlans = (plans || []).map((plan: any) => ({
      plan_id: plan.plan_id,
      amount: parseFloat(plan.amount),
      validity: plan.validity || 'N/A',
      type: plan.plan_type || 'GENERAL',
      category: plan.plan_type || 'GENERAL',
      description: plan.description || `₹${plan.amount} Plan`,
      data: plan.data_benefit || '',
      voice: plan.voice_benefit || '',
      sms: plan.sms_benefit || '',
      features: plan.features || [],
      channels_count: plan.metadata?.channels_count || 0,
      hd_channels: plan.metadata?.hd_channels || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans: formattedPlans,
        operator: operator.operator_name,
        total: formattedPlans.length,
        message: formattedPlans.length === 0 
          ? 'No plans available. Plans need to be added to the database manually or via admin panel.'
          : undefined,
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
