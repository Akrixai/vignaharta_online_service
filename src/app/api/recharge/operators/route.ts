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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    // This ensures only actual mobile recharge operators are shown (Airtel, Jio, VI, BSNL, MTNL)
    // and excludes broadband, insurance, gas, water, cable, fastag, etc.
    if (serviceType && serviceType.toUpperCase() === 'PREPAID') {
      // Valid mobile prepaid operator IDs from KWIKAPI
      const validMobileOpids = [
        1,   // Airtel
        3,   // Idea / VI
        4,   // BSNL Topup
        5,   // BSNL Special
        8,   // Jio
        14,  // MTNL
        15,  // MTNL Special
        21,  // Vodafone / VI
        177, // Airtel Official
        178, // VI Official
        179, // BSNL Topup Official
        180, // BSNL Special Official
        181, // Jio Official
        182, // MTNL Official
        183  // MTNL Spl Official
      ];

      filteredOperators = (data || []).filter((op: any) => {
        // STRICT filter: ONLY allow operators with valid mobile kwikapi_opid
        return op.kwikapi_opid && validMobileOpids.includes(op.kwikapi_opid);
      });
    }

    // Remove sensitive commission/cashback data from response for non-admin users
    const sanitizedOperators = filteredOperators.map(op => ({
      id: op.id,
      operator_code: op.operator_code,
      operator_name: op.operator_name,
      service_type: op.service_type,
      logo_url: op.logo_url,
      min_amount: op.min_amount,
      max_amount: op.max_amount,
      metadata: op.metadata,
      kwikapi_opid: op.kwikapi_opid,
      // Commission and cashback rates are hidden from users
      // They are only used internally by the backend
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedOperators,
    });
  } catch (error: any) {
    console.error('Operators API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
