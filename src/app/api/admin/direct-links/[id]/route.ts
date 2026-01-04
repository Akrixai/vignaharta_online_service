import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get single direct links service
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

    return NextResponse.json({
      success: true,
      data: service
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
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
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
    if (!name || !service_url || !service_type) {
      return NextResponse.json({ 
        error: 'Name, service URL, and service type are required' 
      }, { status: 400 });
    }

    if (amount < 0) {
      return NextResponse.json({ 
        error: 'Amount cannot be negative' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('direct_links_services')
      .update({
        name,
        description,
        service_url,
        service_type,
        amount: parseFloat(amount) || 0,
        is_active: is_active !== false,
        is_featured: is_featured || false,
        category,
        icon_url,
        button_text: button_text || 'Access Service',
        redirect_type: redirect_type || 'NEW_TAB',
        requires_payment: requires_payment !== false,
        allowed_roles: allowed_roles || ['RETAILER', 'CUSTOMER'],
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

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