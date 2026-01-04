import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all direct links services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('direct_links_services')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: services, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch categories separately and merge
    const { data: categories } = await supabase
      .from('direct_links_categories')
      .select('name, description, icon')
      .eq('is_active', true);

    // Merge category info with services
    const servicesWithCategories = services?.map(service => ({
      ...service,
      category_info: categories?.find(cat => cat.name === service.category) || null
    })) || [];

    return NextResponse.json({
      success: true,
      data: servicesWithCategories,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching direct links services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new direct links service
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
      .insert({
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
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Direct links service created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating direct links service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}