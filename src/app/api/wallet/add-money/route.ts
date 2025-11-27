import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/wallet/add-money - Calculate GST for wallet recharge
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
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
    const gstPercentage = 4; // 4% GST
    const gstAmount = (rechargeAmount * gstPercentage) / 100;
    const totalPayable = rechargeAmount + gstAmount;

    return NextResponse.json({
      success: true,
      data: {
        recharge_amount: rechargeAmount,
        gst_percentage: gstPercentage,
        gst_amount: parseFloat(gstAmount.toFixed(2)),
        total_payable: parseFloat(totalPayable.toFixed(2)),
        wallet_credit: rechargeAmount // Only recharge amount will be added to wallet
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
