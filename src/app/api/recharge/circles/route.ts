import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch circles from recharge_circles table
    const { data: circles, error } = await supabase
      .from('recharge_circles')
      .select('*')
      .eq('is_active', true)
      .order('circle_name');

    if (error) {
      console.error('Error fetching circles:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch circles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: circles,
      count: circles.length
    });

  } catch (error: any) {
    console.error('Circles API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}