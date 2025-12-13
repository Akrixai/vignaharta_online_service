import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active contact configuration
    const { data, error } = await supabaseAdmin
      .from('contact_configuration')
      .select('config_key, config_value, category')
      .eq('is_active', true)
      .order('category, display_order');

    if (error) {
      console.error('Error fetching contact config:', error);
      throw error;
    }

    // Transform array to object for easier access
    const configObject: Record<string, string> = {};
    data?.forEach((item) => {
      configObject[item.config_key] = item.config_value;
    });

    return NextResponse.json({
      success: true,
      data: configObject,
    });
  } catch (error: any) {
    console.error('Contact Config API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing config object' }, { status: 400 });
    }

    // Update each configuration item
    const results = [];
    for (const [key, value] of Object.entries(config)) {
      if (typeof value !== 'string') continue;

      // Determine config type based on key
      let config_type = 'STRING';
      let category = 'CONTACT';
      
      if (key.includes('email')) config_type = 'EMAIL';
      else if (key.includes('phone') || key.includes('whatsapp')) config_type = 'PHONE';
      else if (key.includes('url')) config_type = 'URL';
      
      if (key.includes('support')) category = 'SUPPORT';
      else if (key.includes('office')) category = 'OFFICE';
      else if (key.includes('facebook') || key.includes('twitter') || key.includes('instagram') || key.includes('linkedin') || key.includes('youtube')) category = 'SOCIAL';

      // Try to update existing record
      const { data: existing } = await supabaseAdmin
        .from('contact_configuration')
        .select('id')
        .eq('config_key', key)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from('contact_configuration')
          .update({
            config_value: value,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('config_key', key)
          .select()
          .single();

        if (!error) results.push(data);
      } else {
        // Insert new
        const { data, error } = await supabaseAdmin
          .from('contact_configuration')
          .insert({
            config_key: key,
            config_value: value,
            config_type,
            category,
            description: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            is_public: true,
            is_active: true,
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single();

        if (!error) results.push(data);
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Contact Config Save Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}