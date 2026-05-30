import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST - Purchase a subscription using wallet balance
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan_id } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Fetch the plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    // Check wallet balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const balance = parseFloat(wallet.balance);
    const planAmount = parseFloat(plan.amount);

    if (balance < planAmount) {
      return NextResponse.json({
        error: 'Insufficient wallet balance',
        required: planAmount,
        available: balance
      }, { status: 400 });
    }

    // Check if user already has an active subscription
    const now = new Date();
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, end_date')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .gte('end_date', now.toISOString())
      .maybeSingle();

    // Calculate end date based on billing period
    let endDate = new Date(now);
    if (existingSub) {
      // Extend from current end date
      endDate = new Date(existingSub.end_date);
    }

    switch (plan.billing_period) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'HALF_YEARLY':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Deduct from wallet
    const newBalance = balance - planAmount;
    const { error: walletUpdateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: now.toISOString() })
      .eq('id', wallet.id);

    if (walletUpdateError) {
      return NextResponse.json({ error: 'Failed to deduct wallet balance' }, { status: 500 });
    }

    // Create transaction record
    const { data: transaction } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'WITHDRAWAL', // 'DEBIT' is not a valid transaction_type enum value
        amount: planAmount,
        description: `Subscription purchase: ${plan.name}`,
        status: 'COMPLETED',
        reference: `SUB_${Date.now()}`
      })
      .select()
      .single();

    // If extending, cancel old subscription
    if (existingSub) {
      await supabaseAdmin
        .from('user_subscriptions')
        .update({ status: 'CANCELLED', updated_at: now.toISOString() })
        .eq('id', existingSub.id);
    }

    // Create new subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        status: 'ACTIVE',
        amount_paid: planAmount
      })
      .select(`*, plan:subscription_plans(*)`)
      .single();

    if (subError) {
      // Rollback wallet deduction
      await supabaseAdmin
        .from('wallets')
        .update({ balance: balance })
        .eq('id', wallet.id);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name}!`,
      subscription,
      new_balance: newBalance
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
