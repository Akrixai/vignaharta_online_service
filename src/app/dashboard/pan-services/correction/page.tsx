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

export default function PanCorrectionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [config, setConfig] = useState<PanConfig | null>(null);
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
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletBalance(data.data.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/pan-services/config?type=PAN_CORRECTION');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config) {
      toast.error('Configuration not loaded');
      return;
    }

    if (walletBalance < config.price) {
      toast.error(`Insufficient wallet balance. Required: ₹${config.price}`);
      return;
    }

    if (!formData.mobile_number || formData.mobile_number.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/pan-services/pan-correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message with payment confirmation
        toast.success(data.message || 'Payment debited! Redirecting to complete your correction...', {
          duration: 5000,
          icon: '💳'
        });
        
        // Show order ID
        if (data.data?.order_id) {
          toast.success(`Order ID: ${data.data.order_id}`, {
            duration: 8000,
            icon: '📋'
          });
        }
        
        // Redirect to InsPay URL immediately
        if (data.data?.inspay_url) {
          toast.loading('Opening PAN correction portal...', { duration: 2000 });
          
          setTimeout(() => {
            window.location.href = data.data.inspay_url;
          }, 1500);
        } else {
          setTimeout(() => {
            router.push('/dashboard/pan-services/history');
          }, 2000);
        }
      } else {
        // Show refund message if applicable
        if (data.refunded) {
          toast.error(data.message || 'Failed to initiate PAN correction. Amount refunded to your wallet.', {
            duration: 6000,
            icon: '💸'
          });
          // Refresh wallet balance
          fetchWalletBalance();
        } else {
          toast.error(data.message || 'Failed to initiate PAN correction');
        }
      }
    } catch (error) {
      console.error('Error submitting PAN correction:', error);
      toast.error('An error occurred while processing your request');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PAN Correction</h1>
          <p className="text-gray-600">Correct errors in your existing PAN card</p>
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
                    Correction Mode *
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
                        <div className="font-medium text-gray-900">EKYC (Instant Correction)</div>
                        <div className="text-sm text-gray-600">
                          Quick correction without signature requirement. Faster processing.
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
                          Correction with signature and photo update. Traditional processing method.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Common Corrections Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Common Corrections Available:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Name spelling correction</li>
                    <li>• Date of birth correction</li>
                    <li>• Father's/Mother's name correction</li>
                    <li>• Address update</li>
                    <li>• Photo and signature update</li>
                  </ul>
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
                    disabled={loading || !config || walletBalance < (config?.price || 0)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? 'Processing...' : 'Start Correction'}
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
              <div className="text-2xl font-bold text-green-600 mb-2">
                ₹{walletBalance.toLocaleString()}
              </div>
              {config && walletBalance < config.price && (
                <div className="text-sm text-red-600 mb-3">
                  Insufficient balance. Required: ₹{config.price}
                </div>
              )}
              <button
                onClick={() => router.push('/dashboard/wallet')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Add Money
              </button>
            </div>

            {/* Pricing */}
            {config && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
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
              </div>
            )}

            {/* Process Info */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">⚠️ Important: Instant Payment</h3>
              <div className="space-y-3 text-sm text-orange-800">
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-1">💳</span>
                  <span><strong>Payment will be debited instantly</strong> when you click "Start Correction"</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-1">🔗</span>
                  <span>You'll be redirected to NSDL portal to complete your correction</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-1">⏰</span>
                  <span><strong>Complete within 24 hours</strong> or amount will be auto-refunded</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-1">✅</span>
                  <span>Commission credited on successful completion</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-1">💸</span>
                  <span>Full refund if correction fails or expires</span>
                </div>
              </div>
            </div>

            {/* Track Application */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Track Your Correction</h3>
              <p className="text-sm text-blue-800 mb-3">
                Your order ID will be visible immediately in PAN Services History
              </p>
              <button
                onClick={() => router.push('/dashboard/pan-services/history')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                View History
              </button>
            </div>

            {/* Required Documents */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">Required Documents</h3>
              <div className="space-y-2 text-sm text-orange-800">
                <div>• Existing PAN card</div>
                <div>• Aadhaar card</div>
                <div>• Supporting documents for correction</div>
                <div>• Recent photograph (if updating photo)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}