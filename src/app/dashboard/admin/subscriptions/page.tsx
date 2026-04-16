'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { UserRole } from '@/types';
import { toast } from 'react-hot-toast';

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: '1 Month',
  QUARTERLY: '3 Months',
  HALF_YEARLY: '6 Months',
  YEARLY: '12 Months (Yearly)',
};

const PERIOD_ICONS: Record<string, string> = {
  MONTHLY: '📅',
  QUARTERLY: '🗓️',
  HALF_YEARLY: '📆',
  YEARLY: '🏆',
};

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    billing_period: 'MONTHLY',
    amount: '',
    is_active: true,
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Fetch all plans including inactive for admin
      const res = await fetch('/api/subscriptions/plans');
      const data = await res.json();
      if (data.success) setPlans(data.plans || []);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  if (status === 'loading') return <DashboardLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div></div></DashboardLayout>;
  if (!session || session.user.role !== UserRole.ADMIN) {
    return <DashboardLayout><div className="text-center py-12"><h1 className="text-2xl font-bold text-red-600">Access Denied</h1></div></DashboardLayout>;
  }

  const openAdd = () => {
    setEditingPlan(null);
    setFormData({ name: '', description: '', billing_period: 'MONTHLY', amount: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      billing_period: plan.billing_period,
      amount: plan.amount.toString(),
      is_active: plan.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      toast.error('Name and amount are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingPlan
        ? `/api/subscriptions/plans/${editingPlan.id}`
        : '/api/subscriptions/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingPlan ? 'Plan updated!' : 'Plan created!');
        setShowForm(false);
        fetchPlans();
      } else {
        toast.error(data.error || 'Failed to save plan');
      }
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription plan?')) return;
    try {
      const res = await fetch(`/api/subscriptions/plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Plan deleted');
        fetchPlans();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  const toggleActive = async (plan: any) => {
    try {
      const res = await fetch(`/api/subscriptions/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Plan ${!plan.is_active ? 'activated' : 'deactivated'}`);
        fetchPlans();
      }
    } catch {
      toast.error('Failed to update plan');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-2">💎 Subscription Plans</h1>
          <p className="text-purple-100 text-lg">
            Manage subscription plans for users. Subscribers get discounted service prices.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-blue-800">How Subscriptions Work</p>
            <p className="text-blue-700 text-sm mt-1">
              Users purchase a subscription plan using their wallet balance. Once subscribed, they see the
              <strong> subscription price</strong> (set per service in Manage Services) instead of the regular price.
              If no subscription price is set for a service, they pay the regular price regardless of subscription status.
            </p>
          </div>
        </div>

        {/* Add Plan Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Plans ({plans.length})</h2>
          <button
            onClick={openAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            ➕ Add Plan
          </button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all ${
                  plan.is_active ? 'border-purple-200' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className={`p-5 ${plan.is_active ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gray-400'} text-white`}>
                  <div className="text-3xl mb-2">{PERIOD_ICONS[plan.billing_period] || '📋'}</div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-purple-100 text-sm mt-1">{PERIOD_LABELS[plan.billing_period]}</p>
                </div>
                <div className="p-5">
                  <div className="text-3xl font-black text-gray-900 mb-1">₹{parseFloat(plan.amount).toFixed(0)}</div>
                  <p className="text-gray-500 text-sm mb-4">{plan.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {plan.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(plan)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-medium transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => toggleActive(plan)}
                      className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
                        plan.is_active
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {plan.is_active ? '⏸️ Disable' : '▶️ Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {plans.length === 0 && (
              <div className="col-span-4 text-center py-16 bg-white rounded-2xl border border-gray-200">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-xl font-bold text-gray-700">No plans yet</h3>
                <p className="text-gray-500 mt-2">Click "Add Plan" to create your first subscription plan.</p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100000] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 rounded-t-2xl text-white">
                <h2 className="text-2xl font-bold">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. Monthly Plan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Billing Period *</label>
                  <select
                    value={formData.billing_period}
                    onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="MONTHLY">Monthly (1 Month)</option>
                    <option value="QUARTERLY">Quarterly (3 Months)</option>
                    <option value="HALF_YEARLY">Half Yearly (6 Months)</option>
                    <option value="YEARLY">Yearly (12 Months)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="299"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description of this plan"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active (visible to users)</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingPlan ? '💾 Update Plan' : '➕ Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
