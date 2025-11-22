import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' });
    }

    // Check if token exists and is valid
    const { data: resetToken, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (error || !resetToken) {
      return NextResponse.json({ valid: false, error: 'Invalid token' });
    }

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json({ valid: false, error: 'Token has expired' });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' });
  }
}
