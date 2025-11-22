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
        console.log('Cashfree SDK already loaded');
        resolve(window.Cashfree);
        return;
      }

      console.log('Loading Cashfree SDK from CDN...');
      
      // Load Cashfree SDK script
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('Cashfree SDK script loaded successfully');
        // Wait a bit for SDK to initialize on window object
        setTimeout(() => {
          if (window.Cashfree) {
            console.log('Cashfree SDK initialized and ready');
            resolve(window.Cashfree);
          } else {
            console.error('Cashfree SDK script loaded but not available on window object');
            reject(new Error('Cashfree SDK failed to initialize'));
          }
        }, 200);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Cashfree SDK script:', error);
        reject(new Error('Failed to load Cashfree SDK - Network error'));
      };
      
      document.head.appendChild(script);
      console.log('Cashfree SDK script tag added to document');
    });
  };

  const initiatePayment = async (
    amount: number,
    onSuccess?: (data: any) => void,
    onFailure?: (error: string) => void
  ) => {
    console.log('=== Cashfree Payment Initiation Started ===');
    console.log('Amount:', amount);
    console.log('Environment:', process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT);
    
    setLoading(true);

    try {
      // Step 1: Create order on backend
      console.log('Step 1: Creating payment order...');
      const orderResponse = await fetch('/api/wallet/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderResponse.json();
      console.log('Order creation response:', {
        success: orderData.success,
        hasSessionId: !!orderData.data?.payment_session_id,
        orderId: orderData.data?.order_id
      });

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Step 2: Load Cashfree SDK
      console.log('Step 2: Loading Cashfree SDK...');
      const Cashfree = await loadCashfreeSDK();
      console.log('Cashfree SDK loaded successfully');

      // Step 3: Initialize Cashfree
      console.log('Step 3: Initializing Cashfree checkout...');
      const mode = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox';
      console.log('Cashfree mode:', mode);
      
      const cashfree = Cashfree({
        mode: mode,
      });

      // Step 4: Create checkout options
      const checkoutOptions = {
        paymentSessionId: orderData.data.payment_session_id,
        redirectTarget: '_self', // Redirect to Cashfree hosted page
      };
      
      console.log('Step 4: Opening Cashfree checkout with options:', {
        hasSessionId: !!checkoutOptions.paymentSessionId,
        redirectTarget: checkoutOptions.redirectTarget
      });

      // Step 5: Open payment
      cashfree.checkout(checkoutOptions).then((result: any) => {
        console.log('Cashfree checkout completed with result:', result);
        setLoading(false);
        
        if (result.error) {
          console.error('Payment error from Cashfree:', result.error);
          const errorMessage = result.error.message || 'Payment failed';
          showToast.error('Payment Failed', { description: errorMessage });
          window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
          onFailure?.(errorMessage);
        } else if (result.paymentDetails) {
          console.log('Payment successful, redirecting to success page');
          window.location.href = `/payment/success?order_id=${orderData.data.order_id}&amount=${amount}`;
          onSuccess?.(result.paymentDetails);
        } else {
          console.log('Payment page opened, user will be redirected');
          // User will be redirected to Cashfree payment page
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
      console.error('=== Payment Initiation Error ===');
      console.error('Error details:', error);
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
