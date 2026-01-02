import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all categories (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: categories, error } = await supabase
      .from('direct_links_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: categories || []
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, sort_order, is_active } = body;

    // Validate required fields
    if (!name || !icon) {
      return NextResponse.json({ 
        error: 'Name and icon are required' 
      }, { status: 400 });
    }

    // Check if category name already exists
    const { data: existing } = await supabase
      .from('direct_links_categories')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'Category with this name already exists' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('direct_links_categories')
      .insert({
        name,
        description: description || '',
        icon,
        sort_order: sort_order || 0,
        is_active: is_active !== false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Category created successfully'
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, icon, sort_order, is_active } = body;

    // Validate required fields
    if (!name || !icon) {
      return NextResponse.json({ 
        error: 'Name and icon are required' 
      }, { status: 400 });
    }

    // Check if category name already exists (excluding current category)
    const { data: existing } = await supabase
      .from('direct_links_categories')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'Category with this name already exists' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('direct_links_categories')
      .update({
        name,
        description: description || '',
        icon,
        sort_order: sort_order || 0,
        is_active: is_active !== false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Category updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category is being used by any services
    const { data: servicesUsingCategory } = await supabase
      .from('direct_links_services')
      .select('id')
      .eq('category', id);

    if (servicesUsingCategory && servicesUsingCategory.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete category. It is being used by ${servicesUsingCategory.length} service(s).` 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('direct_links_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}