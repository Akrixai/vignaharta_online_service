import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateReferralCode(name: string, userId: string): string {
  const namePrefix = name.substring(0, 3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${namePrefix}${randomSuffix}`;
}

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

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a referral code
    const { data: existingCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingCode) {
      return NextResponse.json({ referralCode: existingCode });
    }

    // Generate new referral code
    let referralCode = generateReferralCode(userData.name, user.id);
    let attempts = 0;
    
    // Ensure uniqueness
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('referral_code')
        .eq('referral_code', referralCode)
        .single();
      
      if (!existing) break;
      referralCode = generateReferralCode(userData.name, user.id);
      attempts++;
    }

    // Create referral code
    const { data: newCode, error: createError } = await supabase
      .from('referral_codes')
      .insert({
        user_id: user.id,
        referral_code: referralCode,
        is_active: true
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ referralCode: newCode });
  } catch (error: any) {
    console.error('Generate referral code error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ referralCode: data || null });
  } catch (error: any) {
    console.error('Get referral code error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
