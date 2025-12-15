'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

interface StuckPayment {
  id: string;
  order_id: string;
  cf_order_id: string;
  user_id: string;
  amount: number;
  base_amount: number;
  gst_amount: number;
  wallet_credit_amount: number;
  status: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function StuckPaymentsPage() {
  const { data: session } = useSession();
  const [stuckPayments, setStuckPayments] = useState<StuckPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchStuckPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cashfree_payments')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .eq('status', 'CREATED')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stuck payments:', error);
        showToast.error('Failed to fetch stuck payments');
        return;
      }

      setStuckPayments(data || []);
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Failed to fetch stuck payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchStuckPayments();
    }
  }, [session]);

  const handleProcessPayment = async (orderId: string, action: 'mark_paid' | 'mark_failed') => {
    try {
      setProcessing(orderId);
      
      const response = await fetch('/api/admin/process-stuck-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, action }),
      });

      const result = await response.json();

      if (result.success) {
        showToast.success(
          action === 'mark_paid' ? 'Payment Processed' : 'Payment Marked Failed',
          {
            description: action === 'mark_paid' 
              ? `₹${result.amount_credited} credited to wallet`
              : 'Payment marked as failed'
          }
        );
        
        // Refresh the list
        fetchStuckPayments();
      } else {
        throw new Error(result.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast.error('Failed to process payment', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessing(null);
    }
  };

  const testCashfreeAPI = async (cfOrderId: string) => {
    try {
      const response = await fetch('/api/wallet/cashfree/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cf_order_id: cfOrderId }),
      });

      const result = await response.json();
      
      if (result.success) {
        showToast.success('API Test Successful', {
          description: `Status: ${result.response.body.order_status || 'Unknown'}`
        });
      } else {
        showToast.error('API Test Failed', {
          description: result.response.body.message || 'Unknown error'
        });
      }
      
      console.log('Cashfree API test result:', result);
    } catch (error) {
      console.error('Error testing API:', error);
      showToast.error('API test failed');
    }
  };

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">🔧 Stuck Payments Management</h1>
          <p className="text-orange-100">Manage payments that are stuck in CREATED status</p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span>Total Stuck: {stuckPayments.length}</span>
            <Button
              onClick={fetchStuckPayments}
              variant="outline"
              size="sm"
              className="border-white text-orange-600 bg-white hover:bg-orange-50"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Stuck Payments List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading stuck payments...</p>
            </CardContent>
          </Card>
        ) : stuckPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stuck Payments!</h3>
              <p className="text-gray-600">All payments are processing normally.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {stuckPayments.map((payment) => (
              <Card key={payment.id} className="border-orange-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order: {payment.order_id}</CardTitle>
                      <CardDescription>
                        User: {payment.user?.name} ({payment.user?.email})
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">STUCK</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Wallet Credit</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(payment.wallet_credit_amount || payment.base_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cashfree Order ID</p>
                      <p className="font-mono text-sm">{payment.cf_order_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm">{formatDateTime(payment.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleProcessPayment(payment.order_id, 'mark_paid')}
                      disabled={processing === payment.order_id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing === payment.order_id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        '✅ Mark as Paid & Credit Wallet'
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleProcessPayment(payment.order_id, 'mark_failed')}
                      disabled={processing === payment.order_id}
                      variant="destructive"
                    >
                      ❌ Mark as Failed
                    </Button>
                    
                    <Button
                      onClick={() => testCashfreeAPI(payment.cf_order_id)}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      🔍 Test API
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">💡 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• <strong>Mark as Paid:</strong> Credits the wallet amount and creates transaction record</li>
              <li>• <strong>Mark as Failed:</strong> Updates status to failed without crediting wallet</li>
              <li>• <strong>Test API:</strong> Checks the actual status with Cashfree API</li>
              <li>• Only payments from the last 24 hours are shown</li>
              <li>• Always verify with the user before manually processing payments</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}