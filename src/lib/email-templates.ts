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
                      ? '• You can now offer this service to your customers<br>• Start earning commission from day one<br>• Help more people access government services'
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
            <p>Making government services accessible to everyone</p>
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
  ? '- You can now offer this service to your customers\n- Start earning commission from day one\n- Help more people access government services'
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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .credentials-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .cta-button { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; }
        .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e; }
        .warning { background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; color: #dc2626; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏛️ विघ्नहर्ता ऑनलाईन सर्विसेस</div>
            <h1>Welcome to Our Network!</h1>
            <p>Your retailer account is now active</p>
        </div>
        
        <div class="content">
            <h2>Welcome ${name}! 🎉</h2>
            
            <p>Welcome to <span class="highlight">विघ्नहर्ता ऑनलाईन सर्विसेस</span>! You are now part of the <span class="highlight">विघ्नहर्ता ऑनलाईन सर्विसेस</span> network, helping citizens access government services easily.</p>
            
            <div class="credentials-box">
                <h3 style="color: #059669; margin-top: 0;">🔐 Your Login Credentials</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong><br>
                    Please change your password after your first login for security purposes.
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="http://localhost:3000/login?role=retailer" class="cta-button">
                    🚀 Login to Dashboard
                </a>
            </div>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-top: 0;">🎯 What You Can Do:</h3>
                <ul style="color: #1e40af; margin: 0;">
                    <li><strong>Offer Government Services:</strong> Help customers with various government applications</li>
                    <li><strong>Earn Commission:</strong> Get paid for every successful service completion</li>
                    <li><strong>Manage Wallet:</strong> Track your earnings and manage payments</li>
                    <li><strong>Real-time Support:</strong> Get help from our employee team when needed</li>
                </ul>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e;">
                <h3 style="color: #15803d; margin-top: 0;">📋 Next Steps:</h3>
                <ol style="color: #15803d; margin: 0;">
                    <li>Login to your dashboard using the credentials above</li>
                    <li>Complete your profile setup</li>
                    <li>Browse available services</li>
                    <li>Start helping customers and earning money!</li>
                </ol>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making government services accessible to everyone</p>
            <p style="font-size: 12px; margin-top: 20px;">
                Need help? Contact our support team or use the chat feature in your dashboard.
            </p>
        </div>
        ${getAkrixBrandingFooter()}
    </div>
</body>
</html>`;

  const text = `
Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस!

Hello ${name}!

Congratulations! Your retailer account has been successfully created.

Your Login Credentials:
Email: ${email}
Password: ${password}

IMPORTANT: Please change your password after your first login for security.

Login here: http://localhost:3000/login?role=retailer

What You Can Do:
- Offer Government Services: Help customers with various government applications
- Earn Commission: Get paid for every successful service completion
- Manage Wallet: Track your earnings and manage payments
- Real-time Support: Get help from our employee team when needed

Next Steps:
1. Login to your dashboard using the credentials above
2. Complete your profile setup
3. Browse available services
4. Start helping customers and earning money!

Best regards,
विघ्नहर्ता ऑनलाईन सर्विसेस Team
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
                <a href="http://localhost:3000/login?role=employee" class="cta-button">
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
            <p>Making government services accessible to everyone</p>
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

Login here: http://localhost:3000/login?role=employee

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
                    <li><strong>Access to Government Services:</strong> Help customers with various applications</li>
                    <li><strong>Commission Earnings:</strong> Earn money for every successful service</li>
                    <li><strong>Digital Wallet:</strong> Manage your earnings and payments</li>
                    <li><strong>24/7 Support:</strong> Get help whenever you need it</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making government services accessible to everyone</p>
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
- Access to Government Services: Help customers with various applications
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
                <a href="http://localhost:3000/register" class="cta-button">
                    🔄 Submit New Application
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>विघ्नहर्ता ऑनलाईन सर्विसेस</strong></p>
            <p>Making government services accessible to everyone</p>
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

Submit a new application: http://localhost:3000/register

Need help? Contact us at vighnahartaenterprises.sangli@gmail.com

Best regards,
विघ्नहर्ता ऑनलाईन सर्विसेस Team
${getAkrixBrandingText()}`;

  return { subject, html, text };
}
