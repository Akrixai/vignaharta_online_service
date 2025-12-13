'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/logo-spinner';
import { showToast } from '@/lib/toast';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Eye,
  DollarSign
} from 'lucide-react';

interface RegistrationPayment {
  id: string;
  order_id: string;
  cf_order_id: string;
  amount: string;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_time: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  base_amount: string;
  gst_percentage: string;
  gst_amount: string;
  total_amount: string;
  metadata: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    business_name: string;
    role: string;
  };
}

export default function RegistrationPaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<RegistrationPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('CREATED');
  const [selectedPayment, setSelectedPayment] = useState<RegistrationPayment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchPayments();
    }
  }, [session, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/registration-payments?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      }
    } catch (error) {
      showToast.error('Error', { description: 'Failed to fetch registration payments' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      setProcessing(orderId);
      const response = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === 'PAID') {
          showToast.success('Payment Verified!', { description: 'Payment status updated to PAID' });
        } else {
          showToast.info('Payment Status', { description: `Payment status: ${data.status}` });
        }
        fetchPayments();
      } else {
        showToast.error('Error', { description: data.error || 'Failed to verify payment' });
      }
    } catch (error) {
      showToast.error('Error', { description: 'Failed to verify payment' });
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessRegistration = async (orderId: string) => {
    try {
      setProcessing(orderId);
      const response = await fetch('/api/admin/process-pending-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success('Registration Processed!', { description: 'User account created successfully' });
        fetchPayments();
      } else {
        showToast.error('Error', { description: data.error || 'Failed to process registration' });
      }
    } catch (error) {
      showToast.error('Error', { description: 'Failed to process registration' });
    } finally {
      setProcessing(null);
    }
  };

  const handleManuallyMarkPaid = async (orderId: string) => {
    showToast.confirm('Mark as Paid?', {
      description: 'Are you sure you want to manually mark this payment as PAID? This should only be done if you have confirmed the payment externally.',
      onConfirm: async () => {
        try {
          setProcessing(orderId);
          const response = await fetch('/api/admin/manual-payment-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              order_id: orderId, 
              status: 'PAID',
              payment_method: 'MANUAL_VERIFICATION'
            })
          });

          const data = await response.json();

          if (response.ok) {
            showToast.success('Payment Updated!', { description: 'Payment marked as PAID manually' });
            fetchPayments();
          } else {
            showToast.error('Error', { description: data.error || 'Failed to update payment' });
          }
        } catch (error) {
          showToast.error('Error', { description: 'Failed to update payment' });
        } finally {
          setProcessing(null);
        }
      }
    });
  };

  if (!session || session.user.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader text="Loading registration payments..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3 flex items-center">
            <CreditCard className="w-10 h-10 mr-3" />
            Registration Payments
          </h1>
          <p className="text-purple-100 text-xl">
            Manage and troubleshoot registration payment issues
          </p>
        </div>

        {/* Status Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="CREATED">Created (Pending)</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="ml-auto">
                <span className="text-sm text-gray-600">
                  Total: {payments.length} payments
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        {payments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No {statusFilter.toLowerCase()} payments found
              </h3>
              <p className="text-gray-500">
                No registration payments with status "{statusFilter}" to display.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {payments.map((payment) => (
              <Card key={payment.id} className={`border-l-4 ${
                payment.status === 'PAID' ? 'border-l-green-500' :
                payment.status === 'FAILED' ? 'border-l-red-500' :
                payment.status === 'CREATED' ? 'border-l-yellow-500' :
                'border-l-gray-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          payment.status === 'PAID' ? 'bg-green-100' :
                          payment.status === 'FAILED' ? 'bg-red-100' :
                          payment.status === 'CREATED' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <CreditCard className={`w-6 h-6 ${
                            payment.status === 'PAID' ? 'text-green-600' :
                            payment.status === 'FAILED' ? 'text-red-600' :
                            payment.status === 'CREATED' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{payment.metadata.name}</h3>
                          <p className="text-sm text-gray-600">Order ID: {payment.order_id}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          payment.status === 'CREATED' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{payment.metadata.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{payment.metadata.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">₹{payment.amount}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {new Date(payment.created_at).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>

                      {payment.payment_time && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-green-700">
                            <strong>Payment completed:</strong> {new Date(payment.payment_time).toLocaleString('en-GB')}
                            {payment.payment_method && ` via ${payment.payment_method}`}
                          </p>
                        </div>
                      )}

                      {payment.user_id && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-700">
                            <strong>Account created:</strong> User ID {payment.user_id}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>

                      {payment.status === 'CREATED' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleVerifyPayment(payment.order_id)}
                            disabled={processing === payment.order_id}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleManuallyMarkPaid(payment.order_id)}
                            disabled={processing === payment.order_id}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                        </>
                      )}

                      {payment.status === 'PAID' && !payment.user_id && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleProcessRegistration(payment.order_id)}
                          disabled={processing === payment.order_id}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Create Account
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedPayment(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Order ID</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedPayment.order_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cashfree Order ID</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedPayment.cf_order_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Amount</label>
                      <p className="text-gray-900 font-medium">₹{selectedPayment.amount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <p className={`font-medium ${
                        selectedPayment.status === 'PAID' ? 'text-green-600' :
                        selectedPayment.status === 'FAILED' ? 'text-red-600' :
                        selectedPayment.status === 'CREATED' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>{selectedPayment.status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Method</label>
                      <p className="text-gray-900 font-medium">{selectedPayment.payment_method || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Time</label>
                      <p className="text-gray-900 font-medium">
                        {selectedPayment.payment_time 
                          ? new Date(selectedPayment.payment_time).toLocaleString('en-GB')
                          : 'Not completed'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900 font-medium">{selectedPayment.metadata.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 font-medium">{selectedPayment.metadata.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 font-medium">{selectedPayment.metadata.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Business Name</label>
                      <p className="text-gray-900 font-medium">{selectedPayment.metadata.business_name}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900 font-medium">
                        {selectedPayment.metadata.address}, {selectedPayment.metadata.city}, {selectedPayment.metadata.state} - {selectedPayment.metadata.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                  {selectedPayment.user_id ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Account Created</span>
                      </div>
                      <p className="text-green-700 mt-1">User ID: {selectedPayment.user_id}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-yellow-800 font-medium">Account Not Created</span>
                      </div>
                      <p className="text-yellow-700 mt-1">
                        {selectedPayment.status === 'PAID' 
                          ? 'Payment completed but account creation pending'
                          : 'Waiting for payment completion'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-6">
                  <div className="flex space-x-3">
                    {selectedPayment.status === 'CREATED' && (
                      <>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleVerifyPayment(selectedPayment.order_id)}
                          disabled={processing === selectedPayment.order_id}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Verify Payment
                        </Button>
                        <Button
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => handleManuallyMarkPaid(selectedPayment.order_id)}
                          disabled={processing === selectedPayment.order_id}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Paid
                        </Button>
                      </>
                    )}
                    
                    {selectedPayment.status === 'PAID' && !selectedPayment.user_id && (
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleProcessRegistration(selectedPayment.order_id)}
                        disabled={processing === selectedPayment.order_id}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create User Account
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetails(false);
                        setSelectedPayment(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}