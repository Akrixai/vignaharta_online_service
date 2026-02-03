'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/layout';
import PanConfirmationModal from '@/components/pan-services/PanConfirmationModal';
import PanBrandingFooter from '@/components/pan-services/PanBrandingFooter';
import PanServiceValidation from '@/components/pan-services/PanServiceValidation';

interface PanConfig {
  price: number;
}

export default function PanCorrectionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [config, setConfig] = useState<PanConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [formData, setFormData] = useState({
    mobile_number: '',
    mode: 'EKYC' as 'EKYC' | 'ESIGN'
  });

  // Check if user has access
  const hasAccess = session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER;

  useEffect(() => {
    if (hasAccess) {
      fetchWalletBalance();
      fetchConfig();
    }
  }, [hasAccess]);

  const fetchWalletBalance = async () => {
    setWalletLoading(true);
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletBalance(data.data.balance || 0);
        } else {
          toast.error('Failed to load wallet balance');
        }
      } else {
        toast.error('Failed to load wallet balance');
      }
    } catch (error) {
      console.error('Wallet fetch error:', error);
      toast.error('Failed to load wallet balance');
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const response = await fetch('/api/pan-services/config?type=PAN_CORRECTION');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.data);
        } else {
          toast.error('Failed to load service configuration');
        }
      } else {
        toast.error('Failed to load service configuration');
      }
    } catch (error) {
      console.error('Config fetch error:', error);
      toast.error('Failed to load service configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleValidationSuccess = async () => {
    if (!config) {
      toast.error('Configuration not loaded. Please refresh the page.');
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
        // Prepare confirmation data
        const confirmData = {
          service_type: 'PAN_CORRECTION' as const,
          order_id: data.data.order_id,
          mobile_number: formData.mobile_number,
          mode: formData.mode,
          amount: config.price,
          inspay_url: data.data.inspay_url,
          inspay_txid: data.data.inspay_txid,
          created_at: new Date().toISOString(),
          payment_note: data.data.payment_note
        };

        setConfirmationData(confirmData);
        setShowConfirmModal(true);

        // Show success toast
        toast.success(data.message || 'PAN correction initiated successfully!', {
          duration: 3000,
          icon: '🚀'
        });
      } else {
        toast.error(data.message || 'Failed to initiate PAN correction');
      }
    } catch (error) {
      console.error('Network/Parse Error:', error);
      toast.error('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This is now handled by the validation component
  };

  const handleConfirmRedirect = () => {
    if (confirmationData?.inspay_url) {
      toast.loading('Opening PAN correction portal...', { duration: 2000 });
      setTimeout(() => {
        window.location.href = confirmationData.inspay_url;
      }, 1000);
    } else {
      router.push('/dashboard/pan-services/history');
    }
    setShowConfirmModal(false);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    // Redirect to history after closing modal
    setTimeout(() => {
      router.push('/dashboard/pan-services/history');
    }, 500);
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
    <>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PAN Correction</h1>
            <p className="text-gray-600">Correct errors in your existing PAN card with instant processing</p>
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

                    <div className="flex-1 ml-4">
                      <PanServiceValidation
                        walletBalance={walletBalance}
                        onValidationSuccess={handleValidationSuccess}
                        onValidationError={(errors) => {
                          console.error('Validation failed:', errors);
                        }}
                        buttonText="Start Correction"
                        disabled={loading || configLoading || walletLoading || !config}
                        className="w-full"
                        showRequirements={false}
                      />
                    </div>
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
                  </div>
                ) : config ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Fee:</span>
                      <span className="font-semibold">₹{config.price}</span>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">💳 New Payment Flow</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">✅</span>
                    <span><strong>No upfront payment!</strong> Money will be deducted only after successful completion</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">🔗</span>
                    <span>You'll be redirected to NSDL portal to complete your correction</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">💰</span>
                    <span><strong>Payment charged only on success</strong> - No risk of losing money</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">❌</span>
                    <span>If correction fails, no money will be deducted</span>
                  </div>
                </div>
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

          {/* Branding Footer */}
          <PanBrandingFooter />
        </div>
      </DashboardLayout>

      {/* Confirmation Modal */}
      <PanConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmRedirect}
        data={confirmationData}
        loading={false}
      />
    </>
  );
}