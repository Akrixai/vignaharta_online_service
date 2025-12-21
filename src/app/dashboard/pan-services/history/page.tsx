'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/layout';
// import { format } from 'date-fns';

interface PanService {
  id: string;
  service_type: 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN';
  mobile_number: string;
  mode: 'EKYC' | 'ESIGN';
  order_id: string;
  amount: number;
  commission_amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'PROCESSING' | 'EXPIRED';
  payment_status: 'PENDING' | 'DEBITED' | 'REFUNDED';
  payment_debited_at?: string;
  refund_processed: boolean;
  refund_processed_at?: string;
  expires_at?: string;
  webhook_received_at?: string;
  completed_at?: string;
  inspay_txid?: string;
  inspay_opid?: string;
  inspay_url?: string;
  error_message?: string;
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
  DEBITED: 'bg-orange-100 text-orange-700',
  REFUNDED: 'bg-purple-100 text-purple-700'
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

  useEffect(() => {
    if (session?.user?.id) {
      fetchServices();
    }
  }, [session]);

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
      {paymentStatus === 'DEBITED' ? '💳 DEBITED' : paymentStatus === 'REFUNDED' ? '💸 REFUNDED' : paymentStatus}
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
                      <div>
                        <span className="text-gray-500">Order ID:</span>
                        <p className="font-mono font-medium text-blue-600">{service.order_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Mobile Number:</span>
                        <p className="font-medium">{service.mobile_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <p className="font-medium">₹{service.amount}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Commission:</span>
                        <p className="font-medium text-green-600">₹{service.commission_amount}</p>
                      </div>
                    </div>

                    {/* Payment Status Info */}
                    {service.payment_status === 'DEBITED' && (service.status === 'PENDING' || service.status === 'PROCESSING') && service.expires_at && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-600">⏳</span>
                            <p className="text-sm text-orange-700 font-medium">
                              Payment debited: ₹{service.amount}
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
                      <button
                        onClick={() => toast.success('PAN application completed successfully!')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}