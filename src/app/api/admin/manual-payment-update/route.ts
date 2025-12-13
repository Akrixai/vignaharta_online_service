import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { order_id, status, payment_method } = await request.json();

    if (!order_id || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Update the payment status
    const { error } = await supabaseAdmin
      .from('cashfree_registration_payments')
      .update({
        status: status,
        payment_method: payment_method || 'MANUAL_VERIFICATION',
        payment_time: new Date().toISOString(),
        webhook_data: {
          manually_updated: true,
          updated_by: 'admin',
          updated_at: new Date().toISOString(),
          reason: 'Manual status update by admin'
        }
      })
      .eq('order_id', order_id);

    if (error) {
      console.error('Error updating payment status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Manual payment update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}