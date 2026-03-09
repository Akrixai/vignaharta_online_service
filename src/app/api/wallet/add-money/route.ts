import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST /api/wallet/add-money - No GST for wallet recharge
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const rechargeAmount = parseFloat(amount);

    return NextResponse.json({
      success: true,
      data: {
        recharge_amount: rechargeAmount,
        gst_percentage: 0, // No GST
        gst_amount: 0,
        total_payable: rechargeAmount,
        wallet_credit: rechargeAmount
      }
    });

  } catch (error) {
    console.error('Wallet add money calculation error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
