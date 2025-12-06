import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse FormData for file upload
    const formData = await request.formData();
    const amount = formData.get('amount') as string;
    const qrCodeImage = formData.get('qr_code_image') as File;
    const reason = formData.get('reason') as string;

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({
        error: 'Valid amount is required'
      }, { status: 400 });
    }

    if (!qrCodeImage || qrCodeImage.size === 0) {
      return NextResponse.json({
        error: 'QR code image is required'
      }, { status: 400 });
    }

    // Validate file type
    if (!qrCodeImage.type.startsWith('image/')) {
      return NextResponse.json({
        error: 'Only image files are allowed'
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (qrCodeImage.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: 'Image size must be less than 5MB'
      }, { status: 400 });
    }

    // Check if user has sufficient balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({
        error: 'Wallet not found'
      }, { status: 404 });
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return NextResponse.json({
        error: 'Insufficient wallet balance'
      }, { status: 400 });
    }

    // Upload QR code image to Supabase storage
    const fileExtension = qrCodeImage.name.split('.').pop() || 'jpg';
    const fileName = `withdrawal-qr-${user.id}-${Date.now()}.${fileExtension}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await qrCodeImage.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('withdrawal-qr-codes')
      .upload(fileName, uint8Array, {
        contentType: qrCodeImage.type,
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({
        error: `Failed to upload QR code image: ${uploadError.message}`,
        details: uploadError.error
      }, { status: 500 });
    }

    // Get public URL for the uploaded image
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('withdrawal-qr-codes')
      .getPublicUrl(fileName);

    const qrCodeUrl = publicUrlData.publicUrl;

    // Create withdrawal request
    const { data: withdrawalRequest, error: requestError } = await supabaseAdmin
      .from('wallet_requests')
      .insert({
        user_id: user.id,
        type: 'WITHDRAWAL',
        amount: parseFloat(amount),
        payment_method: 'UPI_QR',
        description: reason || 'Wallet withdrawal request via QR code',
        metadata: {
          qr_code_url: qrCodeUrl,
          qr_code_filename: fileName,
          withdrawal_reason: reason,
          uploaded_at: new Date().toISOString()
        },
        status: 'PENDING'
      })
      .select()
      .single();

    if (requestError) {
      return NextResponse.json({
        error: 'Failed to create withdrawal request'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request with QR code submitted successfully. Waiting for admin approval.',
      request_id: withdrawalRequest.id,
      qr_code_url: qrCodeUrl
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
