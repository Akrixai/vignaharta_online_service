import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/wallet/manual-recharge - Submit manual wallet recharge request with QR payment
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const amount = parseFloat(formData.get('amount') as string);
    const paymentScreenshot = formData.get('payment_screenshot') as File;
    const utrNumber = formData.get('utr_number') as string;
    const payerName = formData.get('payer_name') as string;
    const payerPhone = formData.get('payer_phone') as string;
    const payerUpiId = formData.get('payer_upi_id') as string;
    const transactionDate = formData.get('transaction_date') as string;
    const paymentMode = formData.get('payment_mode') as string || 'MANUAL_QR';

    // Validation
    if (!amount || amount < 10) {
      return NextResponse.json(
        { success: false, error: 'Minimum recharge amount is ₹10' },
        { status: 400 }
      );
    }

    if (!paymentScreenshot) {
      return NextResponse.json(
        { success: false, error: 'Payment screenshot is required' },
        { status: 400 }
      );
    }

    if (!payerName || !payerPhone) {
      return NextResponse.json(
        { success: false, error: 'Payer name and phone are required' },
        { status: 400 }
      );
    }

    // Upload screenshot to Supabase Storage using admin client
    const fileExt = paymentScreenshot.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const bytes = await paymentScreenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('wallet-screenshots')
      .upload(fileName, buffer, {
        contentType: paymentScreenshot.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload screenshot' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('wallet-screenshots')
      .getPublicUrl(fileName);

    // Create wallet request (No GST for manual QR payments)
    const { data: walletRequest, error: requestError } = await supabaseAdmin
      .from('wallet_requests')
      .insert({
        user_id: user.id,
        type: 'TOPUP',
        amount: amount,
        base_amount: amount, // Full amount without GST
        gst_percentage: 0, // No GST for manual QR
        gst_amount: 0,
        total_amount_paid: amount,
        status: 'PENDING',
        payment_mode: paymentMode,
        screenshot_url: publicUrl,
        utr_number: utrNumber || null,
        payer_name: payerName,
        payer_phone: payerPhone,
        payer_upi_id: payerUpiId || null,
        transaction_date: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString(),
        description: `Manual QR wallet recharge of ₹${amount} (No GST)`,
        metadata: {
          payment_method: 'QR_CODE',
          submission_time: new Date().toISOString(),
          no_gst: true,
        },
      })
      .select()
      .single();

    if (requestError) {
      console.error('Request error:', requestError);
      return NextResponse.json(
        { success: false, error: 'Failed to create wallet request' },
        { status: 500 }
      );
    }

    // Create notification for admin/employee
    await supabaseAdmin.from('notifications').insert({
      title: 'New Manual Wallet Recharge Request',
      message: `${user.name} has submitted a manual wallet recharge request for ₹${amount}`,
      type: 'WALLET_REQUEST',
      target_roles: ['ADMIN', 'EMPLOYEE'],
      data: {
        wallet_request_id: walletRequest.id,
        user_id: user.id,
        amount: amount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet recharge request submitted successfully',
      request: walletRequest,
    });
  } catch (error: any) {
    console.error('Error creating manual recharge request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create recharge request' },
      { status: 500 }
    );
  }
}
