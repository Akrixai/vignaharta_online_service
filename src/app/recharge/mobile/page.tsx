'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PublicMobileRechargePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if user is logged in
    if (status === 'authenticated') {
      router.push('/dashboard/recharge/mobile');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📱 Mobile Recharge
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Quick and secure mobile recharge for all operators
          </p>
        </div>

        {/* Login Required Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Login Required
          </h2>
          <p className="text-gray-600 mb-8">
            Please login to access mobile recharge services with instant processing and real-time status updates.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login to Continue
            </button>
            
            <div className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Register here
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Instant Recharge</h3>
            <p className="text-gray-600 text-sm">
              Real-time processing with immediate confirmation
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl mb-4">🎁</div>
            <h3 className="text-lg font-semibold mb-2">Special R-Offers</h3>
            <p className="text-gray-600 text-sm">
              Exclusive offers for Airtel and VI customers
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 text-center shadow-lg">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">Earn Rewards</h3>
            <p className="text-gray-600 text-sm">
              Get cashback and commissions on every recharge
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}