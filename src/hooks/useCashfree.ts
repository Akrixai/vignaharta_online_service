import { useState } from 'react';
import { showToast } from '@/lib/toast';

export function useCashfree() {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async (
    amount: number,
    onSuccess?: (data: any) => void,
    onFailure?: (error: string) => void
  ) => {
    console.log('=== 💳 Cashfree Payment Started ===');
    console.log('Amount:', amount);
    console.log('Environment:', process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT);
    
    setLoading(true);

    try {
      // Step 1: Create order on backend
      console.log('📝 Creating payment order...');
      const orderResponse = await fetch('/api/wallet/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderResponse.json();
      console.log('✅ Order created:', orderData);

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Step 2: Redirect to Cashfree hosted checkout page
      // This avoids CORS issues and SDK loading problems
      const paymentSessionId = orderData.data.payment_session_id;
      const environment = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'payments' : 'sandbox';
      const cashfreeUrl = `https://${environment}.cashfree.com/pay/${paymentSessionId}`;
      
      console.log('🚀 Redirecting to Cashfree:', cashfreeUrl);
      
      // Show loading message
      showToast.info('Redirecting to Payment Gateway', {
        description: 'Please wait while we redirect you to secure payment page...'
      });
      
      // Small delay to show the toast
      setTimeout(() => {
        window.location.href = cashfreeUrl;
      }, 500);
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      showToast.error('Payment Error', {
        description: errorMessage
      });
      onFailure?.(errorMessage);
    }
  };

  return { initiatePayment, loading };
}
