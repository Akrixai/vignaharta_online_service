import { useState } from 'react';
import { showToast } from '@/lib/toast';

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

      // Load Cashfree SDK script (using production-ready v3)
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
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

      // Initialize Cashfree with correct environment
      const cashfree = Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT || 'sandbox',
      });

      // Create checkout options - use redirect mode for production stability
      const checkoutOptions = {
        paymentSessionId: orderData.data.payment_session_id,
        redirectTarget: '_self', // Use redirect mode instead of modal for better compatibility
      };
      
      console.log('Initiating Cashfree payment:', {
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT,
        orderId: orderData.data.order_id,
        hasSessionId: !!orderData.data.payment_session_id
      });

      // Open payment (will redirect to Cashfree hosted page)
      cashfree.checkout(checkoutOptions).then((result: any) => {
        console.log('Cashfree checkout result:', result);
        setLoading(false);
        
        if (result.error) {
          console.error('Cashfree payment error:', result.error);
          const errorMessage = result.error.message || 'Payment failed';
          showToast.error('Payment Failed', { description: errorMessage });
          window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
          onFailure?.(errorMessage);
        } else if (result.paymentDetails) {
          console.log('Payment successful:', result.paymentDetails);
          window.location.href = `/payment/success?order_id=${orderData.data.order_id}&amount=${amount}`;
          onSuccess?.(result.paymentDetails);
        } else {
          // Payment page will open, user will be redirected back
          console.log('Redirecting to Cashfree payment page...');
        }
      }).catch((error: any) => {
        console.error('Cashfree checkout error:', error);
        setLoading(false);
        const errorMessage = error.message || 'Payment initialization failed';
        showToast.error('Payment Error', { description: errorMessage });
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
