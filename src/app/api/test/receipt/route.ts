import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id') || 'PAN_1767355455055_869';

    console.log('🧪 Testing receipt generation for:', orderId);

    // Get PAN service data directly
    const { data: panService, error: findError } = await supabaseAdmin
      .from('pan_services')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          mobile_number,
          role
        )
      `)
      .eq('order_id', orderId)
      .single();

    if (findError || !panService) {
      return NextResponse.json({
        success: false,
        message: 'PAN service record not found',
        error: findError
      }, { status: 404 });
    }

    if (panService.status !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        message: 'Receipt can only be generated for successful applications',
        current_status: panService.status
      }, { status: 400 });
    }

    // Generate receipt data
    const receiptData = {
      // Basic Information
      order_id: panService.order_id,
      service_type: panService.service_type,
      mobile_number: panService.mobile_number,
      mode: panService.mode,
      amount: panService.amount,
      status: panService.status,
      
      // Payment Information
      payment_status: panService.payment_status,
      payment_charged_at: panService.payment_charged_at,
      
      // InsPay Details
      inspay_txid: panService.inspay_txid,
      inspay_opid: panService.inspay_opid,
      acknowledgement_number: panService.acknowledgement_number || panService.inspay_opid,
      
      // Callback Information
      callback_data: panService.callback_data,
      callback_raw_data: panService.callback_raw_data,
      webhook_received_at: panService.webhook_received_at,
      
      // Timestamps
      created_at: panService.created_at,
      completed_at: panService.completed_at,
      updated_at: panService.updated_at,
      
      // User Information
      user: {
        name: panService.users.name,
        email: panService.users.email,
        mobile: panService.users.mobile_number,
        role: panService.users.role
      },
      
      // Company Information
      company: {
        name: 'Vighnaharta Online Services',
        address: 'India',
        website: 'https://vighnahartaonlineservices.com',
        support_email: 'support@vighnahartaonlineservices.com'
      },
      
      // Receipt Metadata
      receipt_generated_at: new Date().toISOString(),
      receipt_id: `RCP_${panService.order_id}_${Date.now()}`
    };

    return NextResponse.json({
      success: true,
      message: 'Receipt data generated successfully',
      data: receiptData
    });

  } catch (error) {
    console.error('💥 Error in test receipt:', error);
    return NextResponse.json({
      success: false,
      message: 'Test receipt failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}