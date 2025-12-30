'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { UserRole } from '@/types';

interface PanCommissionConfig {
  id: string;
  service_type: 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN';
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PanCommissionPage() {
  const { data: session } = useSession();
  const [configs, setConfigs] = useState<PanCommissionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PanCommissionConfig | null>(null);
  const [formData, setFormData] = useState({
    service_type: 'NEW_PAN' as 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN',
    price: 0,
    is_active: true
  });

  // InsPay Wallet Balance State
  const [inspayBalance, setInspayBalance] = useState<number | null>(null);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [balanceFetchedAt, setBalanceFetchedAt] = useState<string | null>(null);

  // Fetch configurations
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/pan-commission');
      const data = await response.json();

      if (data.success) {
        setConfigs(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch configurations');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchConfigs();
    }
  }, [session]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingConfig ? 'PUT' : 'POST';
      const body = editingConfig
        ? { ...formData, id: editingConfig.id }
        : formData;

      const response = await fetch('/api/admin/pan-commission', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setEditingConfig(null);
        setFormData({
          service_type: 'NEW_PAN',
          price: 0,
          is_active: true
        });
        fetchConfigs();
      } else {
        toast.error(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (config: PanCommissionConfig) => {
    setEditingConfig(config);
    setFormData({
      service_type: config.service_type,
      price: config.price,
      is_active: config.is_active
    });
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pan-commission?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchConfigs();
      } else {
        toast.error(data.message || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingConfig(null);
    setFormData({
      service_type: 'NEW_PAN',
      price: 0,
      is_active: true
    });
  };

  // Fetch InsPay Wallet Balance
  const fetchInspayBalance = async () => {
    setFetchingBalance(true);
    try {
      const response = await fetch('/api/admin/inspay-balance');
      const data = await response.json();

      if (data.success) {
        setInspayBalance(data.data.balance);
        setBalanceFetchedAt(data.data.fetchedAt);
        toast.success('PAN wallet balance fetched successfully');
      } else {
        toast.error(data.message || 'Failed to fetch PAN balance');
      }
    } catch (error) {
      console.error('Error fetching PAN balance:', error);
      toast.error('Failed to fetch PAN balance');
    } finally {
      setFetchingBalance(false);
    }
  };

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'NEW_PAN': return 'New PAN Application';
      case 'PAN_CORRECTION': return 'PAN Correction';
      case 'INCOMPLETE_PAN': return 'Incomplete PAN Resume';
      default: return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PAN Service Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure pricing for PAN card services
          </p>
        </div>

        {/* InsPay API Wallet Balance Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              PAN API Wallet Balance
            </CardTitle>
            <CardDescription>
              View your current PAN API wallet balance for PAN services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                  {inspayBalance !== null ? (
                    <div>
                      <p className="text-4xl font-bold text-blue-600">
                        ₹{inspayBalance.toFixed(2)}
                      </p>
                      {balanceFetchedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last fetched: {new Date(balanceFetchedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-400">
                      Click button to fetch balance
                    </p>
                  )}
                </div>
                <Button
                  onClick={fetchInspayBalance}
                  disabled={fetchingBalance}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {fetchingBalance ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Fetching...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔄</span>
                      Fetch Balance
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Balance is fetched manually to avoid rate limiting.
                  Click the "Fetch Balance" button to get the latest balance from PAN API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
            </CardTitle>
            <CardDescription>
              Set the price for PAN services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_type">Service Type</Label>
                  <select
                    id="service_type"
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={!!editingConfig}
                  >
                    <option value="NEW_PAN">New PAN Application</option>
                    <option value="PAN_CORRECTION">PAN Correction</option>
                    <option value="INCOMPLETE_PAN">Incomplete PAN Resume</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter service price"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingConfig ? 'Update Configuration' : 'Add Configuration'}
                </Button>
                {editingConfig && (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Existing Configurations */}
        <Card>
          <CardHeader>
            <CardTitle>Current Configurations</CardTitle>
            <CardDescription>
              Manage existing PAN service configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading configurations...</p>
              </div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No configurations found. Add your first configuration above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Service Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Price (₹)</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((config) => (
                      <tr key={config.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">
                          {getServiceTypeLabel(config.service_type)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          ₹{config.price.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(config)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(config.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Configuration Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong>Service Types:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li><strong>New PAN Application:</strong> For first-time PAN card applications</li>
                  <li><strong>PAN Correction:</strong> For updating existing PAN card details</li>
                  <li><strong>Incomplete PAN Resume:</strong> For resuming incomplete PAN applications</li>
                </ul>
              </div>
              <div>
                <strong>Pricing:</strong> Set the amount charged to customers for each service type.
              </div>
              <div>
                <strong>Status:</strong> Only active configurations will be available for use in the system.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}