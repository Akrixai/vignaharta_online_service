import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First try to get circles from local database
    const { data: localCircles, error: localError } = await supabase
      .from('recharge_circles')
      .select('*')
      .eq('is_active', true)
      .order('circle_name');

    if (!localError && localCircles && localCircles.length > 0) {
      return NextResponse.json({
        success: true,
        data: localCircles.map(circle => ({
          id: circle.id,
          circle_code: circle.circle_code,
          circle_name: circle.circle_name,
          is_active: circle.is_active
        }))
      });
    }

    // If no local circles or API key available, fetch from KwikAPI
    if (!KWIKAPI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Circle data not available' },
        { status: 500 }
      );
    }

    // Fetch circles from KwikAPI
    const response = await fetch(`${KWIKAPI_BASE_URL}/api/v2/circle_codes.php?api_key=${KWIKAPI_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch circles from KwikAPI');
    }

    const data = await response.json();
    const circles = data.response || [];

    // Store circles in local database for future use
    const circleInserts = circles.map((circle: any) => ({
      circle_code: circle.circle_code,
      circle_name: circle.circle_name,
      is_active: true
    }));

    if (circleInserts.length > 0) {
      // Use upsert to avoid duplicates
      await supabase
        .from('recharge_circles')
        .upsert(circleInserts, { 
          onConflict: 'circle_code',
          ignoreDuplicates: false 
        });
    }

    return NextResponse.json({
      success: true,
      data: circles.map((circle: any) => ({
        circle_code: circle.circle_code,
        circle_name: circle.circle_name,
        is_active: true
      }))
    });

  } catch (error: any) {
    console.error('Circles API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}