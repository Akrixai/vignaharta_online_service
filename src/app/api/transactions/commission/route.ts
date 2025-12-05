import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// GET - Get commission transactions for the current user
export async function GET(request: NextRequest) {

  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== UserRole.RETAILER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get commission transactions for the user
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        status,
        description,
        reference,
        metadata,
        created_at,
        updated_at,
        processed_by
      `)
      .eq('user_id', user.id)
      .eq('type', 'COMMISSION')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch commission transactions' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'COMMISSION');

    if (countError) {
    }

    // Calculate total commission earned
    const { data: totalData, error: totalError } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'COMMISSION')
      .eq('status', 'COMPLETED');

    const totalCommission = totalData?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        summary: {
          totalCommissionEarned: totalCommission,
          totalTransactions: count || 0
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
