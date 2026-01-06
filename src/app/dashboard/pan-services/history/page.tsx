'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/layout';
import PanBrandingFooter from '@/components/pan-services/PanBrandingFooter';
// import { format } from 'date-fns';

interface PanService {
  id: string;
  service_type: 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN';
  mobile_number: string;
  mode: 'EKYC' | 'ESIGN';
  order_id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'PROCESSING' | 'EXPIRED';
  payment_status: 'PENDING' | 'RESERVED' | 'DEBITED' | 'CHARGED' | 'REFUNDED' | 'CANCELLED';
  payment_debited_at?: string;
  payment_charged_at?: string;
  refund_processed: boolean;
  refund_processed_at?: string;
  expires_at?: string;
  webhook_received_at?: string;
  completed_at?: string;
  inspay_txid?: string;
  inspay_opid?: string;
  acknowledgement_number?: string;
  inspay_url?: string;
  error_message?: string;
  receipt_generated?: boolean;
  receipt_generated_at?: string;
  callback_data?: any;
  callback_raw_data?: any;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILURE: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800'
};

const paymentStatusColors = {
  PENDING: 'bg-gray-100 text-gray-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  DEBITED: 'bg-orange-100 text-orange-700',
  CHARGED: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700'
};

const serviceTypeNames = {
  NEW_PAN: 'New PAN Application',
  PAN_CORRECTION: 'PAN Correction',
  INCOMPLETE_PAN: 'Incomplete PAN'
};

export default function PanServicesHistoryPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<PanService[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [resuming, setResuming] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchServices();

      // Check for redirect parameters
      const urlParams = new URLSearchParams(window.location.search);
      const redirected = urlParams.get('redirected');
      const status = urlParams.get('status');
      const txid = urlParams.get('txid');

      if (redirected === 'true') {
        if (status === 'Success') {
          toast.success('PAN application completed successfully!', { duration: 5000 });
        } else if (status === 'Failure') {
          toast.error('PAN application failed. Amount will be refunded.', { duration: 5000 });
        } else {
          toast('Returned from PAN application portal', { duration: 3000 });
        }

        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [session]);

  // Auto-refresh every 10 seconds for pending/processing orders
  useEffect(() => {
    if (!autoRefresh || loading) return;

    const hasPendingOrders = services.some(s =>
      s.status === 'PENDING' || s.status === 'PROCESSING'
    );

    if (hasPendingOrders) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing PAN services history...');
        fetchServices();
      }, 10000); // 10 seconds for faster updates

      return () => clearInterval(interval);
    }
  }, [services, autoRefresh, loading]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/pan-services/history');
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      } else {
        toast.error('Failed to fetch PAN services history');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch PAN services history');
    } finally {
      setLoading(false);
    }
  };

  // Check access
  if (session?.user?.role !== UserRole.RETAILER && session?.user?.role !== UserRole.CUSTOMER && session?.user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600">Only authorized users can access PAN services history.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredServices = services.filter(service =>
    filter === 'ALL' || service.status === filter
  );

  const getStatusBadge = (status: string) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
      {status}
    </span>
  );

  const getPaymentStatusBadge = (paymentStatus: string) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[paymentStatus as keyof typeof paymentStatusColors]}`}>
      {paymentStatus === 'RESERVED' ? '🔒 RESERVED' :
        paymentStatus === 'DEBITED' ? '💳 DEBITED' :
          paymentStatus === 'CHARGED' ? '✅ CHARGED' :
            paymentStatus === 'REFUNDED' ? '💸 REFUNDED' :
              paymentStatus === 'CANCELLED' ? '❌ CANCELLED' : paymentStatus}
    </span>
  );

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


  const handleDownloadReceipt = async (orderId: string, format: 'json' | 'pdf' = 'pdf') => {
    try {
      setDownloadingReceipt(orderId);

      const response = await fetch(`/api/pan-services/receipt?order_id=${orderId}&format=${format}`);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate receipt');
        return;
      }

      if (format === 'pdf') {
        // Download PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PAN_Receipt_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Receipt downloaded successfully!');
      } else {
        // Show JSON data
        const data = await response.json();
        console.log('Receipt data:', data);
        toast.success('Receipt data generated successfully!');
      }
    } catch (error) {
      console.error('Receipt download error:', error);
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const handleResume = async (orderId: string) => {
    try {
      setResuming(orderId);
      const res = await fetch('/api/pan-services/incomplete-pan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existing_order_id: orderId })
      });

      const data = await res.json();
      if (data.success && data.data?.inspay_url) {
        window.open(data.data.inspay_url, '_blank');
        toast.success('Resuming application...');
        fetchServices(); // Refresh to see updated status
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PAN services history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PAN Services History</h1>
              <p className="mt-2 text-gray-600">Track all your PAN service applications</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard/pan-services/new"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                New PAN Application
              </Link>
              <Link
                href="/dashboard/pan-services"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to PAN Services
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ALL'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All ({services.length})
              </button>
              {Object.keys(statusColors).map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status} ({services.filter(s => s.status === status).length})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
                {autoRefresh && services.some(s => s.status === 'PENDING' || s.status === 'PROCESSING') && (
                  <span className="text-green-600 text-xs">(10s)</span>
                )}
              </label>

              <button
                onClick={fetchServices}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    🔄 Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Services List */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No PAN Services Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'ALL'
                ? "You haven't applied for any PAN services yet."
                : `No PAN services with ${filter} status found.`
              }
            </p>
            <Link
              href="/dashboard/pan-services/new"
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
            >
              <span className="mr-2">🆔</span>
              Apply for New PAN
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {serviceTypeNames[service.service_type]}
                      </h3>
                      {getStatusBadge(service.status)}
                      {getPaymentStatusBadge(service.payment_status)}
                      <span className="text-sm text-gray-500">
                        Mode: {service.mode}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="bg-blue-50 p-2 rounded border border-blue-100">
                        <span className="text-xs text-gray-500 block mb-1">Merchant Order ID:</span>
                        <p className="font-mono font-bold text-blue-700">{service.order_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Mobile Number:</span>
                        <p className="font-medium">{service.mobile_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <p className="font-medium">₹{service.amount}</p>
                      </div>
                    </div>

                    {/* Pending/Incomplete Info */}
                    {service.status === 'PENDING' && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          <strong>Incomplete Session:</strong> This application was left in the middle. You can resume it using the button on the right.
                          <br /><span className="text-xs font-bold text-red-600 uppercase">Attention: This will expire in 24 hours.</span>
                        </p>
                      </div>
                    )}

                    {/* Payment Status Info */}
                    {service.payment_status === 'RESERVED' && (service.status === 'PENDING' || service.status === 'PROCESSING') && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600">🔒</span>
                          <p className="text-sm text-yellow-700 font-medium">
                            Payment Reserved: ₹{service.amount}
                          </p>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          Payment will be deducted only after successful completion of your application
                        </p>
                      </div>
                    )}

                    {service.payment_status === 'CHARGED' && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✅</span>
                          <p className="text-sm text-green-700 font-medium">
                            Payment Charged: ₹{service.amount}
                          </p>
                          {service.payment_charged_at && (
                            <span className="text-xs text-green-600">
                              on {new Date(service.payment_charged_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Payment deducted after successful completion
                        </p>
                      </div>
                    )}

                    {/* Legacy payment status info */}
                    {service.payment_status === 'DEBITED' && (service.status === 'PENDING' || service.status === 'PROCESSING') && service.expires_at && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-600">⏳</span>
                            <p className="text-sm text-orange-700 font-medium">
                              Payment debited: ₹{service.amount} (Legacy)
                            </p>
                          </div>
                          <p className="text-sm text-orange-600 font-semibold">
                            {getTimeRemaining(service.expires_at)}
                          </p>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                          Complete your application within 24 hours or amount will be auto-refunded
                        </p>
                      </div>
                    )}

                    {/* Refund Info */}
                    {service.refund_processed && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">💸</span>
                          <p className="text-sm text-purple-700 font-medium">
                            Refund processed: ₹{service.amount}
                          </p>
                          {service.refund_processed_at && (
                            <span className="text-xs text-purple-600">
                              on {new Date(service.refund_processed_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {service.inspay_txid && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">InsPay Transaction ID:</span>
                        <p className="font-medium">{service.inspay_txid}</p>
                      </div>
                    )}

                    {service.acknowledgement_number && service.acknowledgement_number !== 'Order is under process' && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">🎯</span>
                          <p className="text-sm text-blue-700 font-medium">
                            Acknowledgement Number: {service.acknowledgement_number}
                          </p>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Use this number to track your PAN application status with NSDL
                        </p>
                        <div className="mt-3">
                          <a
                            href="https://tin.tin.proteantech.in/tan2/servlet/PanStatusTrack"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
                          >
                            🔍 Track Status on NSDL
                          </a>
                        </div>
                      </div>
                    )}

                    {service.status === 'SUCCESS' && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✅</span>
                          <p className="text-sm text-green-700 font-medium">
                            Application successfully completed and status confirmed.
                          </p>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Your PAN application has been processed successfully via NSDL e-Gov.
                        </p>
                      </div>
                    )}

                    {/* Processing Status with Real-time Updates */}
                    {service.status === 'PROCESSING' && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <p className="text-sm text-blue-700 font-medium">
                            Application is being processed by NSDL
                          </p>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Status updates will appear automatically every 10 seconds. No action required.
                        </p>
                        {service.inspay_txid && (
                          <p className="text-xs text-blue-600 mt-1">
                            InsPay Transaction ID: {service.inspay_txid}
                          </p>
                        )}
                      </div>
                    )}

                    {service.error_message && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{service.error_message}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span>Applied: {new Date(service.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}</span>
                      <span>Updated: {new Date(service.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}</span>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    {service.status === 'PENDING' && (
                      <button
                        onClick={() => handleResume(service.order_id)}
                        disabled={resuming === service.order_id}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm text-center disabled:opacity-50"
                      >
                        {resuming === service.order_id ? 'Resuming...' : 'Resume Application'}
                      </button>
                    )}

                    {service.inspay_url && service.status === 'PROCESSING' && (
                      <a
                        href={service.inspay_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                      >
                        Continue Application
                      </a>
                    )}

                    {service.status === 'SUCCESS' && (
                      <div className="space-y-2">
                        <div className="space-y-2">
                          <button
                            onClick={() => handleDownloadReceipt(service.order_id, 'pdf')}
                            disabled={downloadingReceipt === service.order_id}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm w-full disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {downloadingReceipt === service.order_id ? 'Generating...' : (
                              <>
                                <span>📥</span> Download
                              </>
                            )}
                          </button>

                          <a
                            href={`/api/pan-services/receipt?order_id=${service.order_id}&format=pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm w-full text-center flex items-center justify-center gap-2"
                          >
                            <span>👁️</span> View Receipt
                          </a>
                        </div>

                        {service.acknowledgement_number && service.acknowledgement_number !== 'Order is under process' && (
                          <div className="text-xs text-center p-2 bg-green-50 rounded border">
                            <div className="font-semibold text-green-800">Tracking Number:</div>
                            <div className="font-mono text-green-700">{service.acknowledgement_number}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Branding Footer */}
        <PanBrandingFooter />
      </div>
    </DashboardLayout>
  );
}