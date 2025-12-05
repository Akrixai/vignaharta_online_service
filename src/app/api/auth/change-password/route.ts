import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        error: 'Current password and new password are required'
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        error: 'New password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Get user from database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash')
      .eq('id', user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password_hash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        error: 'Current password is incorrect'
      }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update password'
      }, { status: 500 });
    }

    // Also update in Supabase Auth if using Supabase auth
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (authError && process.env.NODE_ENV === 'development') {
        // Don't fail the request as the database password is updated
      }
    } catch (authUpdateError) {
      if (process.env.NODE_ENV === 'development') {
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
