import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const FEE_KEYS = [
  'daily_platform_charge_enabled',
  'daily_platform_charge_amount',
  'recurring_charge_enabled',
  'recurring_charge_amount',
  'recurring_charge_type',
  'platform_fee',
];

// GET /api/admin/platform-fees
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('site_configuration')
      .select('config_key, config_value, description')
      .in('config_key', FEE_KEYS);

    if (error) throw error;

    const config: Record<string, string> = {};
    data?.forEach((row) => { config[row.config_key] = row.config_value; });

    return NextResponse.json({
      success: true,
      data: {
        // Daily charge
        enabled: config['daily_platform_charge_enabled'] === 'true',
        amount: parseFloat(config['daily_platform_charge_amount'] || '10'),
        // Recurring (yearly/quarterly/half-yearly) charge
        recurring_enabled: config['recurring_charge_enabled'] === 'true',
        recurring_amount: parseFloat(config['recurring_charge_amount'] || '500'),
        recurring_type: config['recurring_charge_type'] || 'QUARTERLY',
        // Application platform fee
        platform_fee: parseFloat(config['platform_fee'] || '50'),
      },
    });
  } catch (error) {
    console.error('Platform fees GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/platform-fees
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updates: { config_key: string; config_value: string }[] = [];

    if (typeof body.enabled === 'boolean') {
      updates.push({ config_key: 'daily_platform_charge_enabled', config_value: String(body.enabled) });
    }
    if (typeof body.amount === 'number' && body.amount >= 0) {
      updates.push({ config_key: 'daily_platform_charge_amount', config_value: String(body.amount) });
    }
    if (typeof body.recurring_enabled === 'boolean') {
      updates.push({ config_key: 'recurring_charge_enabled', config_value: String(body.recurring_enabled) });
    }
    if (typeof body.recurring_amount === 'number' && body.recurring_amount >= 0) {
      updates.push({ config_key: 'recurring_charge_amount', config_value: String(body.recurring_amount) });
    }
    if (typeof body.recurring_type === 'string') {
      updates.push({ config_key: 'recurring_charge_type', config_value: body.recurring_type });
    }
    if (typeof body.platform_fee === 'number' && body.platform_fee >= 0) {
      updates.push({ config_key: 'platform_fee', config_value: String(body.platform_fee) });
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from('site_configuration')
        .update({ config_value: update.config_value, updated_by: user.id })
        .eq('config_key', update.config_key);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Fee settings updated successfully' });
  } catch (error) {
    console.error('Platform fees POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
