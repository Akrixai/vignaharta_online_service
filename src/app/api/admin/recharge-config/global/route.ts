import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update global configuration
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
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { config_key, config_value } = body;

    if (!config_key || config_value === undefined) {
      return NextResponse.json(
        { success: false, message: 'Config key and value are required' },
        { status: 400 }
      );
    }

    // Update global config
    const { data, error } = await supabase
      .from('recharge_global_config')
      .upsert({
        config_key,
        config_value: config_value.toString(),
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // If updating electricity commission, update all electricity operators
    if (config_key === 'electricity_commission_rate') {
      await supabase
        .from('recharge_operators')
        .update({ commission_rate: parseFloat(config_value) })
        .eq('service_type', 'ELECTRICITY');
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Global configuration updated successfully',
    });
  } catch (error: any) {
    console.error('Global Config PUT Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
