'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function EmployeeReferralConfigPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: true,
    referrerReward: 500,
    referredReward: 250
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config?category=EMPLOYEE_REFERRAL');
      const data = await response.json();
      
      if (data.success) {
        const configs = data.data;
        setConfig({
          enabled: configs.find((c: any) => c.config_key === 'employee_referral_enabled')?.config_value === 'true',
          referrerReward: parseFloat(configs.find((c: any) => c.config_key === 'employee_referral_referrer_reward')?.config_value || '500'),
          referredReward: parseFloat(configs.find((c: any) => c.config_key === 'employee_referral_referred_reward')?.config_value || '250')
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates = [
        {
          config_key: 'employee_referral_enabled',
          config_value: config.enabled.toString(),
          config_type: 'BOOLEAN',
          category: 'EMPLOYEE_REFERRAL',
          description: 'Enable/disable employee referral system'
        },
        {
          config_key: 'employee_referral_referrer_reward',
          config_value: config.referrerReward.toString(),
          config_type: 'NUMBER',
          category: 'EMPLOYEE_REFERRAL',
          description: 'Reward amount for referrer when referred employee is created'
        },
        {
          config_key: 'employee_referral_referred_reward',
          config_value: config.referredReward.toString(),
          config_type: 'NUMBER',
          category: 'EMPLOYEE_REFERRAL',
          description: 'Reward amount for referred employee upon creation'
        }
      ];

      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: updates })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Employee referral configuration updated successfully!');
        fetchConfig();
      } else {
        toast.error(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Referral Configuration</h1>
          <p className="text-gray-600 mt-1">Configure rewards for employee referrals</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🎁 Referral Reward Settings</CardTitle>
            <CardDescription>
              Set reward amounts for employees who refer new employees and for the referred employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading configuration...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Enable Employee Referral System</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      When enabled, employees will receive rewards for referring new employees
                    </p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enabled ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Referrer Reward */}
                <div>
                  <Label htmlFor="referrerReward">Referrer Reward Amount (₹)</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Amount credited to the employee who refers a new employee
                  </p>
                  <Input
                    id="referrerReward"
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.referrerReward}
                    onChange={(e) => setConfig({ ...config, referrerReward: parseFloat(e.target.value) || 0 })}
                    className="max-w-xs"
                  />
                </div>

                {/* Referred Reward */}
                <div>
                  <Label htmlFor="referredReward">Referred Employee Reward Amount (₹)</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Amount credited to the newly created employee
                  </p>
                  <Input
                    id="referredReward"
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.referredReward}
                    onChange={(e) => setConfig({ ...config, referredReward: parseFloat(e.target.value) || 0 })}
                    className="max-w-xs"
                  />
                </div>

                {/* Preview */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Preview</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      When an employee creates a new employee using their referral code:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Referrer gets <strong>₹{config.referrerReward}</strong> in their wallet</span>
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>New employee gets <strong>₹{config.referredReward}</strong> in their wallet</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {saving ? 'Saving...' : '💾 Save Configuration'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">ℹ️ How Employee Referral Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Each employee automatically gets a unique referral code in their profile</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>When creating a new employee, they can optionally enter a referral code</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>If a valid referral code is used, both employees receive rewards in their wallets</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Rewards are automatically credited and tracked in the system</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
