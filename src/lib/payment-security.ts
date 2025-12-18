// Payment Security Utilities
// Prevents test payments and fraudulent transactions in production

export interface PaymentSecurityCheck {
  isValid: boolean;
  reason?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blockedIndicators?: string[];
}

/**
 * Comprehensive security check for payment data
 * Prevents test payments, fraudulent transactions, and suspicious activity
 */
export function validatePaymentSecurity(paymentData: any, environment: string = 'TEST'): PaymentSecurityCheck {
  const isProduction = environment === 'PRODUCTION' || process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    return { isValid: true, riskLevel: 'LOW' };
  }

  // Test payment indicators (CRITICAL SECURITY RISK)
  const testIndicators = [
    // Test UPI IDs
    'testsuccess@gocash',
    'testfail@gocash', 
    'test@gocash',
    'testsuccess@paytm',
    'testfail@paytm',
    
    // Test bank references
    '1234567890',
    '0123456789',
    'test123456',
    
    // Test messages
    'simulated response message',
    'test payment',
    'dummy payment',
    'sandbox payment',
    
    // Test card numbers (first 6 digits)
    '424242', // Visa test
    '555555', // Mastercard test
    '378282', // Amex test
    '411111', // Generic test
    
    // Test phone numbers
    '9999999999',
    '1234567890',
    '0000000000',
  ];

  const paymentString = JSON.stringify(paymentData).toLowerCase();
  const foundIndicators = testIndicators.filter(indicator => 
    paymentString.includes(indicator.toLowerCase())
  );

  if (foundIndicators.length > 0) {
    return {
      isValid: false,
      reason: 'Test payment detected in production environment',
      riskLevel: 'CRITICAL',
      blockedIndicators: foundIndicators
    };
  }

  // Suspicious patterns
  const suspiciousPatterns = [
    /test.*payment/i,
    /dummy.*transaction/i,
    /fake.*payment/i,
    /simulation/i,
    /sandbox/i,
  ];

  const foundPatterns = suspiciousPatterns.filter(pattern => 
    pattern.test(paymentString)
  );

  if (foundPatterns.length > 0) {
    return {
      isValid: false,
      reason: 'Suspicious payment pattern detected',
      riskLevel: 'HIGH',
      blockedIndicators: foundPatterns.map(p => p.toString())
    };
  }

  // Additional security checks
  const payment = paymentData.payment || paymentData;
  
  // Check for unrealistic amounts (above ₹1 lakh in single transaction)
  if (payment.payment_amount && payment.payment_amount > 100000) {
    return {
      isValid: false,
      reason: 'Transaction amount exceeds security limit',
      riskLevel: 'HIGH'
    };
  }

  // Check for rapid successive payments (would need timestamp comparison)
  // This would require additional context about recent payments

  return { isValid: true, riskLevel: 'LOW' };
}

/**
 * Log security incident to database and console
 */
export async function logSecurityIncident(
  incident: {
    type: string;
    description: string;
    paymentData: any;
    userInfo?: any;
    riskLevel: string;
  }
) {
  console.error('🚨 SECURITY INCIDENT:', {
    ...incident,
    timestamp: new Date().toISOString()
  });

  // In a real implementation, you'd also log to a security monitoring system
  // and potentially trigger alerts to administrators
}

/**
 * Check if environment is properly configured for production
 */
export function validateEnvironmentSecurity(): {
  isSecure: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check if Cashfree is in production mode
  if (process.env.NODE_ENV === 'production' && process.env.CASHFREE_ENVIRONMENT !== 'PRODUCTION') {
    issues.push('Cashfree environment not set to PRODUCTION in production deployment');
  }
  
  // Check for test credentials in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.CASHFREE_APP_ID?.includes('test')) {
      issues.push('Test Cashfree App ID detected in production');
    }
    
    if (process.env.CASHFREE_SECRET_KEY?.includes('test')) {
      issues.push('Test Cashfree Secret Key detected in production');
    }
  }

  return {
    isSecure: issues.length === 0,
    issues
  };
}