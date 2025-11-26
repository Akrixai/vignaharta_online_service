import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get service by share token (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token is required'
      }, { status: 400 });
    }

    const { data: service, error } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('share_token', token.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found or inactive'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: service
    });
  } catch (error: any) {
    console.error('Error fetching service by token:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
