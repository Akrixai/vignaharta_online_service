'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types';
import Logo from '@/components/ui/logo';
import SafeLoginAdvertisements from '@/components/SafeLoginAdvertisements';
import { showToast } from '@/lib/toast';
import { useRecaptchaEnterprise } from '@/hooks/useRecaptchaEnterprise';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole;
  const { executeRecaptcha, isReady } = useRecaptchaEnterprise();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: roleParam || UserRole.RETAILER
  });

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const [isLoading, setIsLoading] = useState(false);

  // Clear email field when switching login methods
  const handleLoginMethodChange = (method: 'email' | 'phone') => {
    setLoginMethod(method);
    setFormData({ ...formData, email: '' }); // Clear the input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let recaptchaToken = '';
      
      // Execute reCAPTCHA Enterprise
      if (isReady) {
        try {
          recaptchaToken = await executeRecaptcha('LOGIN');
        } catch (error) {
          console.warn('reCAPTCHA execution failed, proceeding without token:', error);
        }
      } else {
        console.warn('reCAPTCHA not ready, proceeding without token');
      }

      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        recaptchaToken,
        redirect: false,
      });

      if (result?.error) {
        let errorMessage = 'Login failed';

        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid email, password, or role. Please check your credentials and try again.';
        } else {
          errorMessage = `Login failed: ${result.error}`;
        }

        let description = '';
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Invalid credentials';
          description = 'Please check your email, password, and role selection.';
        } else {
          errorMessage = 'Login failed';
          description = result.error;
        }
        showToast.error(errorMessage, { description });
      } else if (result?.ok) {
        showToast.success('Login successful!', {
          description: 'Redirecting to your dashboard...'
        });
        // Small delay to ensure session is set
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        showToast.error('Login failed', {
          description: 'Unexpected response from server. Please try again.'
        });
      }
    } catch (error) {
      showToast.error('Login error', {
        description: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'text-red-600 border-red-500';
      case UserRole.EMPLOYEE: return 'text-red-500 border-red-400';
      case UserRole.RETAILER: return 'text-red-700 border-red-600';
      default: return 'text-gray-600 border-gray-500';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return '⚙️';
      case UserRole.EMPLOYEE: return '👨‍💼';
      case UserRole.RETAILER: return '🏪';
      default: return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Akrix Solutions Branding - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10">
        <a
          href="https://akrixsolutions.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold text-xs px-3 py-2 rounded-lg hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-1 backdrop-blur-sm"
        >
          <span className="text-xs">🚀</span>
          <span>Developed by Akrix Solutions</span>
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-6rem)]">

          {/* Advertisement Section - Left Side */}
          <div className="hidden lg:block">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-red-800 mb-4">
                  Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस
                </h2>
                <p className="text-lg text-red-600 mb-8">
                  Your gateway to seamless government services
                </p>
              </div>
              <SafeLoginAdvertisements className="h-[500px]" />
            </div>
          </div>

          {/* Login Section - Right Side */}
          <div className="w-full max-w-md mx-auto space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-block mb-4 lg:mb-6">
            <Logo size="md" showText={true} animated={true} />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-red-800 mb-4">
            Sign in to your account
          </h2>
          <div className={`flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-xl shadow-lg bg-white ${getRoleColor(formData.role)}`}>
            <span className="text-2xl sm:text-3xl">{getRoleIcon(formData.role)}</span>
            <span className="font-bold text-base sm:text-lg capitalize">{formData.role.toLowerCase()} Login</span>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 rounded-xl shadow-lg text-white animate-scale-in">
          <div className="text-center">
            <h3 className="font-bold text-base sm:text-lg mb-2">🔐 Secure Login Portal</h3>
            <p className="text-red-100 text-xs sm:text-sm">
              Access your dashboard and manage government services securely
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-xl border border-red-200 animate-slide-in-left" onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-6">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-red-700 mb-2">
                Login as
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors text-sm sm:text-base"
              >
                <option value={UserRole.CUSTOMER}>👤 Customer</option>
                <option value={UserRole.RETAILER}>🏪 Retailer</option>
                <option value={UserRole.EMPLOYEE}>👨‍💼 Employee</option>
              </select>
            </div>

            {/* Login Method Toggle */}
            <div className="flex justify-center space-x-2 mb-4">
              <button
                type="button"
                onClick={() => handleLoginMethodChange('email')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  loginMethod === 'email'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => handleLoginMethodChange('phone')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📱 Phone
              </button>
            </div>

            {/* Email or Phone */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-red-700 mb-2">
                {loginMethod === 'email' ? '📧 Email address' : '📱 Phone number'}
              </label>
              <input
                id="email"
                name="email"
                type={loginMethod === 'email' ? 'email' : 'tel'}
                autoComplete={loginMethod === 'email' ? 'email' : 'tel'}
                required
                placeholder={loginMethod === 'email' ? 'Enter your email address' : 'Enter your 10-digit phone number'}
                maxLength={loginMethod === 'phone' ? 10 : undefined}
                pattern={loginMethod === 'phone' ? '[0-9]{10}' : undefined}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors text-sm sm:text-base"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-red-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors text-sm sm:text-base"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent text-base sm:text-lg font-bold rounded-xl text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 shadow-lg hover:shadow-xl animate-glow'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>🔐 Sign in</>
              )}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center pt-2">
            <Link href="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-medium">
              Forgot your password?
            </Link>
          </div>

          {/* reCAPTCHA Notice */}
          <div className="text-center text-xs text-gray-500 pt-2">
            Protected by reCAPTCHA. Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            {' '}&{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
            {' '}apply.
          </div>

          {/* Links */}
          {formData.role && (formData.role.toUpperCase() === 'RETAILER' || formData.role.toUpperCase() === 'CUSTOMER') && (
            <div className="flex justify-center pt-4">
              <div className="text-xs sm:text-sm space-x-4">
                {formData.role.toUpperCase() === 'RETAILER' && (
                  <Link href="/register?type=retailer" className="font-medium text-red-600 hover:text-red-700 transition-colors">
                    Register as Retailer
                  </Link>
                )}
                {formData.role.toUpperCase() === 'CUSTOMER' && (
                  <Link href="/register?type=customer" className="font-medium text-red-600 hover:text-red-700 transition-colors">
                    Register as Customer
                  </Link>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Register Buttons */}
        {formData.role && (formData.role.toUpperCase() === 'RETAILER' || formData.role.toUpperCase() === 'CUSTOMER') && (
          <div className="mt-6 flex flex-col items-center animate-fade-in space-y-3">
            {formData.role.toUpperCase() === 'RETAILER' && (
              <Link
                href="/register?type=retailer"
                className="w-full max-w-xs bg-gradient-to-r from-yellow-400 via-pink-500 to-red-600 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl hover:from-pink-500 hover:to-yellow-400 transition-all duration-300 flex items-center justify-center space-x-3 border-2 border-white/30 animate-pulse"
                style={{textShadow: '0 0 8px #fff, 0 0 16px #f472b6'}}
              >
                <span className="text-2xl animate-bounce">📝</span>
                <span className="drop-shadow-lg">Register as Retailer</span>
              </Link>
            )}
            {formData.role.toUpperCase() === 'CUSTOMER' && (
              <Link
                href="/register?type=customer"
                className="w-full max-w-xs bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl hover:from-purple-500 hover:to-blue-400 transition-all duration-300 flex items-center justify-center space-x-3 border-2 border-white/30 animate-pulse"
                style={{textShadow: '0 0 8px #fff, 0 0 16px #a78bfa'}}
              >
                <span className="text-2xl animate-bounce">👤</span>
                <span className="drop-shadow-lg">Register as Customer</span>
              </Link>
            )}
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center animate-fade-in space-y-2">
          <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 transition-colors font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div>
            <Link href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Admin Access
            </Link>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
