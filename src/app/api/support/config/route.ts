import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user (supports both web and app)
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active contact configuration
    const { data, error } = await supabaseAdmin
      .from('contact_configuration')
      .select('config_key, config_value, category, description')
      .eq('is_active', true)
      .eq('is_public', true) // Only public configs for app users
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

    // Parse FAQs if available
    let faqs = [];
    if (configObject.support_faqs) {
      try {
        faqs = JSON.parse(configObject.support_faqs);
      } catch (e) {
        console.error('Error parsing FAQs:', e);
        faqs = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        config: configObject,
        faqs: faqs,
      },
    });
  } catch (error: any) {
    console.error('Support Config API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}