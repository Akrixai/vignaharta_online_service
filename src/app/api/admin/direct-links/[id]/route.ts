import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get specific direct links service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: service, error } = await supabase
      .from('direct_links_services')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Fetch category info separately
    let category_info = null;
    if (service.category) {
      const { data: categoryData } = await supabase
        .from('direct_links_categories')
        .select('name, description, icon')
        .eq('name', service.category)
        .single();
      category_info = categoryData;
    }

    return NextResponse.json({ 
      success: true, 
      data: { ...service, category_info } 
    });
  } catch (error: any) {
    console.error('Error fetching direct links service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update direct links service
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
    const {
      name,
      description,
      service_url,
      service_type,
      amount,
      is_active,
      is_featured,
      category,
      icon_url,
      button_text,
      redirect_type,
      requires_payment,
      allowed_roles,
      metadata
    } = body;

    // Validation
    if (amount && amount < 0) {
      return NextResponse.json({ 
        error: 'Amount cannot be negative' 
      }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (service_url !== undefined) updateData.service_url = service_url;
    if (service_type !== undefined) updateData.service_type = service_type;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (category !== undefined) updateData.category = category;
    if (icon_url !== undefined) updateData.icon_url = icon_url;
    if (button_text !== undefined) updateData.button_text = button_text;
    if (redirect_type !== undefined) updateData.redirect_type = redirect_type;
    if (requires_payment !== undefined) updateData.requires_payment = requires_payment;
    if (allowed_roles !== undefined) updateData.allowed_roles = allowed_roles;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabase
      .from('direct_links_services')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Direct links service updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating direct links service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete direct links service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('direct_links_services')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Direct links service deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting direct links service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}