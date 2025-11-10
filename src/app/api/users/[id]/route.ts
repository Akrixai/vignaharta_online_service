import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Users can only view their own profile unless they're admin/employee
    if (session.user.id !== userId && !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        is_active,
        address,
        city,
        state,
        pincode,
        date_of_birth,
        gender,
        occupation,
        employee_id,
        department,
        branch,
        created_at,
        updated_at,
        wallets (
          id,
          balance
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();

    // Users can only update their own profile unless they're admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedFields = ['name', 'phone', 'address', 'city', 'state', 'pincode', 'date_of_birth', 'gender', 'occupation'];
    const updateData: any = {};

    // Only allow certain fields to be updated
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Admin can update additional fields
    if (session.user.role === 'ADMIN') {
      if (body.is_active !== undefined) {
        updateData.is_active = body.is_active;
      }
      if (body.role !== undefined && ['EMPLOYEE', 'RETAILER', 'CUSTOMER'].includes(body.role)) {
        updateData.role = body.role;
      }
    }

    // Admin and Employee can update employee-specific fields
    if (session.user.role === 'ADMIN' || session.user.role === 'EMPLOYEE') {
      if (body.employee_id !== undefined) {
        updateData.employee_id = body.employee_id;
      }
      if (body.department !== undefined) {
        updateData.department = body.department;
      }
      if (body.branch !== undefined) {
        updateData.branch = body.branch;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        name,
        phone,
        role,
        is_active,
        address,
        city,
        state,
        pincode,
        date_of_birth,
        gender,
        occupation,
        employee_id,
        department,
        branch,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Prevent admin from deleting themselves
    if (session.user.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
