// Test script to verify email functionality
const { sendWelcomeRetailerEmail } = require('./src/lib/email-service');

async function testEmail() {
  console.log('Testing welcome retailer email...');
  
  const testData = {
    name: 'Test Retailer',
    email: 'shindeaniket47328@gmail.com', // Replace with your test email
    password: 'TestPassword123'
  };
  
  try {
    const result = await sendWelcomeRetailerEmail(
      testData.name,
      testData.email,
      testData.password
    );
    
    if (result) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email sending failed');
    }
  } catch (error) {
    console.error('Error testing email:', error);
  }
}

// Run the test
testEmail();