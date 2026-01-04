'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import PanConfirmationModal from './PanConfirmationModal';

interface PanConfig {
  price: number;
}

interface PanCorrectionTabProps {
  walletBalance: number;
  onWalletUpdate: () => void;
  router: any;
}

export default function PanCorrectionTab({ walletBalance, onWalletUpdate, router }: PanCorrectionTabProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<PanConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [formData, setFormData] = useState({
    mobile_number: '',
    mode: 'EKYC' as 'EKYC' | 'ESIGN'
  });

  useEffect(() => {
    fetchConfig();
  }, []);

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
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load service configuration');
    } finally {
      setConfigLoading(false);
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
      console.error('Error submitting PAN correction:', error);
      toast.error('An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRedirect = () => {
    if (confirmationData?.inspay_url) {
      toast.loading('Opening PAN correction portal...', { duration: 2000 });
      setTimeout(() => {
        window.location.href = confirmationData.inspay_url;
      }, 1000);
    } else {
      router.push('/dashboard/pan-services?tab=history');
    }
    setShowConfirmModal(false);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    // Redirect to history after closing modal
    setTimeout(() => {
      router.push('/dashboard/pan-services?tab=history');
    }, 500);
  };

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
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

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || configLoading || !config || walletBalance < (config?.price || 0)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Processing...' : 'Start Correction'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          {config && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
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
            </div>
          )}

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