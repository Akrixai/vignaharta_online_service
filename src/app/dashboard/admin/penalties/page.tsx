'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Search, AlertTriangle, DollarSign, User } from 'lucide-react';

interface Penalty {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  description: string;
  penalty_type: string;
  status: string;
  applied_at: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function PenaltiesPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    description: '',
    penalty_type: 'GENERAL'
  });

  useEffect(() => {
    fetchPenalties();
  }, []);

  const fetchPenalties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/penalties');
      const data = await response.json();
      
      if (data.success) {
        setPenalties(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch penalties');
      }
    } catch (error) {
      console.error('Error fetching penalties:', error);
      toast.error('Failed to fetch penalties');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleApplyPenalty = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      setApplying(true);

      const response = await fetch('/api/admin/penalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount: parseFloat(formData.amount),
          reason: formData.reason,
          description: formData.description,
          penalty_type: formData.penalty_type
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Penalty applied successfully! Email sent to ${selectedUser.email}`);
        setShowApplyForm(false);
        setSelectedUser(null);
        setFormData({
          amount: '',
          reason: '',
          description: '',
          penalty_type: 'GENERAL'
        });
        setSearchQuery('');
        setSearchResults([]);
        fetchPenalties();
      } else {
        toast.error(data.error || 'Failed to apply penalty');
      }
    } catch (error) {
      console.error('Error applying penalty:', error);
      toast.error('Failed to apply penalty');
    } finally {
      setApplying(false);
    }
  };

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Penalty Management</h1>
            <p className="text-gray-600 mt-1">Apply and manage user penalties</p>
          </div>
          <Button
            onClick={() => setShowApplyForm(!showApplyForm)}
            className="bg-red-600 hover:bg-red-700"
          >
            {showApplyForm ? '✕ Cancel' : '⚠️ Apply Penalty'}
          </Button>
        </div>

        {/* Apply Penalty Form */}
        {showApplyForm && (
          <Card className="border-2 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-900">Apply New Penalty</CardTitle>
              <CardDescription>Deduct amount from user wallet and send notification</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleApplyPenalty} className="space-y-4">
                {/* User Search */}
                <div>
                  <Label htmlFor="userSearch">Search User *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="userSearch"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      placeholder="Search by name, email, or phone..."
                      className="pl-10"
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery(user.name);
                            setSearchResults([]);
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">
                            {user.role} • Wallet: ₹{user.wallet_balance || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected User */}
                  {selectedUser && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-blue-900">{selectedUser.name}</div>
                          <div className="text-sm text-blue-700">{selectedUser.email}</div>
                          <div className="text-xs text-blue-600 mt-1">
                            Wallet Balance: ₹{selectedUser.wallet_balance || 0}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(null);
                            setSearchQuery('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Penalty Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="penalty_type">Penalty Type *</Label>
                    <Select
                      value={formData.penalty_type}
                      onValueChange={(value) => setFormData({ ...formData, penalty_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="POLICY_VIOLATION">Policy Violation</SelectItem>
                        <SelectItem value="FRAUD">Fraud</SelectItem>
                        <SelectItem value="MISCONDUCT">Misconduct</SelectItem>
                        <SelectItem value="LATE_PAYMENT">Late Payment</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason (Short) *</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Brief reason for penalty"
                    required
                    maxLength={255}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide detailed explanation (will be included in email)"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowApplyForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={applying || !selectedUser}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {applying ? 'Applying...' : '⚠️ Apply Penalty'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Penalties List */}
        <Card>
          <CardHeader>
            <CardTitle>Penalty History</CardTitle>
            <CardDescription>All applied penalties</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading penalties...</p>
              </div>
            ) : penalties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No penalties applied yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {penalties.map((penalty) => (
                      <tr key={penalty.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{penalty.user.name}</div>
                          <div className="text-xs text-gray-500">{penalty.user.email}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-red-600">
                          -₹{penalty.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{penalty.reason}</div>
                          {penalty.description && (
                            <div className="text-xs text-gray-500 mt-1">{penalty.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                            {penalty.penalty_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            penalty.status === 'APPLIED' ? 'bg-red-100 text-red-800' :
                            penalty.status === 'REVERSED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {penalty.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(penalty.applied_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
