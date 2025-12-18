import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const opid = searchParams.get('opid');
    const serviceType = searchParams.get('service_type');

    if (!opid || !serviceType) {
      return NextResponse.json(
        { success: false, message: 'Missing opid or service_type parameter' },
        { status: 400 }
      );
    }

    // Get operator configuration
    const { data: operator, error } = await supabase
      .from('recharge_operators')
      .select('*')
      .eq('kwikapi_opid', parseInt(opid))
      .eq('service_type', serviceType.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !operator) {
      return NextResponse.json(
        { success: false, message: 'Operator not found or not configured' },
        { status: 404 }
      );
    }

    // Prepare response based on user role
    const response: any = {
      success: true,
      data: {
        operator_name: operator.operator_name,
        service_type: operator.service_type,
        min_amount: operator.min_amount,
        max_amount: operator.max_amount,
        is_active: operator.is_active,
      },
    };

    // Add reward information based on user role
    if (dbUser.role === 'CUSTOMER') {
      // For customers, show cashback info if enabled
      response.data.reward_info = {
        type: 'cashback',
        enabled: operator.cashback_enabled,
        min_percentage: operator.cashback_enabled ? operator.cashback_min_percentage : 0,
        max_percentage: operator.cashback_enabled ? operator.cashback_max_percentage : 0,
        description: operator.cashback_enabled 
          ? `Get random cashback between ${operator.cashback_min_percentage}% - ${operator.cashback_max_percentage}%`
          : 'No cashback available for this operator',
      };
    } else {
      // For retailers/employees, show commission info
      response.data.reward_info = {
        type: 'commission',
        enabled: true,
        percentage: operator.commission_rate,
        description: `Earn ${operator.commission_rate}% commission on successful transactions`,
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Operator Config API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}