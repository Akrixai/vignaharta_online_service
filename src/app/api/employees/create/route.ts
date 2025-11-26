import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// POST - Create employee with hierarchy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    const body = await request.json();
    const { 
      name, email, password, phone, designation, role,
      territory_state, territory_district, territory_area,
      address, city, state, pincode, date_of_birth, gender, employee_id, department, branch,
      referral_code
    } = body;

    // Validate designation hierarchy
    // Full hierarchy: ADMIN -> MANAGER -> STATE_MANAGER -> DISTRICT_MANAGER -> SUPERVISOR/DISTRIBUTOR -> EMPLOYEE -> RETAILER
    const designationHierarchy: Record<string, string[]> = {
      'ADMIN': ['MANAGER', 'STATE_MANAGER', 'DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
      'MANAGER': ['STATE_MANAGER', 'DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
      'STATE_MANAGER': ['DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
      'DISTRICT_MANAGER': ['SUPERVISOR', 'DISTRIBUTOR', 'EMPLOYEE', 'RETAILER'],
      'SUPERVISOR': ['EMPLOYEE', 'RETAILER'],
      'DISTRIBUTOR': ['EMPLOYEE', 'RETAILER'],
      'EMPLOYEE': ['RETAILER'],
      'RETAILER': []
    };

    const userDesignation = (user as any).designation || (user.role === 'ADMIN' ? 'ADMIN' : null);
    
    if (!userDesignation || !designationHierarchy[userDesignation]?.includes(designation)) {
      return NextResponse.json({ 
        error: 'You cannot create employees with this designation' 
      }, { status: 403 });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ 
        success: false,
        error: 'Email already exists' 
      }, { status: 400 });
    }

    // Check if phone already exists (if phone is provided)
    if (phone) {
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (existingPhone) {
        return NextResponse.json({ 
          success: false,
          error: 'Phone number already exists' 
        }, { status: 400 });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        phone,
        role: role || 'EMPLOYEE',
        designation,
        parent_employee_id: user.id,
        territory_state,
        territory_district,
        territory_area,
        address,
        city,
        state,
        pincode,
        date_of_birth,
        gender,
        employee_id,
        department,
        branch,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (userError) throw userError;

    // Get parent hierarchy info
    const { data: parentHierarchy } = await supabaseAdmin
      .from('employee_hierarchy')
      .select('level, path')
      .eq('employee_id', user.id)
      .single();

    const parentLevel = parentHierarchy?.level || 0;
    const parentPath = parentHierarchy?.path || '';

    // Create hierarchy entry
    const { data: hierarchy, error: hierarchyError } = await supabaseAdmin
      .from('employee_hierarchy')
      .insert({
        employee_id: newUser.id,
        parent_id: user.id,
        designation,
        level: parentLevel + 1,
        path: parentPath ? `${parentPath}/${newUser.id}` : newUser.id,
        territory_state,
        territory_district,
        territory_area,
        is_active: true
      })
      .select()
      .single();

    if (hierarchyError) {
      console.error('Hierarchy error:', hierarchyError);
      // Don't fail the whole operation if hierarchy creation fails
    }

    // Create wallet for new employee
    await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: newUser.id,
        balance: 0
      });

    // Handle referral code if provided
    let referralData = null;
    if (referral_code && referral_code.trim()) {
      try {
        // Get referral configuration
        const { data: configs } = await supabaseAdmin
          .from('site_configuration')
          .select('config_key, config_value')
          .in('config_key', [
            'employee_referral_enabled',
            'employee_referral_referrer_reward',
            'employee_referral_referred_reward'
          ]);

        const referralEnabled = configs?.find(c => c.config_key === 'employee_referral_enabled')?.config_value === 'true';
        const referrerReward = parseFloat(configs?.find(c => c.config_key === 'employee_referral_referrer_reward')?.config_value || '500');
        const referredReward = parseFloat(configs?.find(c => c.config_key === 'employee_referral_referred_reward')?.config_value || '250');

        if (referralEnabled) {
          // Find referrer by code
          const { data: referrer } = await supabaseAdmin
            .from('users')
            .select('id, name, email')
            .eq('referral_code', referral_code.trim().toUpperCase())
            .eq('role', 'EMPLOYEE')
            .single();

          if (referrer) {
            // Create referral record
            const { data: referralRecord } = await supabaseAdmin
              .from('employee_referrals')
              .insert({
                referrer_id: referrer.id,
                referred_employee_id: newUser.id,
                referral_code: referral_code.trim().toUpperCase(),
                referrer_reward_amount: referrerReward,
                referred_reward_amount: referredReward,
                status: 'COMPLETED'
              })
              .select()
              .single();

            // Credit referrer wallet
            const { data: referrerWallet } = await supabaseAdmin
              .from('wallets')
              .select('id, balance')
              .eq('user_id', referrer.id)
              .single();

            if (referrerWallet) {
              await supabaseAdmin
                .from('wallets')
                .update({ balance: parseFloat(referrerWallet.balance.toString()) + referrerReward })
                .eq('id', referrerWallet.id);

              // Create transaction for referrer
              await supabaseAdmin
                .from('transactions')
                .insert({
                  user_id: referrer.id,
                  wallet_id: referrerWallet.id,
                  type: 'DEPOSIT',
                  amount: referrerReward,
                  status: 'COMPLETED',
                  description: `Employee referral reward for referring ${newUser.name}`,
                  reference: `REFERRAL_${referralRecord.id}`,
                  metadata: {
                    referral_id: referralRecord.id,
                    referred_employee_id: newUser.id,
                    referred_employee_name: newUser.name
                  }
                });
            }

            // Credit referred employee wallet
            const { data: referredWallet } = await supabaseAdmin
              .from('wallets')
              .select('id, balance')
              .eq('user_id', newUser.id)
              .single();

            if (referredWallet) {
              await supabaseAdmin
                .from('wallets')
                .update({ balance: parseFloat(referredWallet.balance.toString()) + referredReward })
                .eq('id', referredWallet.id);

              // Create transaction for referred employee
              await supabaseAdmin
                .from('transactions')
                .insert({
                  user_id: newUser.id,
                  wallet_id: referredWallet.id,
                  type: 'DEPOSIT',
                  amount: referredReward,
                  status: 'COMPLETED',
                  description: `Welcome bonus for joining via referral code ${referral_code}`,
                  reference: `REFERRAL_BONUS_${referralRecord.id}`,
                  metadata: {
                    referral_id: referralRecord.id,
                    referrer_id: referrer.id,
                    referrer_name: referrer.name
                  }
                });
            }

            // Mark rewards as paid
            await supabaseAdmin
              .from('employee_referrals')
              .update({
                referrer_reward_paid: true,
                referred_reward_paid: true,
                referrer_reward_paid_at: new Date().toISOString(),
                referred_reward_paid_at: new Date().toISOString()
              })
              .eq('id', referralRecord.id);

            referralData = {
              referrer: referrer.name,
              referrerReward,
              referredReward
            };
          }
        }
      } catch (referralError) {
        console.error('Referral processing error:', referralError);
        // Don't fail employee creation if referral fails
      }
    }

    return NextResponse.json({ 
      success: true,
      user: newUser,
      hierarchy,
      referral: referralData
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
