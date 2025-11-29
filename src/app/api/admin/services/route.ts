import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';
import { sendNewServiceNotifications } from '@/lib/email-service';

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
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      services: services || [] 
    });

  } catch (error) {
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

    const {
      name,
      description,
      price,
      is_free,
      category,
      documents,
      processing_time_days,
      commission_rate,
      cashback_enabled,
      cashback_min_percentage,
      cashback_max_percentage,
      dynamic_fields,
      required_documents,
      image_url,
      show_to_customer,
      customer_price
    } = body;

    // Add console logging for debugging dropdown options

    if (dynamic_fields && Array.isArray(dynamic_fields)) {
      dynamic_fields.forEach((field: any, index: number) => {
        if (field.type === 'select') {

        }
      });
    }

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

    // Validate cashback percentages
    if (cashback_enabled) {
      if (cashback_min_percentage < 0 || cashback_min_percentage > 100) {
        return NextResponse.json({
          error: 'Cashback minimum percentage must be between 0 and 100'
        }, { status: 400 });
      }
      if (cashback_max_percentage < 0 || cashback_max_percentage > 100) {
        return NextResponse.json({
          error: 'Cashback maximum percentage must be between 0 and 100'
        }, { status: 400 });
      }
      if (cashback_min_percentage > cashback_max_percentage) {
        return NextResponse.json({
          error: 'Cashback minimum percentage cannot be greater than maximum percentage'
        }, { status: 400 });
      }
    }

    // Process dynamic fields to ensure dropdown options are properly formatted
    const processedDynamicFields = dynamic_fields ? dynamic_fields.map((field: any) => {
      if (field.type === 'select' && field.options) {
        // Ensure options is an array of strings
        let processedOptions = [];
        if (Array.isArray(field.options)) {
          processedOptions = field.options.map((option: any) => {
            if (typeof option === 'string') {
              return option.trim();
            }
            return String(option).trim();
          }).filter((option: string) => option.length > 0);
        } else if (typeof field.options === 'string') {
          // If options is a string, split by comma
          processedOptions = field.options
            .split(',')
            .map((option: string) => option.trim())
            .filter((option: string) => option.length > 0);
        }

        return {
          ...field,
          options: processedOptions
        };
      }
      return field;
    }) : [];

    // Verify the user exists in the database
    const { data: userExists, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userExists) {
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
        cashback_enabled: cashback_enabled || false,
        cashback_min_percentage: cashback_enabled ? (cashback_min_percentage || 1) : 0,
        cashback_max_percentage: cashback_enabled ? (cashback_max_percentage || 3) : 0,
        dynamic_fields: processedDynamicFields,
        required_documents: required_documents || [],
        image_url: image_url || null,
        show_to_customer: show_to_customer !== false,
        customer_price: customer_price || null,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to create service',
        details: error.message
      }, { status: 500 });
    }

    // Send email notifications to all users
    try {
      await sendNewServiceNotifications(
        service.id,
        service.name,
        service.description || 'New service available'
      );
    } catch (emailError) {
      // Don't fail the API if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}
