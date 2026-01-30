import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_bill_fetch_sessions');
    
    if (error) {
      console.error('❌ [Cleanup] Error cleaning up sessions:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to cleanup sessions', error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [Cleanup] Cleaned up ${data} expired bill fetch sessions`);
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${data} expired sessions`,
      deleted_count: data
    });
  } catch (error: any) {
    console.error('❌ [Cleanup] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Bill fetch session cleanup endpoint. Use POST to trigger cleanup.',
    info: 'This endpoint removes expired bill fetch sessions that are older than 30 minutes and not used for payment.'
  });
}