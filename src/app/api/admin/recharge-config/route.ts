import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all operators with commission/cashback config
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');

    let query = supabase
      .from('recharge_operators')
      .select('*')
      .eq('is_active', true)  // Only show active operators
      .order('operator_name');

    if (serviceType) {
      query = query.eq('service_type', serviceType.toUpperCase());
    }

    const { data: operators, error } = await query;

    if (error) throw error;

    // Filter operators based on service type
    let filteredOperators = operators || [];
    
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
      
      filteredOperators = (operators || []).filter((op: any) => {
        // STRICT filter: ONLY allow operators with valid mobile kwikapi_opid
        return op.kwikapi_opid && validMobileOpids.includes(op.kwikapi_opid);
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredOperators,
    });
  } catch (error: any) {
    console.error('Get Recharge Config Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update operator commission/cashback configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      operator_id,
      commission_rate,
      cashback_enabled,
      cashback_min_percentage,
      cashback_max_percentage,
      is_active,
    } = body;

    if (!operator_id) {
      return NextResponse.json(
        { success: false, message: 'Operator ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate;
    if (cashback_enabled !== undefined) updateData.cashback_enabled = cashback_enabled;
    if (cashback_min_percentage !== undefined) updateData.cashback_min_percentage = cashback_min_percentage;
    if (cashback_max_percentage !== undefined) updateData.cashback_max_percentage = cashback_max_percentage;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    updateData.updated_at = new Date().toISOString();

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
    console.error('Update Recharge Config Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Bulk update operators
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { service_type, commission_rate, cashback_enabled, cashback_min_percentage, cashback_max_percentage } = body;

    if (!service_type) {
      return NextResponse.json(
        { success: false, message: 'Service type is required' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate;
    if (cashback_enabled !== undefined) updateData.cashback_enabled = cashback_enabled;
    if (cashback_min_percentage !== undefined) updateData.cashback_min_percentage = cashback_min_percentage;
    if (cashback_max_percentage !== undefined) updateData.cashback_max_percentage = cashback_max_percentage;

    const { data, error } = await supabase
      .from('recharge_operators')
      .update(updateData)
      .eq('service_type', service_type.toUpperCase())
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: `Updated ${data.length} operators for ${service_type}`,
    });
  } catch (error: any) {
    console.error('Bulk Update Recharge Config Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
