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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-24 h-24 bg-blue-200/20 rounded-full animate-floating animate-delay-1000"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-200/20 rounded-full animate-floating animate-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-pink-200/20 rounded-full animate-floating animate-delay-3000"></div>
        <div className="absolute bottom-10 right-10 w-36 h-36 bg-yellow-200/20 rounded-full animate-floating animate-delay-4000"></div>
      </div>

      {/* Akrix.ai Branding */}
      <div className="absolute top-4 right-4 z-10">
        <a
          href="https://akrixsolutions.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600/80 hover:text-gray-600 text-xs font-medium px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-200 flex items-center space-x-1 backdrop-blur-sm animate-pulse-glow"
        >
          <span className="text-xs animate-bounce-gentle">🚀</span>
          <span>Developed by Akrix.ai</span>
        </a>
      </div>

      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" showText={true} animated={true} />
          </Link>
          <h2 className="text-5xl font-extrabold text-gray-800 mb-4 animate-gradient-shift bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Registration Type
          </h2>
          <p className="text-xl text-gray-600 animate-fade-in animate-delay-100">
            Select how you want to join our platform
          </p>
        </div>

        {/* Registration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Registration */}
          <Link href="/register/customer" className="group animate-fade-in animate-delay-200">
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-200 hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden">
              {/* Decorative gradient border */}
              <div className="absolute inset-0 border-2 border-transparent rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 opacity-20 animate-gradient-shift"></div>
              <div className="text-center relative z-10">
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300 animate-bounce-gentle">👤</div>
                <h3 className="text-3xl font-bold text-blue-800 mb-4 animate-gradient-shift bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Customer</h3>
                <p className="text-gray-600 mb-6 animate-fade-in animate-delay-100">
                  Register to access government services and earn cashback rewards
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-6 text-left animate-fade-in animate-delay-200">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Instant registration (no payment)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Earn 1-3% cashback on services</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Fun scratch card rewards</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Fast service processing</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 px-6 rounded-xl font-bold text-lg group-hover:from-blue-700 group-hover:to-purple-800 transition-all duration-300 transform hover:scale-105 animate-pulse-glow">
                  Register as Customer →
                </div>
              </div>
            </div>
          </Link>

          {/* Retailer Registration */}
          <Link href="/register/retailer" className="group animate-fade-in animate-delay-300">
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-red-200 hover:border-red-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden">
              {/* Decorative gradient border */}
              <div className="absolute inset-0 border-2 border-transparent rounded-2xl bg-gradient-to-r from-red-200 via-orange-200 to-pink-200 opacity-20 animate-gradient-shift"></div>
              <div className="text-center relative z-10">
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300 animate-bounce-gentle">🏪</div>
                <h3 className="text-3xl font-bold text-red-800 mb-4 animate-gradient-shift bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Retailer</h3>
                <p className="text-gray-600 mb-6 animate-fade-in animate-delay-100">
                  Join our network and earn commission by providing government services
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-6 text-left animate-fade-in animate-delay-200">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Earn commission on every service</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Secure Cashfree payment gateway</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Build your own business</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-500 text-xl animate-bounce-gentle">✓</span>
                    <span className="text-sm text-gray-700">Unlimited earning potential</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl font-bold text-lg group-hover:from-red-700 group-hover:to-red-800 transition-all duration-300 transform hover:scale-105 animate-pulse-glow">
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
        <div className="text-center animate-fade-in animate-delay-1000">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-700 transition-colors font-medium transform hover:scale-105">
            <svg className="w-4 h-4 mr-2 animate-bounce-gentle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
