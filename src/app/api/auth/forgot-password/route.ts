import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    console.log('Checking for user with email:', email.toLowerCase());
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('email', email.toLowerCase())
      .single();

    console.log('User query result:', { user, userError });

    // Return error if user doesn't exist
    if (userError || !user) {
      console.log('User not found, returning 404');
      return NextResponse.json({
        success: false,
        error: 'No account found with this email address. Please register first.',
      }, { status: 404 });
    }

    console.log('User found:', user.email);

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

    if (tokenError) {
      console.error('Error creating reset token:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to create reset token' },
        { status: 500 }
      );
    }

    // Determine the base URL for the reset link
    // Priority: 1. Host header, 2. NEXTAUTH_URL, 3. Fallback
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXTAUTH_URL || 'https://www.vighnahartaonlineservice.in');

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    console.log('Generated reset URL:', resetUrl);

    // Send email
    try {
      const emailSent = await sendPasswordResetEmail(user.name, user.email, resetUrl);

      if (!emailSent) {
        console.error('Failed to send email (sendEmail return false)');
        return NextResponse.json({
          success: false,
          error: 'Failed to send reset email. Please contact support.',
        }, { status: 500 });
      }

      console.log('Password reset email sent successfully to:', user.email);
    } catch (emailError: any) {
      console.error('Error sending email exception:', emailError);
      return NextResponse.json({
        success: false,
        error: `Failed to send reset email: ${emailError.message || 'Unknown error'}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
