import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', authUser.email)
      .single();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch circles from KWIKAPI using axios directly
    const axios = require('axios');
    const KWIKAPI_BASE_URL = process.env.KWIKAPI_BASE_URL || 'https://www.kwikapi.com';
    const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY!;

    const response = await axios.get(
      `${KWIKAPI_BASE_URL}/api/v2/circle_codes.php`,
      {
        params: { api_key: KWIKAPI_API_KEY },
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.response) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch circles from KWIKAPI' },
        { status: 500 }
      );
    }

    const circlesResponse = {
      success: true,
      data: response.data.response,
    };

    const circles = circlesResponse.data;
    let syncedCount = 0;
    let updatedCount = 0;

    // Sync circles to database
    for (const circle of circles) {
      const { data: existing } = await supabase
        .from('recharge_circles')
        .select('id')
        .eq('circle_code', circle.circle_code)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('recharge_circles')
          .update({
            circle_name: circle.circle_name,
            is_active: true,
          })
          .eq('circle_code', circle.circle_code);
        updatedCount++;
      } else {
        // Insert new
        await supabase.from('recharge_circles').insert({
          circle_code: circle.circle_code,
          circle_name: circle.circle_name,
          is_active: true,
        });
        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new circles, updated ${updatedCount} existing circles`,
      data: {
        total: circles.length,
        synced: syncedCount,
        updated: updatedCount,
      },
    });
  } catch (error: any) {
    console.error('Sync Circles API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
