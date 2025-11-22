'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';

interface Fee {
  id: string;
  fee_type: string;
  amount: string;
  billing_period: string;
  description: string;
  is_active: boolean;
}

export default function PlatformFeesPage() {
  const { data: session } = useSession();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await fetch('/api/admin/platform-fees');
      const data = await response.json();
      if (data.success) {
        setFees(data.data);
      }
    } catch (error) {
      showToast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (feeId: string, updates: Partial<Fee>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/platform-fees/${feeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        showToast.success('Fee updated successfully');
        fetchFees();
      } else {
        showToast.error(data.error || 'Failed to update fee');
      }
    } catch (error) {
      showToast.error('Failed to update fee');
    } finally {
      setSaving(false);
    }
  };

  const getFeeLabel = (feeType: string) => {
    const labels: Record<string, string> = {
      'YEARLY_FEE_CUSTOMER': 'Customer Yearly Fee',
      'YEARLY_FEE_RETAILER': 'Retailer Yearly Fee',
      'PLATFORM_FEE_CUSTOMER': 'Customer Platform Fee',
      'PLATFORM_FEE_RETAILER': 'Retailer Platform Fee',
    };
    return labels[feeType] || feeType;
  };

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Platform & Yearly Fees</h1>
          <p className="text-purple-100">
            Configure recurring fees for customers and retailers
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading fees...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fees.map((fee) => (
              <Card key={fee.id} className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">{getFeeLabel(fee.fee_type)}</CardTitle>
                  <CardDescription>{fee.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={fee.amount}
                      onChange={(e) => {
                        const updated = fees.map(f => 
                          f.id === fee.id ? { ...f, amount: e.target.value } : f
                        );
                        setFees(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {fee.fee_type.includes('PLATFORM_FEE') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Period
                      </label>
                      <select
                        value={fee.billing_period}
                        onChange={(e) => {
                          const updated = fees.map(f => 
                            f.id === fee.id ? { ...f, billing_period: e.target.value } : f
                          );
                          setFees(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly (3 months)</option>
                        <option value="HALF_YEARLY">Half Yearly (6 months)</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`active-${fee.id}`}
                      checked={fee.is_active}
                      onChange={(e) => {
                        const updated = fees.map(f => 
                          f.id === fee.id ? { ...f, is_active: e.target.checked } : f
                        );
                        setFees(updated);
                      }}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`active-${fee.id}`} className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>

                  <Button
                    onClick={() => handleUpdate(fee.id, {
                      amount: fee.amount,
                      billing_period: fee.billing_period,
                      is_active: fee.is_active,
                    })}
                    disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">ℹ️ How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>Yearly Fee:</strong> Charged once per year from the user's wallet</p>
            <p><strong>Platform Fee:</strong> Charged based on selected billing period (monthly/quarterly/half-yearly/yearly)</p>
            <p><strong>Auto-Deduction:</strong> Fees are automatically deducted from user wallets on due dates</p>
            <p><strong>Set to ₹0:</strong> To disable a fee, set the amount to 0</p>
            <p><strong>Transaction History:</strong> All fee deductions appear in user wallet transaction history</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900">⚙️ Manual Processing</CardTitle>
            <CardDescription>Process fees manually (for testing or immediate deduction)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={async () => {
                if (!confirm('Process all due fees now? This will deduct from user wallets.')) return;
                setSaving(true);
                try {
                  const response = await fetch('/api/cron/process-fees', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'your_secure_random_secret_here_change_in_production'}`,
                    },
                  });
                  const data = await response.json();
                  if (data.success) {
                    showToast.success(`Processed ${data.results.processed} fees`);
                    if (data.results.errors.length > 0) {
                      console.error('Errors:', data.results.errors);
                    }
                  } else {
                    showToast.error(data.error || 'Failed to process fees');
                  }
                } catch (error) {
                  showToast.error('Failed to process fees');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {saving ? 'Processing...' : '▶️ Process Fees Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
