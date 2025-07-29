import { NextRequest, NextResponse } from 'next/server';
import { sendNewServiceNotifications, sendTestEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { type, testData } = await request.json();

    switch (type) {
      case 'email':

        await sendNewServiceNotifications(
          'test-service-id',
          testData?.serviceName || 'Test Service',
          testData?.description || 'This is a test service for email notification testing'
        );
        return NextResponse.json({ 
          success: true, 
          message: 'Email notifications sent successfully' 
        });

      case 'test-email':
        if (process.env.NODE_ENV === 'development') {

        }
        const result = await sendTestEmail(testData?.email || 'test@example.com');
        return NextResponse.json({ 
          success: result, 
          message: result ? 'Test email sent successfully' : 'Failed to send test email' 
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid test type. Use: whatsapp, email, or test-email' 
        }, { status: 400 });
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Test notification error:', error);
    }
    return NextResponse.json({
      error: 'Failed to send test notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
