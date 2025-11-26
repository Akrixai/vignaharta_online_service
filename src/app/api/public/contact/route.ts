import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get public contact configuration (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_configuration')
      .select('config_key, config_value, config_type')
      .eq('category', 'CONTACT')
      .eq('is_public', true)
      .order('config_key');

    if (error) throw error;

    // Convert array to object for easier access
    const configObject: any = {};
    data.forEach((item) => {
      configObject[item.config_key] = item.config_value;
    });

    return NextResponse.json({
      success: true,
      data: configObject
    });
  } catch (error: any) {
    console.error('Error fetching public contact config:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
