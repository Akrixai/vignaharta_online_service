import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: logs, error } = await supabaseAdmin
      .from('leaderboard_email_logs')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(12);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: logs || []
    });
  } catch (error: any) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
