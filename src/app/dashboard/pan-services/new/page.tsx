'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/layout';

interface PanConfig {
  price: number;
  commission_rate: number;
}

export default function NewPanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [config, setConfig] = useState<PanConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [formData, setFormData] = useState({
    mobile_number: '',
    mode: 'EKYC' as 'EKYC' | 'ESIGN'
  });

  // Check if user has access
  const hasAccess = session?.user?.email === 'AkrixRetailerTest@gmail.com' && 
    (session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER);

  useEffect(() => {
    if (hasAccess) {
      fetchWalletBalance();
      fetchConfig();
    }
  }, [hasAccess]);

  const fetchWalletBalance = async () => {
    setWalletLoading(true);
    try {
      console.log('💰 Fetching wallet balance...');
      const response = await fetch('/api/wallet');
      console.log('📊 Wallet response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Wallet data:', data);
        
        if (data.success) {
          setWalletBalance(data.data.balance || 0);
          console.log('✅ Wallet balance loaded:', data.data.balance);
        } else {
          console.error('❌ Wallet fetch failed:', data.message);
          toast.error('Failed to load wallet balance');
        }
      } else {
        console.error('❌ Wallet fetch HTTP error:', response.status);
        toast.error('Failed to load wallet balance');
      }
    } catch (error) {
      console.error('💥 Wallet fetch error:', error);
      toast.error('Failed to load wallet balance');
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      console.log('🔧 Fetching PAN config...');
      const response = await fetch('/api/pan-services/config?type=NEW_PAN');
      console.log('📊 Config response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Config data:', data);
        
        if (data.success) {
          setConfig(data.data);
          console.log('✅ Config loaded successfully');
        } else {
          console.error('❌ Config fetch failed:', data.message);
          toast.error('Failed to load service configuration');
        }
      } else {
        console.error('❌ Config fetch HTTP error:', response.status);
        toast.error('Failed to load service configuration');
      }
    } catch (error) {
      console.error('💥 Config fetch error:', error);
      toast.error('Failed to load service configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config) {
      toast.error('Configuration not loaded. Please refresh the page.');
      return;
    }

    if (walletBalance < config.price) {
      toast.error(`Insufficient wallet balance. Required: ₹${config.price}. Please add money to your wallet first.`);
      return;
    }

    if (!formData.mobile_number || formData.mobile_number.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Submitting PAN application:', formData);
      
      const response = await fetch('/api/pan-services/new-pan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📊 Response status:', response.status);
      
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        toast.success(data.message || 'PAN application initiated successfully!');
        
        // Show debug info in development
        if (process.env.NODE_ENV === 'development' && data.debug) {
          console.log('🐛 Debug info:', data.debug);
        }
        
        // Redirect to InsPay URL
        if (data.data?.inspay_url) {
          console.log('🔗 Opening InsPay URL:', data.data.inspay_url);
          window.open(data.data.inspay_url, '_blank');
        }
        
        // Redirect to history page after a short delay
        setTimeout(() => {
          router.push('/dashboard/pan-services/history');
        }, 2000);
      } else {
        console.error('❌ API Error:', data);
        
        // Show debug info in development
        if (process.env.NODE_ENV === 'development' && data.debug) {
          console.log('🐛 Debug info:', data.debug);
        }
        
        toast.error(data.message || 'Failed to initiate PAN application');
      }
    } catch (error) {
      console.error('💥 Network/Parse Error:', error);
      toast.error('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600">PAN services are currently available for selected retailers only.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New PAN Application</h1>
          <p className="text-gray-600">Apply for a new PAN card with instant processing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    id="mobile_number"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This mobile number will be used for OTP verification</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Mode *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="mode"
                        value="EKYC"
                        checked={formData.mode === 'EKYC'}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'EKYC' | 'ESIGN' })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">EKYC (Instant PAN)</div>
                        <div className="text-sm text-gray-600">
                          Get instant PAN without signature requirement. Faster processing.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="mode"
                        value="ESIGN"
                        checked={formData.mode === 'ESIGN'}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'EKYC' | 'ESIGN' })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">ESIGN (With Signature & Photo)</div>
                        <div className="text-sm text-gray-600">
                          PAN card with signature and photo. Traditional processing method.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    ← Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || configLoading || walletLoading || !config || walletBalance < (config?.price || 0)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : configLoading || walletLoading ? (
                      'Loading...'
                    ) : (
                      'Start Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Balance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Balance</h3>
              {walletLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ₹{walletBalance.toLocaleString()}
                  </div>
                  {config && walletBalance < config.price && (
                    <div className="text-sm text-red-600 mb-3">
                      Insufficient balance. Required: ₹{config.price}
                    </div>
                  )}
                </>
              )}
              <button
                onClick={() => router.push('/dashboard/wallet')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
                disabled={walletLoading}
              >
                Add Money
              </button>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              {configLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ) : config ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee:</span>
                    <span className="font-semibold">₹{config.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Commission:</span>
                    <span className="font-semibold text-green-600">
                      ₹{((config.price * config.commission_rate) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Deduction:</span>
                      <span>₹{config.price}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600 text-sm">
                  Failed to load pricing information
                </div>
              )}
            </div>

            {/* Process Info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Process Information</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">1.</span>
                  <span>You'll be redirected to NSDL portal</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">2.</span>
                  <span>Complete the application process</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">3.</span>
                  <span>Amount will be deducted after successful completion</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">4.</span>
                  <span>Commission will be credited immediately</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}