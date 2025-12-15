import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import { validateEmail, validatePhone } from '@/lib/utils';
import { corsHeaders, handleCorsPreflightRequest } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflightRequest();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
    } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate required fields for customers
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!address || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, error: 'Address, city, state, and pincode are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit PIN code' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create customer user directly (no approval needed)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        password_hash: hashedPassword,
        role: UserRole.CUSTOMER,
        is_active: true,
        commission_enabled: false, // Customers don't earn commission
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating customer user:', userError);
      
      // Provide more specific error message
      let errorMessage = 'Failed to create customer account';
      if (userError.code === '23505') {
        if (userError.message.includes('email')) {
          errorMessage = 'Email already registered';
        } else if (userError.message.includes('phone')) {
          errorMessage = 'Phone number already registered';
        }
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500, headers: corsHeaders }
      );
    }

    // Wallet is automatically created by database trigger for CUSTOMER role
    // No need to manually create wallet here

    return NextResponse.json({
      success: true,
      message: 'Customer registration successful! You can now login.',
      data: {
        user_id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
