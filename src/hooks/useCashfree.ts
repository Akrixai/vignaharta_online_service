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
      // SDK should already be loaded from layout.tsx
      const checkSDK = (attempts = 0) => {
        if (window.Cashfree) {
          console.log('✅ Cashfree SDK ready');
          resolve(window.Cashfree);
        } else if (attempts < 50) {
          // Retry up to 50 times (5 seconds total)
          console.log(`⏳ Waiting for Cashfree SDK... (attempt ${attempts + 1}/50)`);
          setTimeout(() => checkSDK(attempts + 1), 100);
        } else {
          console.error('❌ Cashfree SDK not available after 5 seconds');
          reject(new Error('Cashfree SDK failed to load. Please refresh the page.'));
        }
      };
      
      checkSDK();
    });
  };

  const initiatePayment = async (
    amount: number,
    onSuccess?: (data: any) => void,
    onFailure?: (error: string) => void
  ) => {
    console.log('=== 💳 Cashfree Payment Initiation Started ===');
    console.log('Amount:', amount);
    console.log('Environment:', process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT);
    
    setLoading(true);

    try {
      // Step 1: Create order on backend
      console.log('📝 Step 1: Creating payment order...');
      const orderResponse = await fetch('/api/wallet/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderResponse.json();
      console.log('✅ Order created:', {
        success: orderData.success,
        orderId: orderData.data?.order_id,
        hasSessionId: !!orderData.data?.payment_session_id
      });

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Step 2: Load Cashfree SDK
      console.log('📦 Step 2: Loading Cashfree SDK...');
      const Cashfree = await loadCashfreeSDK();
      console.log('✅ Cashfree SDK loaded successfully');

      // Step 3: Initialize Cashfree
      console.log('🔧 Step 3: Initializing Cashfree checkout...');
      const mode = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox';
      console.log('Mode:', mode);
      
      const cashfree = Cashfree({
        mode: mode,
      });

      // Step 4: Create checkout options for modal
      const checkoutOptions = {
        paymentSessionId: orderData.data.payment_session_id,
        redirectTarget: '_modal', // Open in modal
      };
      
      console.log('🚀 Step 4: Opening Cashfree payment modal...');

      // Step 5: Open payment modal
      cashfree.checkout(checkoutOptions).then((result: any) => {
        console.log('✅ Cashfree checkout completed:', result);
        setLoading(false);
        
        if (result.error) {
          console.error('❌ Payment error:', result.error);
          const errorMessage = result.error.message || 'Payment failed';
          showToast.error('Payment Failed', { description: errorMessage });
          window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
          onFailure?.(errorMessage);
        } else if (result.paymentDetails) {
          console.log('✅ Payment successful');
          showToast.success('Payment Successful!');
          window.location.href = `/payment/success?order_id=${orderData.data.order_id}&amount=${amount}`;
          onSuccess?.(result.paymentDetails);
        } else {
          console.log('ℹ️ Payment in progress or user closed modal');
        }
      }).catch((error: any) => {
        console.error('❌ Cashfree checkout error:', error);
        setLoading(false);
        const errorMessage = error.message || 'Payment failed';
        showToast.error('Payment Error', { description: errorMessage });
        window.location.href = `/payment/failed?order_id=${orderData.data.order_id}&amount=${amount}`;
        onFailure?.(errorMessage);
      });
    } catch (error) {
      console.error('=== ❌ Payment Initiation Error ===');
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
