import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET - Get recurring charges
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAuth(authHeader);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const supabase = createClient();
    let query = supabase
      .from('recurring_charges')
      .select('*')
      .order('due_date', { ascending: false });

    // Admin can see all, others only their own
    if (user.role !== 'ADMIN') {
      query = query.eq('user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ charges: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Process recurring charge (admin only or automated)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAuth(authHeader);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, charge_type, amount } = body;

    const supabase = createClient();

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user_id)
      .single();

    if (!wallet || wallet.balance < amount) {
      // Create failed charge record
      await supabase.from('recurring_charges').insert({
        user_id,
        charge_type,
        amount,
        status: 'FAILED',
        due_date: new Date().toISOString(),
        failure_reason: 'Insufficient wallet balance'
      });

      return NextResponse.json({ 
        error: 'Insufficient wallet balance' 
      }, { status: 400 });
    }

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        wallet_id: wallet.id,
        type: 'WITHDRAWAL',
        amount: -amount,
        status: 'COMPLETED',
        description: `${charge_type} recurring charge`,
        reference: `RECURRING_${Date.now()}`,
        metadata: { charge_type }
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id);

    // Calculate next charge date
    const nextChargeDate = calculateNextChargeDate(charge_type);

    // Create charge record
    const { data: charge, error: chargeError } = await supabase
      .from('recurring_charges')
      .insert({
        user_id,
        charge_type,
        amount,
        status: 'COMPLETED',
        due_date: new Date().toISOString(),
        charged_date: new Date().toISOString(),
        transaction_id: transaction.id,
        next_charge_date: nextChargeDate
      })
      .select()
      .single();

    if (chargeError) throw chargeError;

    // Add to history
    await supabase.from('recurring_charge_history').insert({
      user_id,
      charge_type,
      amount,
      status: 'COMPLETED',
      transaction_id: transaction.id,
      charged_at: new Date().toISOString()
    });

    return NextResponse.json({ charge, transaction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateNextChargeDate(chargeType: string): string {
  const now = new Date();
  switch (chargeType) {
    case 'QUARTERLY':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'HALF_YEARLY':
      now.setMonth(now.getMonth() + 6);
      break;
    case 'YEARLY':
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  return now.toISOString().split('T')[0];
}
