import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Simulate Cashfree webhook payload
    const webhookPayload = {
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: {
          order_id: order_id,
          order_status: 'PAID',
          payment_method: 'UPI',
          cf_order_id: `CF_${Date.now()}`,
        }
      }
    };

    // Call the actual webhook handler
    const webhookResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/wallet/cashfree/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const result = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Webhook simulated successfully',
      webhook_result: result,
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint',
    usage: 'POST with { "order_id": "REG..." }',
  });
}