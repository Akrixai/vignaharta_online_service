import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');

    let query = supabase
      .from('recharge_operators')
      .select('*')
      .eq('is_active', true)
      .order('operator_name');

    if (serviceType) {
      query = query.eq('service_type', serviceType.toUpperCase());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter operators based on service type
    let filteredOperators = data || [];
    
    // For PREPAID, only show mobile operators (based on KWIKAPI operator IDs)
    if (serviceType && serviceType.toUpperCase() === 'PREPAID') {
      // Valid mobile prepaid operator IDs from KWIKAPI documentation
      // These are the ONLY mobile recharge operators
      const validMobileOpids = [1, 3, 4, 5, 8, 9, 10, 12, 13, 14, 15, 18, 19, 21];
      
      filteredOperators = (data || []).filter((op: any) => {
        // STRICT filter: ONLY allow operators with valid mobile kwikapi_opid
        return op.kwikapi_opid && validMobileOpids.includes(op.kwikapi_opid);
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredOperators,
    });
  } catch (error: any) {
    console.error('Operators API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
