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
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType.toUpperCase());
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
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
