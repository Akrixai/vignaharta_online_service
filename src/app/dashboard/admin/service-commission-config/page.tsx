'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';

interface ServiceCommissionConfig {
  id: string;
  service_type: string;
  service_display_name: string;
  retailer_commission_amount: number;
  retailer_commission_enabled: boolean;
  customer_cashback_amount: number;
  customer_cashback_enabled: boolean;
  min_transaction_amount: number;
  max_transaction_amount: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SERVICE_ICONS: Record<string, string> = {
  'GAS': '🔥',
  'Water': '💧',
  'Insurance': '🛡️',
  'Broadband': '🌐',
  'Landline': '☎️',
  'DataCard': '📶',
  'FASTag': '🛣️',
  'CableTV': '📺',
  'CreditCard': '💳'
};

export default function ServiceCommissionConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [configs, setConfigs] = useState<ServiceCommissionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingConfigs, setEditingConfigs] = useState<Record<string, ServiceCommissionConfig>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/service-commission-config');
      const data = await response.json();

      if (data.success) {
        setConfigs(data.data);
        // Initialize editing configs
        const editingData: Record<string, ServiceCommissionConfig> = {};
        data.data.forEach((config: ServiceCommissionConfig) => {
          editingData[config.id] = { ...config };
        });
        setEditingConfigs(editingData);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (configId: string, field: keyof ServiceCommissionConfig, value: any) => {
    setEditingConfigs(prev => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        [field]: value
      }
    }));
  };

  const saveAllConfigs = async () => {
    setSaving(true);
    setMessage('');

    try {
      const configsToUpdate = Object.values(editingConfigs);
      
      const response = await fetch('/api/admin/service-commission-config/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configs: configsToUpdate
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        await fetchConfigs(); // Refresh data
      } else {
        setMessage(`❌ ${data.message}`);
        if (data.data?.errors) {
          console.error('Update errors:', data.data.errors);
        }
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    const editingData: Record<string, ServiceCommissionConfig> = {};
    configs.forEach((config) => {
      editingData[config.id] = { ...config };
    });
    setEditingConfigs(editingData);
    setMessage('🔄 Changes reset to original values');
  };

  const hasChanges = () => {
    return configs.some(config => {
      const editing = editingConfigs[config.id];
      if (!editing) return false;
      
      return (
        editing.retailer_commission_amount !== config.retailer_commission_amount ||
        editing.retailer_commission_enabled !== config.retailer_commission_enabled ||
        editing.customer_cashback_amount !== config.customer_cashback_amount ||
        editing.customer_cashback_enabled !== config.customer_cashback_enabled ||
        editing.min_transaction_amount !== config.min_transaction_amount ||
        editing.max_transaction_amount !== config.max_transaction_amount ||
        editing.description !== config.description ||
        editing.is_active !== config.is_active
      );
    });
  };

  if (status === 'loading' || !session) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">💰 Service Commission & Cashback Configuration</h1>
            <p className="text-gray-600 mt-2">Configure commission and cashback rates for different service types (in INR)</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={resetChanges}
              disabled={!hasChanges() || saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              🔄 Reset Changes
            </button>
            <button
              onClick={saveAllConfigs}
              disabled={!hasChanges() || saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? 'Saving...' : '💾 Save All Changes'}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.includes('✅')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.includes('🔄')
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Changes Indicator */}
        {hasChanges() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              <span className="text-yellow-800 font-medium">You have unsaved changes</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {configs.map((config) => {
              const editing = editingConfigs[config.id] || config;
              const hasConfigChanges = JSON.stringify(editing) !== JSON.stringify(config);

              return (
                <div
                  key={config.id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-200 ${
                    hasConfigChanges 
                      ? 'border-yellow-300 shadow-yellow-100' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Service Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{SERVICE_ICONS[config.service_type] || '⚙️'}</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{config.service_display_name}</h3>
                        <span className="text-sm text-gray-500">{config.service_type}</span>
                      </div>
                    </div>
                    {hasConfigChanges && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Modified
                      </span>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="mb-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editing.is_active}
                        onChange={(e) => handleConfigChange(config.id, 'is_active', e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Service Active</span>
                    </label>
                  </div>

                  {/* Retailer Commission */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💼 Retailer Commission (₹)
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editing.retailer_commission_enabled}
                          onChange={(e) => handleConfigChange(config.id, 'retailer_commission_enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Enable Commission</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editing.retailer_commission_amount}
                          onChange={(e) => handleConfigChange(config.id, 'retailer_commission_amount', parseFloat(e.target.value) || 0)}
                          disabled={!editing.retailer_commission_enabled}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Cashback */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎁 Customer Cashback (₹)
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editing.customer_cashback_enabled}
                          onChange={(e) => handleConfigChange(config.id, 'customer_cashback_enabled', e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-600">Enable Cashback</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editing.customer_cashback_amount}
                          onChange={(e) => handleConfigChange(config.id, 'customer_cashback_amount', parseFloat(e.target.value) || 0)}
                          disabled={!editing.customer_cashback_enabled}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transaction Limits */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💰 Transaction Limits (₹)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={editing.min_transaction_amount}
                            onChange={(e) => handleConfigChange(config.id, 'min_transaction_amount', parseFloat(e.target.value) || 1)}
                            className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={editing.max_transaction_amount}
                            onChange={(e) => handleConfigChange(config.id, 'max_transaction_amount', parseFloat(e.target.value) || 50000)}
                            className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Description
                    </label>
                    <textarea
                      value={editing.description}
                      onChange={(e) => handleConfigChange(config.id, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional description..."
                    />
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    Last updated: {new Date(config.updated_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">ℹ️ Configuration Information</h3>
          <ul className="text-blue-700 text-sm space-y-2">
            <li>• <strong>Commission & Cashback:</strong> Set fixed amounts in Indian Rupees (₹) instead of percentages</li>
            <li>• <strong>Transaction Limits:</strong> Commission/cashback will only apply to transactions within the specified range</li>
            <li>• <strong>Enable/Disable:</strong> You can individually control commission and cashback for each service</li>
            <li>• <strong>Service Active:</strong> Inactive services won't be available for transactions</li>
            <li>• <strong>Bulk Update:</strong> All changes are saved together when you click "Save All Changes"</li>
            <li>• <strong>Audit Trail:</strong> All changes are logged for compliance and tracking</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}