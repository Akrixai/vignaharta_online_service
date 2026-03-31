'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';

interface FeeConfig {
  // Daily charge
  enabled: boolean;
  amount: number;
  // Recurring (quarterly/half-yearly/yearly)
  recurring_enabled: boolean;
  recurring_amount: number;
  recurring_type: string;
  // Application platform fee
  platform_fee: number;
}

export default function PlatformFeesPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<FeeConfig>({
    enabled: true,
    amount: 10,
    recurring_enabled: true,
    recurring_amount: 500,
    recurring_type: 'QUARTERLY',
    platform_fee: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingCron, setProcessingCron] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/platform-fees');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch {
      showToast.error('Failed to load fee settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (fields: Partial<FeeConfig>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/platform-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Settings saved successfully');
        fetchConfig();
      } else {
        showToast.error(data.error || 'Failed to save');
      }
    } catch {
      showToast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessDailyCharge = async () => {
    if (!confirm('Process daily charge for ALL active users now? This will deduct ₹' + config.amount + ' from their wallets.')) return;
    setProcessingCron(true);
    try {
      const res = await fetch('/api/cron/process-daily-charge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'your_secure_random_secret_here_change_in_production'}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast.success(
          `Done: ${data.results?.processed ?? 0} charged, ${data.results?.skipped ?? 0} skipped, ${data.results?.failed ?? 0} failed`
        );
      } else {
        showToast.error(data.error || 'Failed to process');
      }
    } catch {
      showToast.error('Failed to process daily charge');
    } finally {
      setProcessingCron(false);
    }
  };

  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Platform & Yearly Fees</h1>
          <p className="text-purple-100">Configure recurring fees for customers and retailers</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading fee settings...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Daily Platform Charge */}
            <Card className="border-2 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg">🔄 Daily Platform Charge</CardTitle>
                <CardDescription>
                  Deducted daily from all active customer &amp; retailer wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.enabled}
                    onClick={() => setConfig((p) => ({ ...p, enabled: !p.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      config.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={config.amount}
                    onChange={(e) => setConfig((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: ₹10/day per user</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave({ enabled: config.enabled, amount: config.amount })}
                    disabled={saving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleProcessDailyCharge}
                    disabled={processingCron}
                    variant="outline"
                    className="flex-1 border-orange-400 text-orange-600 hover:bg-orange-50"
                  >
                    {processingCron ? 'Processing...' : '▶ Run Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recurring Charge (Quarterly / Half-Yearly / Yearly) */}
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">📅 Recurring Platform Fee</CardTitle>
                <CardDescription>
                  Charged per billing period for all customers and retailers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.recurring_enabled}
                    onClick={() => setConfig((p) => ({ ...p, recurring_enabled: !p.recurring_enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      config.recurring_enabled ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.recurring_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {config.recurring_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.recurring_amount}
                    onChange={(e) => setConfig((p) => ({ ...p, recurring_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Period</label>
                  <select
                    value={config.recurring_type}
                    onChange={(e) => setConfig((p) => ({ ...p, recurring_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly (3 months)</option>
                    <option value="HALF_YEARLY">Half Yearly (6 months)</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <Button
                  onClick={() => handleSave({
                    recurring_enabled: config.recurring_enabled,
                    recurring_amount: config.recurring_amount,
                    recurring_type: config.recurring_type,
                  })}
                  disabled={saving}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Application Platform Fee */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg">💳 Application Platform Fee</CardTitle>
                <CardDescription>
                  One-time fee charged per service application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fee Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.platform_fee}
                    onChange={(e) => setConfig((p) => ({ ...p, platform_fee: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Charged when a user submits a service application</p>
                </div>

                <Button
                  onClick={() => handleSave({ platform_fee: config.platform_fee })}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">ℹ️ How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>Daily Charge:</strong> Deducted every day from all active customer and retailer wallets via cron at 1:00 AM</p>
            <p><strong>Recurring Fee:</strong> Charged per billing period (monthly/quarterly/half-yearly/yearly) from user wallets</p>
            <p><strong>Application Fee:</strong> One-time fee deducted when a user submits a service application</p>
            <p><strong>Insufficient Balance:</strong> If a user has less than the charge amount, the deduction is recorded as failed</p>
            <p><strong>Transaction History:</strong> All deductions appear in user wallet transaction history</p>
          </CardContent>
        </Card>

        {/* Manual Processing */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900">⚙️ Manual Processing</CardTitle>
            <CardDescription>Process fees manually for testing or immediate deduction</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleProcessDailyCharge}
              disabled={processingCron}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {processingCron ? 'Processing...' : '▶️ Process Daily Charge Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
