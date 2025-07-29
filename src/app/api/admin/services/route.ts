import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// GET - Fetch all services (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: services, error } = await supabaseAdmin
      .from('schemes')
      .select(`
        *,
        created_by_user:users!schemes_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      services: services || [] 
    });

  } catch (error) {
    console.error('Error in services GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new service (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Service creation request body:', body);

    const {
      name,
      description,
      price,
      is_free,
      category,
      documents,
      processing_time_days,
      commission_rate,
      dynamic_fields,
      required_documents,
      image_url
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ 
        error: 'Service name is required' 
      }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ 
        error: 'Price cannot be negative' 
      }, { status: 400 });
    }

    if (commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({
        error: 'Commission rate must be between 0 and 100'
      }, { status: 400 });
    }

    // Verify the user exists in the database
    const { data: userExists, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userExists) {
      console.error('❌ User verification failed:', userError);
      return NextResponse.json({
        error: 'User not found in database',
        details: userError?.message
      }, { status: 400 });
    }

    const { data: service, error } = await supabaseAdmin
      .from('schemes')
      .insert({
        name,
        description,
        price: is_free ? 0 : price,
        is_free: is_free || false,
        category,
        documents: documents || [],
        processing_time_days: processing_time_days || 7,
        commission_rate: commission_rate || 0,
        dynamic_fields: dynamic_fields || [],
        required_documents: required_documents || [],
        image_url: image_url || null,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating service:', error);
      return NextResponse.json({
        error: 'Failed to create service',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Service created successfully:', service);

    // WhatsApp notifications removed (feature disabled)

    // Email notifications temporarily disabled to prevent API errors
    console.log('📧 Email notifications disabled for service creation');

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Error in services POST:', error);

    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Detailed error:', errorMessage);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}
