import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET - Get site configuration (public configs or all for admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    const supabase = createClient();
    let query = supabase.from('site_configuration').select('*');

    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    let isAdmin = false;

    if (authHeader) {
      const user = await verifyAuth(authHeader);
      isAdmin = user?.role === 'ADMIN';
    }

    // Non-admin users only see public configs
    if (!isAdmin) {
      query = query.eq('is_public', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (key) {
      query = query.eq('config_key', key);
      const { data, error } = await query.single();
      if (error) throw error;
      return NextResponse.json({ config: data });
    }

    const { data, error } = await query.order('category');
    if (error) throw error;

    // Group by category
    const grouped = data.reduce((acc: any, item: any) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    return NextResponse.json({ configs: grouped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update site configuration (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAuth(authHeader);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { config_key, config_value } = body;

    if (!config_key || config_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('site_configuration')
      .update({
        config_value,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('config_key', config_key)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ config: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new configuration (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyAuth(authHeader);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { config_key, config_value, config_type, category, description, is_public } = body;

    if (!config_key || !config_value || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('site_configuration')
      .insert({
        config_key,
        config_value,
        config_type: config_type || 'STRING',
        category,
        description,
        is_public: is_public || false,
        updated_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ config: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
