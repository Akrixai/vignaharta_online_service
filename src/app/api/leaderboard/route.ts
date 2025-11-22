import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabase
      .from('monthly_leaderboard')
      .select(`
        *,
        users!inner(id, name, city, state)
      `)
      .eq('month', month)
      .eq('year', year)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ leaderboard: data || [] });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Recalculate leaderboard for current month
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get all retailers with their stats
    const { data: stats, error: statsError } = await supabase.rpc('calculate_monthly_stats', {
      target_month: month,
      target_year: year
    });

    if (statsError) {
      console.error('Stats calculation error:', statsError);
      return NextResponse.json({ error: 'Failed to calculate stats' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard updated successfully',
      stats 
    });
  } catch (error: any) {
    console.error('Update leaderboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
