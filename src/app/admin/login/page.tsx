'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserRole } from '@/types';
import Logo from '@/components/ui/logo';
import { showToast } from '@/lib/toast';
import { useRecaptchaEnterprise } from '@/hooks/useRecaptchaEnterprise';

export default function AdminLoginPage() {
  const { executeRecaptcha, isReady } = useRecaptchaEnterprise();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let recaptchaToken = '';
      
      if (isReady) {
        try {
          recaptchaToken = await executeRecaptcha('ADMIN_LOGIN');
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
        }
      }

      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        role: UserRole.ADMIN,
        recaptchaToken,
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        showToast.error('Admin login failed', {
          description: 'Invalid credentials or insufficient permissions.'
        });
        setIsLoading(false);
      } else if (result?.ok) {
        showToast.success('Admin login successful!', {
          description: 'Redirecting to admin dashboard...'
        });
        // Use router.push for proper Next.js navigation
        const { useRouter } = await import('next/navigation');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast.error('Login error', {
        description: 'An unexpected error occurred.'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Security Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="font-bold text-sm">Secure Admin Access</span>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size="md" showText={true} animated={true} />
          </Link>
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-xl shadow-2xl">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <span className="text-4xl">🔐</span>
              <h1 className="text-3xl font-extrabold text-white">
                Admin Portal
              </h1>
            </div>
            <p className="text-red-100 text-sm">
              Authorized personnel only
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 border-4 border-red-600">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2">
                Admin Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-4 px-6 border-2 border-transparent text-lg font-bold rounded-xl text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>🔐 Secure Login</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to User Login
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            This is a secure area. All access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
