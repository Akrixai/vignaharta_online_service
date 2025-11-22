'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/logo';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" showText={true} animated={true} />
          </Link>
        </div>

        {/* Failure Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-red-200">
          <div className="text-center">
            {/* Failure Icon */}
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

            {/* Failure Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Unfortunately, your payment could not be processed.
            </p>

            {/* Failure Reason */}
            {reason && (
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Reason</p>
                <p className="text-sm font-medium text-red-700">{decodeURIComponent(reason)}</p>
              </div>
            )}

            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                <p className="text-sm font-mono text-gray-700">{orderId}</p>
              </div>
            )}

            {/* Common Reasons */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-bold text-yellow-800 mb-2">💡 Common Reasons:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Insufficient balance in account</li>
                <li>• Incorrect payment details</li>
                <li>• Payment timeout</li>
                <li>• Bank server issues</li>
                <li>• Transaction cancelled by user</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="block w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg"
              >
                Try Again
              </button>
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

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
