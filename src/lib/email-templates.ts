// Email templates for various notifications

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

// Akrix branding footer for all emails
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

// Text version of Akrix branding
function getAkrixBrandingText(): string {
    return `

---
Powered by Akrix Solutions
Visit: https://akrixsolutions.in/
Advanced AI Solutions for Modern Applications
`;
}

// New Service Added Template
export function getNewServiceEmailTemplate(
    serviceName: string,
    serviceDescription: string,
    recipientName: string,
    recipientType: 'retailer' | 'employee' | 'admin'
): EmailTemplate {
    const subject = `🎉 New Service Available: ${serviceName}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Service Available</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .service-card { background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 2px solid #fca5a5; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .service-name { color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 15px; }
        .service-description { color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .cta-button { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; }
        .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e; }
        .emoji { font-size: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस</div>
            <h1>New Service Available!</h1>
            <p>Exciting news for our ${recipientType}s</p>
        </div>
        
        <div class="content">
            <h2>Hello ${recipientName}! 👋</h2>
            
            <p>We're excited to announce that a <span class="highlight">new service</span> has been added to our platform!</p>
            
            <div class="service-card">
                <div class="service-name">🎯 ${serviceName}</div>
                <div class="service-description">${serviceDescription}</div>
                
                <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
                    <strong>📋 What this means for you:</strong><br>
                    ${recipientType === 'retailer'
            ? '• You can now offer this service to your customers<br>• Start earning commission from day one<br>• Help more people access digital services'
            : '• You can now assist customers with this service<br>• New service to help citizens<br>• Expand your service knowledge'
        }
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="https://www.vighnahartaonlineservice.in/dashboard/services" class="cta-button">
                    🚀 View Service Details
                </a>
            </div>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-top: 0;">💡 Quick Tips:</h3>
                <ul style="color: #1e40af; margin: 0;">
                    <li>Login to your dashboard to see all service details</li>
                    <li>Check the required documents and processing time</li>
                    <li>Start helping customers with this new service today!</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making digital services accessible to everyone</p>
            <p style="font-size: 12px; margin-top: 20px;">
                This is an automated notification. Please do not reply to this email.
            </p>
        </div>
        ${getAkrixBrandingFooter()}
    </div>
</body>
</html>`;

    const text = `
New Service Available: ${serviceName}

Hello ${recipientName}!

We're excited to announce that a new service has been added to our platform!

Service: ${serviceName}
Description: ${serviceDescription}

What this means for you:
${recipientType === 'retailer'
            ? '- You can now offer this service to your customers\n- Start earning commission from day one\n- Help more people access digital services'
            : recipientType === 'employee'
                ? '- You can now assist customers with this service\n- New service to help citizens\n- Expand your service knowledge'
                : '- New service has been added to the platform\n- Monitor service performance and user feedback\n- Manage service operations and support'
        }

Visit your dashboard to view service details: https://www.vighnahartaonlineservice.in/dashboard/services

Best regards,
विघ्नहर्ता ऑनलाईन सर्विसेस Team
${getAkrixBrandingText()}`;

    return { subject, html, text };
}

// Welcome Email for New Retailer
export function getWelcomeRetailerEmailTemplate(
    name: string,
    email: string,
    password: string
): EmailTemplate {
    const subject = `🎉 Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस - Your Retailer Account is Ready!`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
        .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border-radius: 20px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #059669, #047857, #065f46); color: white; padding: 40px 30px; text-align: center; position: relative; }
        .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 15px; position: relative; z-index: 1; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header h1 { position: relative; z-index: 1; margin: 0; font-size: 28px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .header p { position: relative; z-index: 1; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 50px 40px; }
        .welcome-badge { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 50px; padding: 15px 25px; display: inline-block; margin-bottom: 30px; }
        .credentials-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 3px solid #86efac; border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.1); }
        .credentials-box h3 { color: #059669; margin-top: 0; font-size: 20px; display: flex; align-items: center; }
        .credential-item { background: white; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #059669; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .password-display { background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #1e293b; border: 2px dashed #059669; letter-spacing: 1px; }
        .cta-button { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 18px 35px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; margin: 25px 0; font-size: 16px; box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3); transition: all 0.3s ease; }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(5, 150, 105, 0.4); }
        .info-section { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #3b82f6; }
        .benefits-section { background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #22c55e; }
        .footer { background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 40px 30px; text-align: center; color: #6b7280; }
        .highlight { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 4px 8px; border-radius: 6px; color: #92400e; font-weight: bold; }
        .warning { background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 2px solid #fca5a5; padding: 20px; border-radius: 12px; color: #dc2626; margin: 20px 0; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .feature-item { background: white; padding: 15px; border-radius: 8px; border-left: 3px solid #059669; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .step-item { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #22c55e; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        @media (max-width: 600px) { .feature-grid { grid-template-columns: 1fr; } .content { padding: 30px 20px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस</div>
            <h1>🎉 Welcome to Our Network!</h1>
            <p>Your retailer account is now active and ready to use</p>
        </div>
        
        <div class="content">
            <div class="welcome-badge">
                <strong>🌟 Congratulations ${name}! 🌟</strong>
            </div>
            
            <p style="font-size: 18px; line-height: 1.6; color: #374151;">
                Welcome to <span class="highlight">विघ्नहर्ता ऑनलाईन सर्विसेस</span>! You are now officially part of our trusted network of service providers, helping citizens access digital services with ease and efficiency.
            </p>
            
            <div class="credentials-box">
                <h3>🔐 Your Login Credentials</h3>
                <div class="credential-item">
                    <strong>📧 Email Address:</strong><br>
                    <span style="color: #059669; font-size: 16px; font-weight: bold;">${email}</span>
                </div>
                <div class="credential-item">
                    <strong>🔑 Password:</strong><br>
                    <div class="password-display">${password}</div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong><br>
                    For your account security, please change your password immediately after your first login. Never share your credentials with anyone.
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'https://www.vighnahartaonlineservice.in'}/login?role=retailer" class="cta-button">
                    🚀 Login to Your Dashboard
                </a>
            </div>
            
            <div class="info-section">
                <h3 style="color: #1e40af; margin-top: 0; font-size: 20px;">🎯 What You Can Do Now:</h3>
                <div class="feature-grid">
                    <div class="feature-item">
                        <strong>🏛️ digital services</strong><br>
                        <small>Help customers with 100+ service applications</small>
                    </div>
                    <div class="feature-item">
                        <strong>💰 Earn Commission</strong><br>
                        <small>Get paid up to 15% for every successful service</small>
                    </div>
                    <div class="feature-item">
                        <strong>💳 Digital Wallet</strong><br>
                        <small>Track earnings and manage payments easily</small>
                    </div>
                    <div class="feature-item">
                        <strong>🆘 24/7 Support</strong><br>
                        <small>Get help from our employee team anytime</small>
                    </div>
                </div>
            </div>
            
            <div class="benefits-section">
                <h3 style="color: #15803d; margin-top: 0; font-size: 20px;">📋 Your Next Steps:</h3>
                <div class="step-item">
                    <strong>1.</strong> Login to your dashboard using the credentials above
                </div>
                <div class="step-item">
                    <strong>2.</strong> Complete your profile setup and verify your details
                </div>
                <div class="step-item">
                    <strong>3.</strong> Browse available services and understand the process
                </div>
                <div class="step-item">
                    <strong>4.</strong> Start helping customers and earning commission today!
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #fef7cd, #fef3c7); padding: 20px; border-radius: 12px; border: 2px solid #f59e0b; text-align: center; margin: 30px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0;">🎊 Special Welcome Bonus</h4>
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                    As a new retailer, you'll receive priority support during your first month. Our team is here to help you succeed!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">विघ्नहर्ता ऑनलाईन सर्विसेस</p>
            <p style="margin-bottom: 20px;">Making digital services accessible to everyone</p>
            <p style="font-size: 12px; color: #9ca3af;">
                Need help? Contact our support team at <strong>vighnahartaenterprises.sangli@gmail.com</strong><br>
                or use the chat feature in your dashboard for instant assistance.
            </p>
        </div>
        ${getAkrixBrandingFooter()}
    </div>
</body>
</html>`;

    const text = `
🎉 Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस!

Congratulations ${name}!

Your retailer account has been successfully created and is now active. You are now part of our trusted network of service providers!

🔐 YOUR LOGIN CREDENTIALS:
Email: ${email}
Password: ${password}

⚠️ IMPORTANT SECURITY NOTICE:
Please change your password immediately after your first login for account security. Never share your credentials with anyone.

🚀 LOGIN TO YOUR DASHBOARD:
${process.env.NEXTAUTH_URL || 'https://www.vighnahartaonlineservice.in'}/login?role=retailer

🎯 WHAT YOU CAN DO NOW:
• digital services: Help customers with 100+ service applications
• Earn Commission: Get paid up to 15% for every successful service
• Digital Wallet: Track your earnings and manage payments easily
• 24/7 Support: Get help from our employee team anytime

📋 YOUR NEXT STEPS:
1. Login to your dashboard using the credentials above
2. Complete your profile setup and verify your details
3. Browse available services and understand the process
4. Start helping customers and earning commission today!

🎊 SPECIAL WELCOME BONUS:
As a new retailer, you'll receive priority support during your first month. Our team is here to help you succeed!

Need help? Contact our support team at vighnahartaenterprises.sangli@gmail.com or use the chat feature in your dashboard for instant assistance.

Best regards,
विघ्नहर्ता ऑनलाईन सर्विसेस Team

Making digital services accessible to everyone
${getAkrixBrandingText()}`;

    return { subject, html, text };
}

// Welcome Email for New Employee
export function getWelcomeEmployeeEmailTemplate(
    name: string,
    email: string,
    password: string
): EmailTemplate {
    const subject = `🎉 Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस - Your Employee Account is Ready!`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .credentials-box { background: linear-gradient(135deg, #faf5ff, #f3e8ff); border: 2px solid #c4b5fd; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .cta-button { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; }
        .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e; }
        .warning { background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; color: #dc2626; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस</div>
            <h1>Welcome to Our Team!</h1>
            <p>Your employee account is now active</p>
        </div>

        <div class="content">
            <h2>Welcome ${name}! 🎉</h2>

            <p>Welcome to <span class="highlight">विघ्नहर्ता ऑनलाईन सर्विसेस</span>! You are now part of the <span class="highlight">विघ्नहर्ता ऑनलाईन सर्विसेस</span> team, helping citizens and supporting our retailer network.</p>

            <div class="credentials-box">
                <h3 style="color: #7c3aed; margin-top: 0;">🔐 Your Login Credentials</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>

                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong><br>
                    Please change your password after your first login for security purposes.
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'https://www.vighnahartaonlineservice.in'}/login?role=employee" class="cta-button">
                    🚀 Login to Dashboard
                </a>
            </div>

            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-top: 0;">🎯 Your Responsibilities:</h3>
                <ul style="color: #1e40af; margin: 0;">
                    <li><strong>Support Retailers:</strong> Help retailers with service-related queries</li>
                    <li><strong>Process Applications:</strong> Review and process customer applications</li>
                    <li><strong>Real-time Chat:</strong> Provide instant support through our chat system</li>
                    <li><strong>Quality Assurance:</strong> Ensure high-quality service delivery</li>
                </ul>
            </div>

            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
                <h3 style="color: #15803d; margin-top: 0;">📋 Next Steps:</h3>
                <ol style="color: #15803d; margin: 0;">
                    <li>Login to your dashboard using the credentials above</li>
                    <li>Complete your profile setup</li>
                    <li>Familiarize yourself with available services</li>
                    <li>Start supporting our retailer network!</li>
                </ol>
            </div>
        </div>

        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making digital services accessible to everyone</p>
            <p style="font-size: 12px; margin-top: 20px;">
                Need help? Contact the admin team or use the internal communication channels.
            </p>
        </div>
        ${getAkrixBrandingFooter()}
    </div>
</body>
</html>`;

    const text = `
Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस!

Hello ${name}!

Congratulations! Your employee account has been successfully created.

Your Login Credentials:
Email: ${email}
Password: ${password}

IMPORTANT: Please change your password after your first login for security.

Login here: ${process.env.NEXTAUTH_URL || 'https://www.vighnahartaonlineservice.in'}/login?role=employee

Your Responsibilities:
- Support Retailers: Help retailers with service-related queries
- Process Applications: Review and process customer applications
- Real-time Chat: Provide instant support through our chat system
- Quality Assurance: Ensure high-quality service delivery

Next Steps:
1. Login to your dashboard using the credentials above
2. Complete your profile setup
3. Familiarize yourself with available services
4. Start supporting our retailer network!

Best regards,
विघ्नहर्ता ऑनलाईन सर्विसेस Team
${getAkrixBrandingText()}`;

    return { subject, html, text };
}

// Registration Success Email Template
export function getRegistrationSuccessEmailTemplate(
    name: string,
    email: string
): EmailTemplate {
    const subject = `✅ Registration Submitted Successfully - विघ्नहर्ता ऑनलाईन सर्विसेस`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Submitted Successfully</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .success-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .cta-button { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; }
        .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e; }
        .info-box { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस</div>
            <h1>Registration Submitted!</h1>
            <p>Thank you for your interest in joining our network</p>
        </div>
        
        <div class="content">
            <h2>Hello ${name}! 🎉</h2>
            
            <p>Thank you for submitting your registration to <span class="highlight">विघ्नहर्ता ऑनलाईन सर्विसेस</span>! We're excited to have you join our network of service providers.</p>
            
            <div class="success-box">
                <h3 style="color: #059669; margin-top: 0;">✅ Registration Details</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Pending Approval</span></p>
                
                <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #059669; margin-top: 15px;">
                    <strong>📋 What happens next:</strong><br>
                    • Our admin team will review your application<br>
                    • You'll receive an email notification once approved<br>
                    • Upon approval, you'll get login credentials<br>
                    • You can then start offering services to customers
                </div>
            </div>
            
            <div class="info-box">
                <h3 style="color: #1e40af; margin-top: 0;">⏱️ Processing Time</h3>
                <p style="color: #1e40af; margin: 0;">
                    We typically review applications within <strong>24-48 hours</strong>. You'll receive an email notification as soon as your application is processed.
                </p>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
                <h3 style="color: #15803d; margin-top: 0;">🎯 What You Can Expect:</h3>
                <ul style="color: #15803d; margin: 0;">
                    <li><strong>Access to digital services:</strong> Help customers with various applications</li>
                    <li><strong>Commission Earnings:</strong> Earn money for every successful service</li>
                    <li><strong>Digital Wallet:</strong> Manage your earnings and payments</li>
                    <li><strong>24/7 Support:</strong> Get help whenever you need it</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making digital services accessible to everyone</p>
            <p style="font-size: 12px; margin-top: 20px;">
                Questions? Contact us at vighnahartaenterprises.sangli@gmail.com
            </p>
        </div>
        ${getAkrixBrandingFooter()}
    </div>
</body>
</html>`;

    const text = `
Registration Submitted Successfully - विघ्नहर्ता ऑनलाईन सर्विसेस

Hello ${name}!

Thank you for submitting your registration to विघ्नहर्ता ऑनलाईन सर्विसेस! We're excited to have you join our network of service providers.

Registration Details:
Name: ${name}
Email: ${email}
Status: Pending Approval

What happens next:
• Our admin team will review your application
• You'll receive an email notification once approved
• Upon approval, you'll get login credentials
• You can then start offering services to customers

Processing Time:
We typically review applications within 24-48 hours. You'll receive an email notification as soon as your application is processed.

What You Can Expect:
- Access to digital services: Help customers with various applications
- Commission Earnings: Earn money for every successful service
- Digital Wallet: Manage your earnings and payments
- 24/7 Support: Get help whenever you need it

Questions? Contact us at vighnahartaenterprises.sangli@gmail.com

Best regards,
विघ्नहर्ता ऑनलाईन सर्विसेस Team
${getAkrixBrandingText()}`;

    return { subject, html, text };
}

// Registration Rejection Email Template
export function getRegistrationRejectionEmailTemplate(
    name: string,
    email: string,
    rejectionReason: string
): EmailTemplate {
    const subject = `❌ Registration Update - विघ्नहर्ता ऑनलाईन सर्विसेस`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Update</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .rejection-box { background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 2px solid #fca5a5; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .cta-button { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; }
        .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e; }
        .info-box { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस</div>
            <h1>Registration Update</h1>
            <p>Important information about your application</p>
        </div>
        
        <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>We regret to inform you that your registration application for <span class="highlight">विघ्नहर्ता ऑनलाईन सर्विसेस</span> has been reviewed and could not be approved at this time.</p>
            
            <div class="rejection-box">
                <h3 style="color: #dc2626; margin-top: 0;">❌ Application Status</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">Not Approved</span></p>
                
                <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin-top: 15px;">
                    <strong>📋 Reason for Rejection:</strong><br>
                    ${rejectionReason}
                </div>
            </div>
            
            <div class="info-box">
                <h3 style="color: #1e40af; margin-top: 0;">🔄 Can I Reapply?</h3>
                <p style="color: #1e40af; margin: 0;">
                    <strong>Yes, absolutely!</strong> You can submit a new application after addressing the issues mentioned above. We encourage you to review the requirements and ensure all information is accurate and complete.
                </p>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
                <h3 style="color: #15803d; margin-top: 0;">💡 Tips for Reapplication:</h3>
                <ul style="color: #15803d; margin: 0;">
                    <li>Ensure all required fields are filled completely</li>
                    <li>Verify your contact information is accurate</li>
                    <li>Make sure your business address is valid</li>
                    <li>Double-check your phone number and email</li>
                    <li>Ensure you meet all eligibility requirements</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'https://www.vighnahartaonlineservice.in'}/register" class="cta-button">
                    🔄 Submit New Application
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making digital services accessible to everyone</p>
            <p style="font-size: 12px; margin-top: 20px;">
                Need help? Contact us at vighnahartaenterprises.sangli@gmail.com
            </p>
        </div>
        ${getAkrixBrandingFooter()}
    </div>
</body>
</html>`;

    const text = `
Registration Update - विघ्नहर्ता ऑनलाईन सर्विसेस

Hello ${name},

We regret to inform you that your registration application for विघ्नहर्ता ऑनलाईन सर्विसेस has been reviewed and could not be approved at this time.

Application Status:
Name: ${name}
Email: ${email}
Status: Not Approved

Reason for Rejection:
${rejectionReason}

Can I Reapply?
Yes, absolutely! You can submit a new application after addressing the issues mentioned above. We encourage you to review the requirements and ensure all information is accurate and complete.

Tips for Reapplication:
- Ensure all required fields are filled completely
- Verify your contact information is accurate
- Make sure your business address is valid
- Double-check your phone number and email
- Ensure you meet all eligibility requirements

Submit a new application: ${process.env.NEXTAUTH_URL || 'https://www.vighnahartaonlineservice.in'}/register

Need help? Contact us at vighnahartaenterprises.sangli@gmail.com

Best regards,
विघ्नहर्ता ऑनलाईन सर्विसेस Team
${getAkrixBrandingText()}`;

    return { subject, html, text };
}

// Password Reset Email Template
export function getPasswordResetEmailTemplate(
    name: string,
    resetUrl: string
): EmailTemplate {
    const subject = `🔐 Reset Your Password - विघ्नहर्ता ऑनलाईन सर्विसेस`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; margin-top: 30px; margin-bottom: 30px; }
        .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .cta-button { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 25px 0; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); }
        .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
        .info-box { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .link-text { background-color: #f9fafb; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px; color: #4b5563; border: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस</div>
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Hello <strong>${name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                We received a request to reset your password for your account. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="cta-button">
                    Reset My Password
                </a>
            </div>
            
            <div class="info-box">
                <p style="color: #991b1b; font-weight: bold; margin-top: 0;">⏰ Important Information:</p>
                <ul style="color: #7f1d1d; margin: 0; padding-left: 20px;">
                    <li>This link will expire in <strong>1 hour</strong>.</li>
                    <li>If you didn't request this, please ignore this email.</li>
                    <li>Your password won't change until you create a new one.</li>
                </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div class="link-text">
                ${resetUrl}
            </div>
        </div>
        
        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making digital services accessible to everyone</p>
            <p style="font-size: 12px; margin-top: 15px; color: #9ca3af;">
                📞 +91-7499116527 | 📧 vighnahartaenterprises.sangli@gmail.com
            </p>
            <p style="font-size: 11px; margin-top: 10px; color: #d1d5db;">
                © ${new Date().getFullYear()} Vighnaharta Online Services. All rights reserved.
            </p>
        </div>
        ${getAkrixBrandingFooter()}
    </div>
</body>
</html>`;

    const text = `
Hello ${name},

We received a request to reset your password for your Vighnaharta Online Services account. Click the link below to create a new password:

${resetUrl}

Important Information:
- This link will expire in 1 hour.
- If you didn't request this, please ignore this email.
- Your password won't change until you create a new one.

If you have any questions, please contact us at vighnahartaenterprises.sangli@gmail.com

Best regards,
Vighnaharta Online Services Team
${getAkrixBrandingText()}`;

    return { subject, html, text };
}
