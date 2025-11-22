import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { referral_code, referred_email, referred_name, referred_phone } = body;

    if (!referral_code || !referred_email || !referred_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify referral code exists and is active
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('referral_code', referral_code)
      .eq('is_active', true)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    // Check if email already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_email', referred_email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already referred' }, { status: 400 });
    }

    // Get reward amounts from config
    const { data: config } = await supabase
      .from('site_configuration')
      .select('*')
      .in('config_key', ['referral_reward_referrer', 'referral_reward_referred']);

    const referrerReward = parseFloat(config?.find(c => c.config_key === 'referral_reward_referrer')?.config_value || '100');
    const referredReward = parseFloat(config?.find(c => c.config_key === 'referral_reward_referred')?.config_value || '50');

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: codeData.user_id,
        referral_code,
        referred_email,
        referred_name,
        referred_phone,
        status: 'PENDING',
        referrer_reward_amount: referrerReward,
        referred_reward_amount: referredReward
      })
      .select()
      .single();

    if (referralError) throw referralError;

    // Update referral code stats
    await supabase
      .from('referral_codes')
      .update({
        total_referrals: codeData.total_referrals + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', codeData.id);

    return NextResponse.json({ 
      success: true, 
      referral,
      message: 'Referral submitted successfully' 
    });
  } catch (error: any) {
    console.error('Submit referral error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
