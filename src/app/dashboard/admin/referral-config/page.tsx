'use client';

import { useState, useEffect } from 'react';

interface Config {
  config_key: string;
  config_value: string;
  description: string;
}

export default function ReferralConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    referral_reward_referrer: '',
    referral_reward_referred: '',
    referral_enabled: 'true'
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/config?category=REFERRAL', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.configs?.REFERRAL) {
        const referralConfigs = data.configs.REFERRAL;
        setConfigs(referralConfigs);
        
        const newFormData: any = {};
        referralConfigs.forEach((config: Config) => {
          newFormData[config.config_key] = config.config_value;
        });
        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (configKey: string) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          config_key: configKey,
          config_value: formData[configKey as keyof typeof formData]
        })
      });

      if (response.ok) {
        alert('Configuration updated successfully!');
        fetchConfigs();
      } else {
        alert('Failed to update configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral System Configuration</h1>
        <p className="text-gray-600">Manage referral rewards and settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        {/* Referrer Reward */}
        <div className="border-b pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referrer Reward Amount (₹)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Amount credited to the referrer when their referred user successfully registers
          </p>
          <div className="flex gap-4">
            <input
              type="number"
              min="0"
              step="10"
              value={formData.referral_reward_referrer}
              onChange={(e) => setFormData({ ...formData, referral_reward_referrer: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={() => handleSave('referral_reward_referrer')}
              disabled={saving}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Referred User Reward */}
        <div className="border-b pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referred User Reward Amount (₹)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Amount credited to the new user upon successful registration
          </p>
          <div className="flex gap-4">
            <input
              type="number"
              min="0"
              step="10"
              value={formData.referral_reward_referred}
              onChange={(e) => setFormData({ ...formData, referral_reward_referred: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={() => handleSave('referral_reward_referred')}
              disabled={saving}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Enable/Disable Referral System */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral System Status
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Enable or disable the entire referral system
          </p>
          <div className="flex gap-4">
            <select
              value={formData.referral_enabled}
              onChange={(e) => setFormData({ ...formData, referral_enabled: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <button
              onClick={() => handleSave('referral_enabled')}
              disabled={saving}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">How Referral System Works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Retailers generate unique referral codes from their dashboard</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>They share the referral link with potential new retailers</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>When someone registers using the referral code, both parties receive rewards</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>Rewards are automatically credited to their wallets upon successful registration</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
