import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch current registration fee
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('registration_fees')
      .select('*')
      .eq('fee_type', 'RETAILER_REGISTRATION')
      .eq('is_active', true)
      .single();
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch registration fee' }, { status: 500 });
    }
    return NextResponse.json({ fee: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update registration fee (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { amount, currency, description } = await request.json();
    if (amount === undefined || isNaN(amount)) {
      return NextResponse.json({ error: 'Amount is required and must be a number' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('registration_fees')
      .update({
        amount,
        currency: currency || 'INR',
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('fee_type', 'RETAILER_REGISTRATION')
      .eq('is_active', true)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: 'Failed to update registration fee' }, { status: 500 });
    }
    return NextResponse.json({ fee: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 