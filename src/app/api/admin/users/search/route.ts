import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Search users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Search by name, email, or phone
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        role,
        wallets(balance)
      `)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    // Format response with wallet balance
    const formattedUsers = users.map(user => ({
      ...user,
      wallet_balance: user.wallets?.[0]?.balance || 0,
      wallets: undefined
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
