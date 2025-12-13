import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'CREATED';

    const { data: payments, error } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registration payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch registration payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Registration payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}