import { useState } from 'react';
import { showToast } from '@/lib/toast';
import { env } from '@/lib/env';

// Declare Cashfree global type
declare global {
  interface Window {
    Cashfree: any;
  }
}

export function useCashfree() {
  const [loading, setLoading] = useState(false);

  const loadCashfreeSDK = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Cashfree) {
        resolve(window.Cashfree);
        return;
      }

      // Load Cashfree SDK script
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => {
        if (window.Cashfree) {
          resolve(window.Cashfree);
        } else {
          reject(new Error('Cashfree SDK failed to load'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load Cashfree SDK'));
      };
      document.head.appendChild(script);
    });
  };

  const initiatePayment = async (
    amount: number,
    onSuccess?: (data: any) => void,
    onFailure?: (error: string) => void
  ) => {
    setLoading(true);

    try {
      // Create order on backend
      const orderResponse = await fetch('/api/wallet/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Load Cashfree SDK
      const Cashfree = await loadCashfreeSDK();

      // Initialize Cashfree with seamless integration
      // Determine mode based on environment variable, defaulting to sandbox for safety
      const cashfreeMode = env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
        ? 'production' 
        : 'sandbox';
      
      const cashfree = Cashfree({
        mode: cashfreeMode,
      });

      // Create checkout options for seamless modal (in-app payment - no redirect)
      const checkoutOptions = {
        paymentSessionId: orderData.data.payment_session_id,
        redirectTarget: '_modal', // Force modal mode, no redirect
      };

      // Open payment modal (seamless integration)
      cashfree.checkout(checkoutOptions).then((result: any) => {
        setLoading(false);
        
        if (result.error) {
          // Payment failed - redirect to failure page
          const errorMessage = result.error.message || 'Payment failed';
          window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
          onFailure?.(errorMessage);
        } else if (result.paymentDetails) {
          // Payment successful - redirect to success page
          window.location.href = `/payment/success?order_id=${orderData.data.order_id}&amount=${amount}`;
          onSuccess?.(result.paymentDetails);
        } else if (result.redirect) {
          // Payment is being processed
          showToast.info('Processing Payment', {
            description: 'Please wait while we process your payment.'
          });
        }
      }).catch((error: any) => {
        setLoading(false);
        const errorMessage = error.message || 'Payment failed';
        window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
        onFailure?.(errorMessage);
      });
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      showToast.error('Payment Error', {
        description: errorMessage
      });
      onFailure?.(errorMessage);
    }
  };

  return {
    initiatePayment,
    loading,
  };
}
