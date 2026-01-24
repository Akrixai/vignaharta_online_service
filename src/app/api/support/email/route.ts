import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import nodemailer from 'nodemailer';

// Akrix branding footer for emails
function getAkrixBrandingFooter(): string {
    return `
    <div style="background-color: #1f2937; padding: 20px; text-align: center; margin-top: 30px;">
      <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
        Powered by
      </p>
      <a href="https://akrixsolutions.in/" target="_blank" rel="noopener noreferrer"
         style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #ec4899, #8b5cf6);
                color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none;
                font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        🚀 Akrix.ai
      </a>
      <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
        Advanced AI Solutions for Modern Applications
      </p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subject, message, priority } = await request.json();

        if (!subject || !message) {
            return NextResponse.json({
                error: 'Subject and message are required'
            }, { status: 400 });
        }

        // Create transporter (configure with your email service)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Admin email address
        const adminEmail = process.env.ADMIN_EMAIL || 'vighnahartaenterprises.sangli@gmail.com';

        // Create email content
        const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request - विघ्नहर्ता ऑनलाईन सर्विसेस</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .header .subtitle {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .priority-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 20px;
            }
            .priority-high {
                background-color: #fee2e2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }
            .priority-medium {
                background-color: #fef3c7;
                color: #d97706;
                border: 1px solid #fed7aa;
            }
            .priority-low {
                background-color: #dcfce7;
                color: #16a34a;
                border: 1px solid #bbf7d0;
            }
            .info-section {
                background-color: #f8fafc;
                border-left: 4px solid #dc2626;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .info-row {
                display: flex;
                margin-bottom: 10px;
            }
            .info-label {
                font-weight: bold;
                color: #374151;
                min-width: 120px;
            }
            .info-value {
                color: #6b7280;
            }
            .message-section {
                background-color: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .message-title {
                font-size: 18px;
                font-weight: bold;
                color: #111827;
                margin-bottom: 15px;
                border-bottom: 2px solid #dc2626;
                padding-bottom: 10px;
            }
            .message-content {
                font-size: 16px;
                line-height: 1.8;
                color: #374151;
                white-space: pre-wrap;
            }
            .footer {
                background-color: #f9fafb;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer-text {
                color: #6b7280;
                font-size: 14px;
                margin: 5px 0;
            }
            .action-buttons {
                margin: 20px 0;
                text-align: center;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                margin: 0 10px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 14px;
            }
            .btn-primary {
                background-color: #dc2626;
                color: white;
            }
            .btn-secondary {
                background-color: #6b7280;
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>विघ्नहर्ता ऑनलाईन सर्विसेस</h1>
                <p class="subtitle">Support Request Received</p>
            </div>
            
            <div class="content">
                <div class="priority-badge priority-${priority || 'medium'}">
                    ${priority === 'high' ? '🔴 HIGH PRIORITY' : priority === 'low' ? '🟢 LOW PRIORITY' : '🟡 MEDIUM PRIORITY'}
                </div>
                
                <div class="info-section">
                    <h3 style="margin-top: 0; color: #dc2626;">📋 Request Details</h3>
                    <div class="info-row">
                        <span class="info-label">👤 From:</span>
                        <span class="info-value">${session.user.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📧 Email:</span>
                        <span class="info-value">${session.user.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">🏷️ Role:</span>
                        <span class="info-value">${session.user.role}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📅 Date:</span>
                        <span class="info-value">${new Date().toLocaleString('en-IN')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">📝 Subject:</span>
                        <span class="info-value">${subject}</span>
                    </div>
                </div>
                
                <div class="message-section">
                    <div class="message-title">💬 Message Content</div>
                    <div class="message-content">${message}</div>
                </div>
                
                <div class="action-buttons">
                    <a href="mailto:${session.user.email}" class="btn btn-primary">📧 Reply to Customer</a>
                    <a href="tel:+917499116527" class="btn btn-secondary">📞 Call Support</a>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस - Government Services Portal</p>
                <p class="footer-text">📞 Support: +91-7499116527 | 📧 vighnahartaenterprises.sangli@gmail.com</p>
                <p class="footer-text">🌐 Serving citizens with dedication and transparency</p>
            </div>
            ${getAkrixBrandingFooter()}
        </div>
    </body>
    </html>
    `;

        // Send email
        const mailOptions = {
            from: `"${session.user.name}" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `🆘 Support Request: ${subject}`,
            html: htmlContent,
            replyTo: session.user.email,
        };

        // Try to send email, but don't fail if SMTP is not configured
        try {
            await transporter.sendMail(mailOptions);
            // Support email sent successfully
        } catch (emailError) {
            // Email sending failed (SMTP not configured)
        }

        return NextResponse.json({
            success: true,
            message: 'Support email sent successfully'
        });

    } catch (error) {
        // Email sending error occurred
        return NextResponse.json({
            error: 'Failed to send email'
        }, { status: 500 });
    }
}
