import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    // Check if user is authenticated and is ADMIN
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch wallet balance from KWIKAPI
    const balanceResponse = await kwikapi.getWalletBalance();

    if (balanceResponse.success) {
      const balance = balanceResponse.data.balance || '0';
      const planCredit = balanceResponse.data.plan_credit || '0';

      // Update local database
      const { data: existingWallet } = await supabase
        .from('kwikapi_wallet')
        .select('id')
        .limit(1)
        .single();

      if (existingWallet) {
        await supabase
          .from('kwikapi_wallet')
          .update({
            wallet_balance: parseFloat(balance),
            available_balance: parseFloat(balance),
            blocked_amount: 0,
            currency: 'INR',
            last_updated: new Date().toISOString(),
            api_response: balanceResponse.data,
          })
          .eq('id', existingWallet.id);
      } else {
        await supabase.from('kwikapi_wallet').insert({
          wallet_balance: parseFloat(balance),
          available_balance: parseFloat(balance),
          blocked_amount: 0,
          currency: 'INR',
          last_updated: new Date().toISOString(),
          api_response: balanceResponse.data,
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          balance: parseFloat(balance),
          plan_credit: parseFloat(planCredit),
          available_balance: parseFloat(balance),
          currency: 'INR',
        },
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
