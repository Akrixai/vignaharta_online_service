import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST - Generate or get share token for a service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const { id: serviceId } = await params;

    // Check if service exists
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('schemes')
      .select('id, share_token, name')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found'
      }, { status: 404 });
    }

    // If token already exists, return it
    if (service.share_token) {
      return NextResponse.json({
        success: true,
        token: service.share_token
      });
    }

    // Generate new token using the database function
    const { data: result, error: tokenError } = await supabaseAdmin
      .rpc('generate_scheme_share_token', { scheme_id: serviceId });

    if (tokenError) throw tokenError;

    return NextResponse.json({
      success: true,
      token: result
    });
  } catch (error: any) {
    console.error('Error generating share token:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET - Get existing share token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;

    const { data: service, error } = await supabaseAdmin
      .from('schemes')
      .select('share_token')
      .eq('id', serviceId)
      .single();

    if (error || !service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      token: service.share_token
    });
  } catch (error: any) {
    console.error('Error fetching share token:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
