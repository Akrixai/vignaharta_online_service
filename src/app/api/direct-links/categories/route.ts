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

// GET - Get all categories
export async function GET(request: NextRequest) {
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