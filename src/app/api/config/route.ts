import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get site configuration (public configs or all for admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    let query = supabaseAdmin.from('site_configuration').select('*');

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

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
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await query.order('category');
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update site configuration (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { config_key, config_value } = body;

    if (!config_key || config_value === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('site_configuration')
      .update({
        config_value,
        updated_by: session.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('config_key', config_key)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create or update multiple configurations (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { configs } = body;

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({ success: false, error: 'Missing configs array' }, { status: 400 });
    }

    // Update or insert each config
    const results = [];
    for (const config of configs) {
      const { config_key, config_value, config_type, category, description, is_public } = config;

      if (!config_key || config_value === undefined) {
        continue;
      }

      // Try to update first
      const { data: existing } = await supabaseAdmin
        .from('site_configuration')
        .select('id')
        .eq('config_key', config_key)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from('site_configuration')
          .update({
            config_value,
            updated_by: session.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('config_key', config_key)
          .select()
          .single();

        if (!error) results.push(data);
      } else {
        // Insert new
        const { data, error } = await supabaseAdmin
          .from('site_configuration')
          .insert({
            config_key,
            config_value,
            config_type: config_type || 'STRING',
            category: category || 'GENERAL',
            description,
            is_public: is_public || false,
            updated_by: session.user.id
          })
          .select()
          .single();

        if (!error) results.push(data);
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
