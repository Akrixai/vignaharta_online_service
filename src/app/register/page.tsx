'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/logo';

function RegisterSelection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationType = searchParams.get('type');

  // Redirect to specific registration pages
  useEffect(() => {
    if (registrationType === 'customer') {
      router.push('/register/customer');
    } else if (registrationType === 'retailer') {
      router.push('/register/retailer');
    }
    // If no type specified, show selection page
  }, [registrationType, router]);

  // If no type specified, show selection page

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Akrix.ai Branding */}
      <div className="absolute top-4 right-4 z-10">
        <a
          href="https://akrixsolutions.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600/80 hover:text-gray-600 text-xs font-medium px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-200 flex items-center space-x-1 backdrop-blur-sm"
        >
          <span className="text-xs">🚀</span>
          <span>Developed by Akrix.ai</span>
        </a>
      </div>

      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" showText={true} animated={true} />
          </Link>
          <h2 className="text-5xl font-extrabold text-gray-800 mb-4">
            Choose Registration Type
          </h2>
          <p className="text-xl text-gray-600">
            Select how you want to join our platform
          </p>
        </div>

        {/* Registration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Registration */}
          <Link href="/register/customer" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-200 hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              <div className="text-center">
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300">👤</div>
                <h3 className="text-3xl font-bold text-blue-800 mb-4">Customer</h3>
                <p className="text-gray-600 mb-6">
                  Register to access government services and earn cashback rewards
                </p>
                
                {/* Benefits */}
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Instant registration (no payment)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Earn 1-3% cashback on services</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Fun scratch card rewards</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Fast service processing</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 px-6 rounded-xl font-bold text-lg group-hover:from-blue-700 group-hover:to-purple-800 transition-all duration-300">
                  Register as Customer →
                </div>
              </div>
            </div>
          </Link>

          {/* Retailer Registration */}
          <Link href="/register/retailer" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-red-200 hover:border-red-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
              <div className="text-center">
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300">🏪</div>
                <h3 className="text-3xl font-bold text-red-800 mb-4">Retailer</h3>
                <p className="text-gray-600 mb-6">
                  Join our network and earn commission by providing government services
                </p>
                
                {/* Benefits */}
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Earn commission on every service</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Secure Cashfree payment gateway</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Build your own business</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-sm text-gray-700">Unlimited earning potential</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl font-bold text-lg group-hover:from-red-700 group-hover:to-red-800 transition-all duration-300">
                  Register as Retailer →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Already have account */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Sign in here
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-700 transition-colors font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterSelection />
    </Suspense>
  );
}
