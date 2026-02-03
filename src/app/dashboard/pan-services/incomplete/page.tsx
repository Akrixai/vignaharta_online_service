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
import ResumeApplicationButton from '@/components/pan-services/ResumeApplicationButton';

interface PanService {
  id: string;
  service_type: 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN';
  mobile_number: string;
  mode: 'EKYC' | 'ESIGN';
  order_id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'PROCESSING' | 'EXPIRED';
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export default function IncompletePanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [pendingApplications, setPendingApplications] = useState<PanService[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [resuming, setResuming] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [formData, setFormData] = useState({
    existing_order_id: ''
  });

  // Check if user has access
  const hasAccess = session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER;

  useEffect(() => {
    if (hasAccess) {
      fetchWalletBalance();
      fetchPendingApplications();

      // Auto-refresh every 30 seconds for pending applications
      const interval = setInterval(fetchPendingApplications, 30000);
      return () => clearInterval(interval);
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

  const fetchPendingApplications = async () => {
    try {
      const response = await fetch('/api/pan-services/history?status=PENDING,PROCESSING');
      if (response.ok) {
        const data = await response.json();
        setPendingApplications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const handleResumeFromList = async (orderId: string, application: PanService) => {
    try {
      setResuming(orderId);
      const res = await fetch('/api/pan-services/incomplete-pan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existing_order_id: orderId })
      });

      const data = await res.json();
      if (data.success && data.data?.inspay_url) {
        // Prepare confirmation data
        const confirmData = {
          service_type: 'INCOMPLETE_PAN' as const,
          order_id: orderId,
          mobile_number: application.mobile_number,
          mode: application.mode,
          amount: data.data.amount || application.amount,
          inspay_url: data.data.inspay_url,
          inspay_txid: data.data.inspay_txid,
          created_at: application.created_at,
          payment_note: data.data.payment_note
        };

        setConfirmationData(confirmData);
        setShowConfirmModal(true);

        toast.success('Application ready to resume!');
        fetchPendingApplications(); // Refresh to see updated status
      } else {
        toast.error(data.message || 'Failed to resume application');
      }
    } catch (err) {
      console.error('Resume error:', err);
      toast.error('Failed to connect to service');
    } finally {
      setResuming(null);
    }
  };

  const handleValidationSuccess = async () => {
    if (!formData.existing_order_id.trim()) {
      toast.error('Please enter your existing order ID');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/pan-services/incomplete-pan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Find the application details from pending applications or create basic data
        const existingApp = pendingApplications.find(app => app.order_id === formData.existing_order_id);

        // Prepare confirmation data
        const confirmData = {
          service_type: 'INCOMPLETE_PAN' as const,
          order_id: data.data.order_id || formData.existing_order_id,
          mobile_number: existingApp?.mobile_number || 'N/A',
          mode: existingApp?.mode || 'EKYC' as const,
          amount: data.data.amount || 107,
          inspay_url: data.data.inspay_url,
          inspay_txid: data.data.inspay_txid,
          created_at: existingApp?.created_at || new Date().toISOString(),
          payment_note: data.data.payment_note
        };

        setConfirmationData(confirmData);
        setShowConfirmModal(true);

        // Show success toast
        toast.success(data.message || 'Incomplete PAN application resumed successfully!', {
          duration: 3000,
          icon: '🚀'
        });

        // Refresh pending applications list
        fetchPendingApplications();
      } else {
        toast.error(data.message || 'Failed to resume incomplete PAN application');
      }
    } catch (error) {
      console.error('Error resuming incomplete PAN application:', error);
      toast.error('An error occurred while processing your request');
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
      toast.loading('Opening PAN application portal...', { duration: 2000 });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Incomplete PAN</h1>
            <p className="text-gray-600">Continue your incomplete PAN applications</p>
          </div>

          {/* Pending Applications Section */}
          {pendingApplications.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Your Incomplete Applications</h3>
                <button
                  onClick={fetchPendingApplications}
                  disabled={loadingApplications}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {loadingApplications ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>🔄 Refresh</>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{app.service_type.replace('_', ' ')}</h4>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            PENDING
                          </span>
                          <span className="text-sm text-gray-600">Mode: {app.mode}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Order ID:</span>
                            <p className="font-mono font-medium text-blue-600">{app.order_id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Mobile:</span>
                            <p className="font-medium">{app.mobile_number}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount:</span>
                            <p className="font-medium">₹{app.amount}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Applied: {new Date(app.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                          {app.expires_at && (
                            <div className="text-sm font-medium text-orange-600">
                              ⏰ {getTimeRemaining(app.expires_at)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        <ResumeApplicationButton
                          walletBalance={walletBalance}
                          onValidationSuccess={() => handleResumeFromList(app.order_id, app)}
                          onValidationError={(errors) => {
                            console.error('Resume validation failed:', errors);
                          }}
                          disabled={false}
                          isResuming={resuming === app.order_id}
                          className="transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Quick Resume:</strong> Click "Resume Now" on any incomplete application above, or enter the Order ID manually below if you have it from another source.
                </p>
              </div>
            </div>
          )}

          {/* Manual Order ID Entry Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resume by Order ID</h3>
              <p className="text-sm text-gray-600">Enter your existing order ID to resume an incomplete application</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="existing_order_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Order ID *
                </label>
                <input
                  type="text"
                  id="existing_order_id"
                  value={formData.existing_order_id}
                  onChange={(e) => setFormData({ ...formData, existing_order_id: e.target.value })}
                  placeholder="Enter your existing PAN application order ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the order ID from your previous incomplete PAN application
                </p>
              </div>

              {/* Information Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">New Payment Flow - Pay After Success:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ✅ No upfront payment required</li>
                  <li>• 💰 Payment deducted only after successful completion</li>
                  <li>• ❌ If application fails, no money will be charged</li>
                  <li>• 🔒 Your wallet balance is reserved but not deducted</li>
                  <li>• 📋 All previously entered data will be preserved</li>
                </ul>
              </div>

              {/* How to Find Order ID */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">How to Find Your Order ID:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Check your email for the original application confirmation</li>
                  <li>• Look for SMS notifications from NSDL</li>
                  <li>• Check your PAN services history in this dashboard</li>
                  <li>• Contact support if you cannot locate your order ID</li>
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
                    buttonText="Resume Application"
                    disabled={loading || walletLoading || !formData.existing_order_id.trim()}
                    className="w-full"
                    showRequirements={false}
                  />
                </div>
              </div>
            </form>
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