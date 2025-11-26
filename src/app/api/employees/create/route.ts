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
      address, city, state, pincode, date_of_birth, gender, employee_id, department, branch
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

    return NextResponse.json({ 
      success: true,
      user: newUser,
      hierarchy 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
