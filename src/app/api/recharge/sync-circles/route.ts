import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch circles from KWIKAPI
    const circlesResponse = await kwikapi.getCircleCodes();

    if (!circlesResponse.success || !circlesResponse.data) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch circles from KWIKAPI' },
        { status: 500 }
      );
    }

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
