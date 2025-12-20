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

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');

    let query = supabase
      .from('kwikapi_billers')
      .select('*')
      .eq('biller_status', 'on')
      .eq('status', '1')
      .order('operator_name');

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data: billers, error } = await query;

    if (error) {
      console.error('Error fetching billers:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch billers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: billers || [],
      count: billers?.length || 0
    });

  } catch (error: any) {
    console.error('Billers API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}