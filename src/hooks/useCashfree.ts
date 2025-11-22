import { useState } from 'react';
import { showToast } from '@/lib/toast';

declare global {
  interface Window {
    Cashfree: any;
  }
}

export function useCashfree() {
  const [loading, setLoading] = useState(false);

  const loadCashfreeSDK = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      console.log('Checking for Cashfree SDK...');
      
      const checkAndInitialize = async (attempts = 0) => {
        if (window.Cashfree) {
          console.log('Cashfree SDK found, initializing...');
          try {
            const mode = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox';
            const cashfree = window.Cashfree({ mode });
            console.log('Cashfree initialized successfully');
            resolve(cashfree);
          } catch (error) {
            console.error('Error initializing Cashfree:', error);
            reject(new Error('Failed to initialize Cashfree SDK'));
          }
        } else if (attempts < 50) {
          setTimeout(() => checkAndInitialize(attempts + 1), 100);
        } else {
          reject(new Error('Cashfree SDK failed to load'));
        }
      };
      
      checkAndInitialize();
    });
  };

  const initiatePayment = async (amount: number, onSuccess?: (data: any) => void, onFailure?: (error: string) => void) => {
    setLoading(true);
    try {
      const orderResponse = await fetch('/api/wallet/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const cashfree = await loadCashfreeSDK();
      const checkoutOptions = {
        paymentSessionId: orderData.data.payment_session_id,
        redirectTarget: '_modal',
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
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
        setLoading(false);
        const errorMessage = error.message || 'Payment failed';
        showToast.error('Payment Error', { description: errorMessage });
        window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
        onFailure?.(errorMessage);
      });
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      showToast.error('Payment Error', { description: errorMessage });
      onFailure?.(errorMessage);
    }
  };

  return { initiatePayment, loading };
}
