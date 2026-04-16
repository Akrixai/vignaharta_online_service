import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// GET - Fetch all active subscription plans
export async function GET(request: NextRequest) {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('amount', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    return NextResponse.json({ success: true, plans: plans || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Admin: Create a new subscription plan
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, billing_period, amount, is_active } = body;

    if (!name || !billing_period || amount === undefined) {
      return NextResponse.json({ error: 'name, billing_period, and amount are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .insert({ name, description, billing_period, amount: parseFloat(amount), is_active: is_active !== false })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
