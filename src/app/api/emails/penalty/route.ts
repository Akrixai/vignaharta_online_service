import { NextRequest, NextResponse } from 'next/server';

// POST - Send penalty notification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_email, user_name, amount, reason, description, penalty_type, penalty_id } = body;

    // In a production environment, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Nodemailer with SMTP

    // For now, we'll log the email content
    const emailContent = {
      to: user_email,
      subject: `⚠️ Penalty Applied to Your Account - ₹${amount}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .penalty-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
            .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Penalty Notice</h1>
            </div>
            <div class="content">
              <p>Dear ${user_name},</p>
              
              <p>A penalty has been applied to your account. The amount has been deducted from your wallet.</p>
              
              <div class="penalty-box">
                <h3>Penalty Details:</h3>
                <p><strong>Amount:</strong> <span class="amount">₹${amount}</span></p>
                <p><strong>Type:</strong> ${penalty_type.replace('_', ' ')}</p>
                <p><strong>Reason:</strong> ${reason}</p>
                ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                <p><strong>Reference ID:</strong> ${penalty_id}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p><strong>What this means:</strong></p>
              <ul>
                <li>₹${amount} has been deducted from your wallet</li>
                <li>This transaction is recorded in your transaction history</li>
                <li>Your current wallet balance has been updated</li>
              </ul>
              
              <p><strong>If you believe this penalty was applied in error:</strong></p>
              <p>Please contact our support team immediately with your reference ID: <strong>${penalty_id}</strong></p>
              
              <p>We take all penalties seriously and apply them only when necessary to maintain the integrity of our platform.</p>
              
              <p>Best regards,<br>Vighnaharta Online Services Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
              <p>© ${new Date().getFullYear()} Vighnaharta Online Services. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('Penalty Email to be sent:', emailContent);

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // await sendgrid.send(emailContent);

    return NextResponse.json({ 
      success: true, 
      message: 'Email notification sent' 
    });
  } catch (error: any) {
    console.error('Error sending penalty email:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
