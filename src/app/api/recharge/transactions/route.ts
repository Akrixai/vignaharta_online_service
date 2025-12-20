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

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const serviceType = searchParams.get('service_type');

    let query = supabase
      .from('recharge_transactions')
      .select(`
        *,
        operator:recharge_operators(operator_name, operator_code, logo_url),
        circle:recharge_circles(circle_name, circle_code),
        user:users(name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Non-admin users can only see their own transactions
    if (dbUser.role !== 'ADMIN') {
      query = query.eq('user_id', dbUser.id);
    }

    if (status) {
      query = query.eq('status', status.toUpperCase());
    } else {
      // By default, only show SUCCESS and PENDING transactions in history
      query = query.in('status', ['SUCCESS', 'PENDING']);
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType.toUpperCase());
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // For transactions without operator (bill payments), try to get operator name from kwikapi_billers
    const processedData = await Promise.all((data || []).map(async (txn: any) => {
      if (!txn.operator && txn.service_type && ['ELECTRICITY', 'POSTPAID'].includes(txn.service_type)) {
        // Try to get operator name from response_data or kwikapi_provider
        let operatorName = 'Unknown Operator';

        if (txn.kwikapi_provider) {
          operatorName = txn.kwikapi_provider;
        } else if (txn.response_data?.provider) {
          operatorName = txn.response_data.provider;
        } else if (txn.response_data?.operator_name) {
          operatorName = txn.response_data.operator_name;
        }

        // Create a mock operator object for consistency
        txn.operator = {
          operator_name: operatorName,
          operator_code: 'N/A',
          logo_url: null
        };
      }
      return txn;
    }));

    return NextResponse.json({
      success: true,
      data: processedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('Transactions API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
