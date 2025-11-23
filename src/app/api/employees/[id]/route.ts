import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET - Get employee details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: employee, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        employee_hierarchy (
          id,
          designation,
          level,
          territory_state,
          territory_district,
          territory_area
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      employee 
    });
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      name, email, phone, designation,
      territory_state, territory_district, territory_area,
      address, city, state, pincode, date_of_birth, gender, employee_id, department,
      password // Optional password update
    } = body;

    // Check if email is being changed and if it already exists
    if (email) {
      const { data: existingEmail } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .maybeSingle();

      if (existingEmail) {
        return NextResponse.json({ 
          success: false,
          error: 'Email already exists' 
        }, { status: 400 });
      }
    }

    // Check if phone is being changed and if it already exists
    if (phone) {
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', phone)
        .neq('id', id)
        .maybeSingle();

      if (existingPhone) {
        return NextResponse.json({ 
          success: false,
          error: 'Phone number already exists' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      phone,
      designation,
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
      updated_at: new Date().toISOString()
    };

    // If password is provided, hash it
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update user
    const { data: updatedUser, error: userError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (userError) throw userError;

    // Update hierarchy if designation or territory changed
    if (designation || territory_state || territory_district || territory_area) {
      await supabaseAdmin
        .from('employee_hierarchy')
        .update({
          designation,
          territory_state,
          territory_district,
          territory_area
        })
        .eq('employee_id', id);
    }

    return NextResponse.json({ 
      success: true,
      employee: updatedUser 
    });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if employee has subordinates
    const { data: subordinates } = await supabaseAdmin
      .from('employee_hierarchy')
      .select('id')
      .eq('parent_id', id);

    if (subordinates && subordinates.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Cannot delete employee with subordinates. Please reassign or delete subordinates first.' 
      }, { status: 400 });
    }

    // Soft delete - deactivate instead of hard delete
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (userError) throw userError;

    // Deactivate hierarchy
    await supabaseAdmin
      .from('employee_hierarchy')
      .update({ is_active: false })
      .eq('employee_id', id);

    return NextResponse.json({ 
      success: true,
      message: 'Employee deactivated successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
