import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/wallet/qr-recharge - Submit QR payment request for manual approval
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      utr_number,
      transaction_date,
      payer_name,
      payer_phone,
      payer_upi_id,
      payment_mode,
      screenshot_url,
      description,
    } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!utr_number) {
      return NextResponse.json({ error: 'UTR/Transaction number is required' }, { status: 400 });
    }

    if (!screenshot_url) {
      return NextResponse.json({ error: 'Payment screenshot is required' }, { status: 400 });
    }

    if (!payer_name || !payer_phone) {
      return NextResponse.json({ error: 'Payer name and phone are required' }, { status: 400 });
    }

    // Create wallet request
    const { data: walletRequest, error: requestError } = await supabaseAdmin
      .from('wallet_requests')
      .insert({
        user_id: session.user.id,
        type: 'TOPUP',
        amount: parseFloat(amount),
        status: 'PENDING',
        payment_method: payment_mode || 'UPI',
        transaction_reference: utr_number,
        screenshot_url,
        description: description || `QR Payment - UTR: ${utr_number}`,
        utr_number,
        transaction_date: transaction_date || new Date().toISOString(),
        payer_name,
        payer_phone,
        payer_upi_id,
        payment_mode: payment_mode || 'UPI',
        metadata: {
          payment_type: 'QR_MANUAL',
          no_gst: true,
          utr_number,
          payer_details: {
            name: payer_name,
            phone: payer_phone,
            upi_id: payer_upi_id,
          },
        },
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating wallet request:', requestError);
      return NextResponse.json({
        error: 'Failed to submit payment request',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment request submitted successfully. It will be reviewed by admin/employee.',
      request: walletRequest,
    });
  } catch (error) {
    console.error('Error submitting QR recharge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
