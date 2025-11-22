import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/platform-fees - Get all platform fees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: fees, error } = await supabaseAdmin
      .from('registration_fees')
      .select('*')
      .in('fee_type', ['YEARLY_FEE_CUSTOMER', 'YEARLY_FEE_RETAILER', 'PLATFORM_FEE_CUSTOMER', 'PLATFORM_FEE_RETAILER'])
      .order('fee_type');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch fees' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fees
    });

  } catch (error) {
    console.error('Get platform fees error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
