'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validateEmail, validatePhone } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import { showToast } from '@/lib/toast';
import { useRecaptchaEnterprise } from '@/hooks/useRecaptchaEnterprise';
import { useCashfree } from '@/hooks/useCashfree';

export default function RetailerRegisterPage() {
  const router = useRouter();
  const { executeRecaptcha, isReady } = useRecaptchaEnterprise();
  const { initiatePayment, loading: paymentLoading } = useCashfree();

  const [step, setStep] = useState(1); // 1 = Details, 2 = Payment
  const [pendingRegistrationId, setPendingRegistrationId] = useState('');
  const [registrationFee, setRegistrationFee] = useState<number>(1499);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch registration fee
    fetch('/api/admin/registration-fees')
      .then(res => res.json())
      .then(data => {
        if (data.fee) setRegistrationFee(parseFloat(data.fee.amount));
      });
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Shop/Business address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit PIN code';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Just move to step 2, don't save to database yet
    setStep(2);
    showToast.success('Details Validated!', {
      description: 'Please proceed with payment to complete registration.'
    });
  };

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      let recaptchaToken = '';
      
      if (isReady) {
        try {
          recaptchaToken = await executeRecaptcha('REGISTER_RETAILER');
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
        }
      }

      // Create payment order with registration details
      const response = await fetch('/api/auth/register-retailer/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          password: formData.password,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create payment order');
      }

      // Load Cashfree SDK
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      
      script.onload = () => {
        const Cashfree = (window as any).Cashfree;
        const cashfree = Cashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox',
        });

        const checkoutOptions = {
          paymentSessionId: data.payment_session_id,
          redirectTarget: '_modal',
        };

        cashfree.checkout(checkoutOptions).then((result: any) => {
          setIsLoading(false);
          
          if (result.error) {
            // Payment failed - redirect to failure page
            const errorMessage = result.error.message || 'Payment failed';
            window.location.href = `/payment/failed?order_id=${data.order_id}&amount=${data.amount}`;
          } else if (result.paymentDetails) {
            // Payment successful - redirect to success page
            window.location.href = `/payment/success?order_id=${data.order_id}&amount=${data.amount}`;
          }
        }).catch((error: any) => {
          setIsLoading(false);
          // Payment error - redirect to failure page
          window.location.href = `/payment/failed?order_id=${data.order_id}&amount=${data.amount}`;
        });
      };

      document.head.appendChild(script);
    } catch (error) {
      setIsLoading(false);
      showToast.error('Payment Error', {
        description: error instanceof Error ? error.message : 'Failed to initiate payment'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Akrix.ai Branding */}
      <div className="absolute top-4 right-4 z-10">
        <a
          href="https://akrixsolutions.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600/80 hover:text-red-600 text-xs font-medium px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-200 flex items-center space-x-1 backdrop-blur-sm"
        >
          <span className="text-xs">🚀</span>
          <span>Developed by Akrix.ai</span>
        </a>
      </div>

      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" showText={true} animated={true} />
          </Link>
          <h2 className="text-4xl font-extrabold text-red-800 mb-4">
            Become a Retailer Partner
          </h2>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`flex items-center ${step >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <span className="text-3xl">🏪</span>
              <span className="text-xl font-bold">Retailer Registration</span>
            </div>
            <p className="text-red-100 text-sm">
              Join our network and start earning by providing government services
            </p>
          </div>
        </div>

        {/* Step 1: Details Form */}
        {step === 1 && (
          <form className="bg-white p-8 rounded-xl shadow-xl border border-red-200 animate-slide-in-left" onSubmit={handleStep1Submit}>
            <h3 className="text-2xl font-bold text-red-800 mb-6 text-center">📝 Step 1: Your Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-red-700 mb-2">
                  Full Name / Business Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name or business name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-red-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-red-700 mb-2">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone number"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-red-700 mb-2">
                  Shop/Business Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your complete shop/business address"
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-red-700 mb-2">
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your city"
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-red-700 mb-2">
                  State *
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your state"
                />
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>

              {/* PIN Code */}
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-red-700 mb-2">
                  PIN Code *
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.pincode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                />
                {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-red-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Min. 8 characters"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-red-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white transition-all duration-200 ${
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
                    Saving Details...
                  </>
                ) : (
                  'Next: Proceed to Payment →'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 p-8 rounded-xl shadow-2xl border-2 border-blue-300 animate-slide-in-right">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 text-center">💳 Step 2: Complete Payment</h3>
            
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="text-7xl mb-4 animate-bounce">💰</div>
                <h4 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">₹{registrationFee.toFixed(2)}</h4>
                <p className="text-white text-lg font-semibold">One-Time Registration Fee</p>
                <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white text-sm">✨ Lifetime Access • No Hidden Charges • Instant Activation</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 mb-6 shadow-lg">
              <h4 className="font-bold text-green-800 mb-3 flex items-center text-lg">
                <span className="mr-2 text-2xl">🔒</span>
                Secure Payment via Cashfree Gateway
              </h4>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2 text-green-600">✓</span>
                  Multiple payment options: UPI, Cards, Net Banking, Wallets
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-600">✓</span>
                  Instant payment confirmation & receipt
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-600">✓</span>
                  Bank-level security with SSL encryption
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-600">✓</span>
                  Quick admin approval after successful payment
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-300 mb-6">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🎉</span>
                <div>
                  <h5 className="font-bold text-orange-800 mb-1">What You Get:</h5>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Access to 100+ government services</li>
                    <li>• Earn up to 15% commission on every service</li>
                    <li>• Professional dashboard & tools</li>
                    <li>• 24/7 customer support</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handlePayment}
                disabled={isLoading || paymentLoading}
                className={`w-full flex justify-center items-center py-5 px-6 border border-transparent text-xl font-bold rounded-2xl text-white transition-all duration-300 transform ${
                  isLoading || paymentLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-105'
                }`}
              >
                {isLoading || paymentLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <span className="mr-3 text-2xl">💳</span>
                    Pay ₹{registrationFee.toFixed(2)} Securely
                    <span className="ml-3">→</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={isLoading || paymentLoading}
                className="w-full py-4 px-6 border-2 border-gray-400 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-500 transition-all duration-200 flex items-center justify-center"
              >
                <span className="mr-2">←</span>
                Back to Details
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                🔒 Your payment information is secure and encrypted
              </p>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login?role=retailer" className="font-medium text-red-600 hover:text-red-700 transition-colors">
              Sign in here
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            Want to register as customer?{' '}
            <Link href="/register/customer" className="font-medium text-red-600 hover:text-red-700 transition-colors">
              Customer Registration
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center animate-fade-in">
          <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 transition-colors font-medium">
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
