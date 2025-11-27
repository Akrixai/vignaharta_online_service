import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Use direct SQL query to calculate leaderboard (bypasses RLS issues)
    const { data: leaderboardData, error: queryError } = await supabaseAdmin.rpc('get_monthly_leaderboard', {
      target_month: month,
      target_year: year
    });

    if (queryError) {
      console.error('RPC Error:', queryError);
      throw queryError;
    }

    const sortedRetailers = (leaderboardData || []).map((retailer: any) => ({
      ...retailer,
      users: {
        id: retailer.user_id,
        name: retailer.name,
        email: retailer.email,
        profile_photo_url: retailer.profile_photo_url
      }
    }));
    
    // Get top 3
    const topRetailers = sortedRetailers.slice(0, 3);

    // Get current user's rank if they're a retailer
    let currentUserRank = null;
    if (session.user.role === 'RETAILER') {
      const userRank = sortedRetailers.find((r: any) => r.user_id === session.user.id);
      if (userRank) {
        currentUserRank = userRank;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        topRetailers,
        currentUserRank,
        month,
        year,
        totalRetailers: sortedRetailers.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// Update leaderboard (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Call the database function to update leaderboard
    const { error } = await supabase.rpc('update_monthly_leaderboard');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Leaderboard updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update leaderboard' },
      { status: 500 }
    );
  }
}
