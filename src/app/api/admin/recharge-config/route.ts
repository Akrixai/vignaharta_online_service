import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all operator configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { data: operators, error } = await supabase
      .from('recharge_operators')
      .select('*')
      .order('service_type', { ascending: true })
      .order('operator_name', { ascending: true });

    if (error) throw error;

    // Get global config
    const { data: globalConfig } = await supabase
      .from('recharge_global_config')
      .select('config_key, config_value')
      .in('config_key', ['electricity_commission_rate']);

    const globalConfigMap = globalConfig?.reduce((acc: any, item: any) => {
      acc[item.config_key] = item.config_value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: operators || [],
      globalConfig: globalConfigMap || {},
    });
  } catch (error: any) {
    console.error('Recharge Config GET Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update operator configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { operator_id, commission_rate, min_amount, max_amount, is_active } = body;

    if (!operator_id) {
      return NextResponse.json(
        { success: false, message: 'Operator ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate;
    if (min_amount !== undefined) updateData.min_amount = min_amount;
    if (max_amount !== undefined) updateData.max_amount = max_amount;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('recharge_operators')
      .update(updateData)
      .eq('id', operator_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Operator configuration updated successfully',
    });
  } catch (error: any) {
    console.error('Recharge Config PUT Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
