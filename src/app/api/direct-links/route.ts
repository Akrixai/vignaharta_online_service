import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Add CORS headers for cross-origin requests (Flutter app)
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// GET - List available direct links services for users
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('direct_links_services')
      .select(`
        id,
        name,
        description,
        service_url,
        service_type,
        amount,
        is_featured,
        category,
        icon_url,
        button_text,
        redirect_type,
        requires_payment,
        allowed_roles,
        metadata
      `)
      .eq('is_active', true)
      .contains('allowed_roles', [user.role])
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: services, error } = await query;

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

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: servicesWithCategories
    }));
  } catch (error: any) {
    console.error('Error fetching direct links services:', error);
    return addCorsHeaders(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }));
  }
}

// GET - Get categories
export async function GET_CATEGORIES(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { data, error } = await supabase
      .from('direct_links_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: data || []
    }));
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return addCorsHeaders(NextResponse.json({ 
      error: error.message 
    }, { status: 500 }));
  }
}