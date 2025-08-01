import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { UserRole } from '@/types';

// PUT - Update service (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const serviceId = params.id;

    // Add console logging for debugging dropdown options

    if (body.dynamic_fields && Array.isArray(body.dynamic_fields)) {
      body.dynamic_fields.forEach((field: any, index: number) => {
        if (field.type === 'select') {

        }
      });
    }

    // Check if service exists
    const { data: existingService, error: fetchError } = await supabaseAdmin
      .from('schemes')
      .select('id')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Validation
    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json({ 
        error: 'Price cannot be negative' 
      }, { status: 400 });
    }

    if (body.commission_rate !== undefined && (body.commission_rate < 0 || body.commission_rate > 100)) {
      return NextResponse.json({ 
        error: 'Commission rate must be between 0 and 100' 
      }, { status: 400 });
    }

    // Process dynamic fields to ensure dropdown options are properly formatted
    if (body.dynamic_fields && Array.isArray(body.dynamic_fields)) {
      body.dynamic_fields = body.dynamic_fields.map((field: any) => {
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
      });
    }

    // If is_free is set to true, set price to 0
    if (body.is_free === true) {
      body.price = 0;
    }

    const { data: service, error } = await supabaseAdmin
      .from('schemes')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Service updated successfully',
      service 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete service (Admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceId = params.id;

    // Check if service exists
    const { data: existingService, error: fetchError } = await supabaseAdmin
      .from('schemes')
      .select('id, name')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if service has applications
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('scheme_id', serviceId)
      .limit(1);

    if (appError) {
      return NextResponse.json({ error: 'Failed to check service usage' }, { status: 500 });
    }

    if (applications && applications.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete service with existing applications. Deactivate it instead.' 
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('schemes')
      .delete()
      .eq('id', serviceId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Service deleted successfully' 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
