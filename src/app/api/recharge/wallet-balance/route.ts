import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch wallet balance from KWIKAPI
    const balanceResponse = await kwikapi.getWalletBalance();

    if (balanceResponse.success) {
      // Update local database
      await supabase
        .from('kwikapi_wallet')
        .upsert({
          wallet_balance: balanceResponse.data.wallet_balance,
          blocked_amount: balanceResponse.data.blocked_amount,
          available_balance: balanceResponse.data.available_balance,
          currency: balanceResponse.data.currency,
          last_updated: new Date().toISOString(),
          api_response: balanceResponse.data,
        });

      return NextResponse.json({
        success: true,
        data: balanceResponse.data,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Wallet Balance API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
