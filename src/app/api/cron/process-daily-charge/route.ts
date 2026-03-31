import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/cron/process-daily-charge
// Called daily via Vercel cron or manual trigger
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET || 'your_secure_random_secret_here_change_in_production';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if daily charge is enabled
    const { data: configRows, error: configError } = await supabaseAdmin
      .from('site_configuration')
      .select('config_key, config_value')
      .in('config_key', ['daily_platform_charge_enabled', 'daily_platform_charge_amount']);

    if (configError) throw configError;

    const config: Record<string, string> = {};
    configRows?.forEach((r) => { config[r.config_key] = r.config_value; });

    if (config['daily_platform_charge_enabled'] !== 'true') {
      return NextResponse.json({ success: true, message: 'Daily charge is disabled', processed: 0 });
    }

    const chargeAmount = parseFloat(config['daily_platform_charge_amount'] || '10');
    if (chargeAmount <= 0) {
      return NextResponse.json({ success: true, message: 'Charge amount is 0, skipping', processed: 0 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get all active customers and retailers with wallets
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, role, name, email')
      .in('role', ['CUSTOMER', 'RETAILER'])
      .eq('is_active', true);

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found', processed: 0 });
    }

    const results = { processed: 0, skipped: 0, failed: 0, errors: [] as string[] };

    for (const user of users) {
      try {
        // Check if already charged today
        const { data: existing } = await supabaseAdmin
          .from('daily_charge_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('charge_date', today)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Get wallet balance
        const { data: wallet, error: walletError } = await supabaseAdmin
          .from('wallets')
          .select('id, balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletError || !wallet) {
          await supabaseAdmin.from('daily_charge_history').insert({
            user_id: user.id,
            amount: chargeAmount,
            charge_date: today,
            status: 'FAILED',
            failure_reason: 'Wallet not found',
          });
          results.failed++;
          continue;
        }

        const balanceBefore = parseFloat(wallet.balance);

        if (balanceBefore < chargeAmount) {
          // Insufficient balance — record as failed/skipped
          await supabaseAdmin.from('daily_charge_history').insert({
            user_id: user.id,
            amount: chargeAmount,
            charge_date: today,
            status: 'FAILED',
            failure_reason: 'Insufficient wallet balance',
            wallet_balance_before: balanceBefore,
          });
          results.failed++;
          continue;
        }

        const balanceAfter = balanceBefore - chargeAmount;

        // Create transaction record
        const { data: txn, error: txnError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: user.id,
            wallet_id: wallet.id,
            type: 'DEBIT',
            amount: chargeAmount,
            description: `Daily platform maintenance charge - ${today}`,
            status: 'COMPLETED',
            reference: `DAILY_CHARGE_${user.id}_${today}`,
          })
          .select('id')
          .single();

        if (txnError) throw txnError;

        // Deduct from wallet
        const { error: walletUpdateError } = await supabaseAdmin
          .from('wallets')
          .update({ balance: balanceAfter })
          .eq('user_id', user.id);

        if (walletUpdateError) throw walletUpdateError;

        // Record in daily_charge_history
        await supabaseAdmin.from('daily_charge_history').insert({
          user_id: user.id,
          amount: chargeAmount,
          charge_date: today,
          status: 'SUCCESS',
          transaction_id: txn.id,
          wallet_balance_before: balanceBefore,
          wallet_balance_after: balanceAfter,
        });

        results.processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`User ${user.id}: ${msg}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      charge_amount: chargeAmount,
      results,
    });
  } catch (error) {
    console.error('Daily charge cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET for Vercel cron (cron jobs use GET by default)
export async function GET(request: NextRequest) {
  return POST(request);
}
