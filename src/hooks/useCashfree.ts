import { useState } from 'react';
import { showToast } from '@/lib/toast';

// Declare Cashfree global - loaded from script tag in layout
declare const Cashfree: any;

export function useCashfree() {
  const [loading, setLoading] = useState(false);

  const loadCashfreeSDK = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      console.log('🔍 Checking for Cashfree SDK...');
      
      const checkAndInitialize = (attempts = 0) => {
        // Check if Cashfree is available globally
        if (typeof Cashfree !== 'undefined') {
          console.log('✅ Cashfree SDK found');
          try {
            const mode = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox';
            console.log('🔧 Initializing Cashfree in', mode, 'mode');
            
            const cashfree = Cashfree({
              mode: mode
            });
            
            console.log('✅ Cashfree initialized successfully');
            resolve(cashfree);
          } catch (error) {
            console.error('❌ Error initializing Cashfree:', error);
            reject(new Error('Failed to initialize Cashfree SDK'));
          }
        } else if (attempts < 100) {
          // Retry - SDK might still be loading (increased to 100 attempts = 10 seconds)
          if (attempts % 10 === 0) {
            console.log(`⏳ Waiting for Cashfree SDK... (attempt ${attempts + 1}/100)`);
          }
          setTimeout(() => checkAndInitialize(attempts + 1), 100);
        } else {
          console.error('❌ Cashfree SDK not available after 10 seconds');
          reject(new Error('Cashfree SDK failed to load. Please refresh the page.'));
        }
      };
      
      checkAndInitialize();
    });
  };

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
      // Step 1: Create order
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

      // Step 2: Initialize Cashfree SDK
      console.log('📦 Loading Cashfree SDK...');
      const cashfree = await loadCashfreeSDK();

      // Step 3: Open checkout modal
      console.log('🚀 Opening Cashfree checkout modal...');
      const checkoutOptions = {
        paymentSessionId: orderData.data.payment_session_id,
        redirectTarget: '_modal', // Open in modal
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
        console.log('✅ Checkout result:', result);
        setLoading(false);
        
        if (result.error) {
          const errorMessage = result.error.message || 'Payment failed';
          showToast.error('Payment Failed', { description: errorMessage });
          window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
          onFailure?.(errorMessage);
        } else if (result.paymentDetails) {
          showToast.success('Payment Successful!');
          window.location.href = `/payment/success?order_id=${orderData.data.order_id}&amount=${amount}`;
          onSuccess?.(result.paymentDetails);
        }
      }).catch((error: any) => {
        console.error('❌ Checkout error:', error);
        setLoading(false);
        const errorMessage = error.message || 'Payment failed';
        showToast.error('Payment Error', { description: errorMessage });
        window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
        onFailure?.(errorMessage);
      });
    } catch (error) {
      console.error('❌ Payment error:', error);
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      showToast.error('Payment Error', { description: errorMessage });
      onFailure?.(errorMessage);
    }
  };

  return { initiatePayment, loading };
}
