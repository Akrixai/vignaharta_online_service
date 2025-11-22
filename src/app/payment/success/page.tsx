'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Logo from '@/components/ui/logo';
import confetti from 'canvas-confetti';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const isRegistration = orderId?.startsWith('REG-');
  
  // Use a function to calculate initial state
  const [countdown, setCountdown] = useState(() => isRegistration ? 10 : 5);
  const [processing, setProcessing] = useState(isRegistration);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    });

    // If registration, process it immediately
    if (isRegistration && orderId) {
      const processRegistration = async () => {
        try {
          const response = await fetch('/api/admin/process-pending-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId }),
          });

          const result = await response.json();
          
          if (result.success) {
            setProcessing(false);
            // Account created successfully, auto-login and redirect to dashboard
            if (result.credentials) {
              // Auto-login using NextAuth signIn
              const loginResult = await signIn('credentials', {
                email: result.credentials.email,
                password: result.credentials.password,
                role: result.credentials.role,
                redirect: false,
              });

              if (loginResult?.ok) {
                // Login successful, redirect to dashboard
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 2000);
              } else {
                // Login failed, redirect to login page
                setTimeout(() => {
                  router.push('/login?registered=true&error=auto_login_failed');
                }, 3000);
              }
            } else {
              // No credentials, redirect to login
              setTimeout(() => {
                router.push('/login?registered=true');
              }, 3000);
            }
          } else {
            setError(result.error || 'Failed to create account');
            setProcessing(false);
          }
        } catch (err) {
          setError('Failed to process registration');
          setProcessing(false);
        }
      };

      processRegistration();
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect based on payment type
          if (isRegistration) {
            router.push('/login?registered=true');
          } else {
            router.push('/dashboard/wallet');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, isRegistration, orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" showText={true} animated={true} />
          </Link>
        </div>

        {/* Success Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-green-200">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6 animate-bounce">
              <svg
                className="h-16 w-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Success Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isRegistration ? 'Payment Successful!' : 'Payment Successful!'}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {isRegistration 
                ? 'Your registration payment has been processed. Setting up your account...'
                : 'Your wallet has been recharged successfully.'}
            </p>

            {/* Payment Details */}
            {amount && (
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                <p className="text-3xl font-bold text-green-600">₹{amount}</p>
              </div>
            )}

            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-xs text-gray-500 mb-1">Order ID</p>
                <p className="text-sm font-mono text-gray-700">{orderId}</p>
              </div>
            )}

            {/* Next Steps */}
            {isRegistration ? (
              processing ? (
                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Your Account...
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Setting up your retailer account</li>
                    <li>• Creating your wallet</li>
                    <li>• Preparing your dashboard</li>
                    <li>• Almost done...</li>
                  </ul>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
                  <h3 className="font-bold text-red-800 mb-2">❌ Error:</h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <p className="text-sm text-red-600 mt-2">Please contact support with your order ID.</p>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
                  <h3 className="font-bold text-green-800 mb-2">✅ Account Created!</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Your retailer account is ready</li>
                    <li>• You can now login with your credentials</li>
                    <li>• Start providing services and earn commission</li>
                    <li>• Redirecting to login...</li>
                  </ul>
                </div>
              )
            ) : (
              <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-bold text-green-800 mb-2">✅ What's Next:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Your wallet balance has been updated</li>
                  <li>• You can now use the balance for services</li>
                  <li>• Check your transaction history</li>
                </ul>
              </div>
            )}

            {/* Auto Redirect */}
            {!processing && (
              <div className="text-sm text-gray-500 mb-4">
                Redirecting to {isRegistration ? 'login' : 'wallet'} in {countdown} seconds...
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!processing && (
                <Link
                  href={isRegistration ? '/login?registered=true' : '/dashboard/wallet'}
                  className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
                >
                  {isRegistration ? 'Go to Login' : 'Go to Wallet'}
                </Link>
              )}
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
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
