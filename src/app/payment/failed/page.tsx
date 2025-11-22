'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/logo';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const isRegistration = orderId?.startsWith('REG-');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect based on payment type
          if (isRegistration) {
            router.push('/register/retailer');
          } else {
            router.push('/dashboard/wallet');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, isRegistration]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" showText={true} animated={true} />
          </Link>
        </div>

        {/* Failed Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-red-200">
          <div className="text-center">
            {/* Failed Icon */}
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
              <svg
                className="h-16 w-16 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            {/* Failed Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Your payment could not be processed. Please try again.
            </p>

            {/* Payment Details */}
            {amount && (
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-3xl font-bold text-red-600">₹{amount}</p>
              </div>
            )}

            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                <p className="text-sm font-mono text-gray-700">{orderId}</p>
              </div>
            )}

            {/* Reasons */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-bold text-yellow-800 mb-2">⚠️ Common Reasons:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Insufficient balance in account</li>
                <li>• Payment cancelled by user</li>
                <li>• Network connectivity issues</li>
                <li>• Bank server timeout</li>
                <li>• Incorrect payment details</li>
              </ul>
            </div>

            {/* Auto Redirect */}
            <div className="text-sm text-gray-500 mb-4">
              Redirecting in {countdown} seconds...
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href={isRegistration ? '/register/retailer' : '/dashboard/wallet'}
                className="block w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
              >
                {isRegistration ? 'Try Registration Again' : 'Try Again'}
              </Link>
              <Link
                href="/"
                className="block w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="text-center text-sm text-gray-600">
          Need help?{' '}
          <a
            href="mailto:vighnahartaenterprises.sangli@gmail.com"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
