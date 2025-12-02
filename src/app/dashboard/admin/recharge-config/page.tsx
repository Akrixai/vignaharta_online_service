'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type ServiceType = 'PREPAID' | 'POSTPAID' | 'DTH' | 'ELECTRICITY';

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
  service_type: string;
  commission_rate: number;
  cashback_enabled: boolean;
  cashback_min_percentage: number;
  cashback_max_percentage: number;
  is_active: boolean;
  min_amount: number;
  max_amount: number;
}

import DashboardLayout from '@/components/dashboard/layout';

export default function RechargeConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [serviceType, setServiceType] = useState<ServiceType>('PREPAID');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingOperator, setEditingOperator] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchOperators();
  }, [serviceType]);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recharge-config?service_type=${serviceType}`);
      const data = await res.json();
      if (data.success) {
        // Filter operators based on service type
        let filteredOperators = data.data;
        
        // For PREPAID, only show mobile operators (exclude DATACARD)
        if (serviceType === 'PREPAID') {
          filteredOperators = data.data.filter((op: Operator) => {
            // Exclude operators with DATACARD-related names
            const name = op.operator_name.toUpperCase();
            return !name.includes('DATACARD') && 
                   !name.includes('MBLAZE') && 
                   !name.includes('MBROWSE') && 
                   !name.includes('NETCONNECT') && 
                   !name.includes('PHOTON');
          });
        }
        
        setOperators(filteredOperators);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOperator = async (operator: Operator) => {
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/recharge-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: operator.id,
          commission_rate: operator.commission_rate,
          cashback_enabled: operator.cashback_enabled,
          cashback_min_percentage: operator.cashback_min_percentage,
          cashback_max_percentage: operator.cashback_max_percentage,
          is_active: operator.is_active,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage('✅ Configuration updated successfully');
        setEditingOperator(null);
        fetchOperators();
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const bulkUpdate = async () => {
    const commissionRate = prompt('Enter commission rate for all operators (%):', '2.0');
    if (!commissionRate) return;

    const cashbackMin = prompt('Enter minimum cashback percentage (%):', '0.5');
    if (!cashbackMin) return;

    const cashbackMax = prompt('Enter maximum cashback percentage (%):', '2.0');
    if (!cashbackMax) return;

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/recharge-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          commission_rate: parseFloat(commissionRate),
          cashback_enabled: true,
          cashback_min_percentage: parseFloat(cashbackMin),
          cashback_max_percentage: parseFloat(cashbackMax),
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        fetchOperators();
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOperatorChange = (id: string, field: keyof Operator, value: any) => {
    setOperators(operators.map(op => 
      op.id === id ? { ...op, [field]: value } : op
    ));
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Recharge Commission & Cashback Configuration</h1>
        <button
          onClick={bulkUpdate}
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
        >
          Bulk Update {serviceType}
        </button>
      </div>

      {/* Service Type Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(['PREPAID', 'POSTPAID', 'DTH', 'ELECTRICITY'] as ServiceType[]).map((type) => (
          <button
            key={type}
            onClick={() => setServiceType(type)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              serviceType === type
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Operators Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading operators...</div>
        ) : operators.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No operators found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashback Enabled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashback Min (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashback Max (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {operators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{operator.operator_name}</div>
                      <div className="text-xs text-gray-500">{operator.operator_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={operator.is_active}
                          onChange={(e) => handleOperatorChange(operator.id, 'is_active', e.target.checked)}
                          disabled={editingOperator !== operator.id}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className={`ml-2 text-sm ${operator.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {operator.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.1"
                        value={operator.commission_rate}
                        onChange={(e) => handleOperatorChange(operator.id, 'commission_rate', parseFloat(e.target.value))}
                        disabled={editingOperator !== operator.id}
                        className="w-20 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={operator.cashback_enabled}
                        onChange={(e) => handleOperatorChange(operator.id, 'cashback_enabled', e.target.checked)}
                        disabled={editingOperator !== operator.id}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.1"
                        value={operator.cashback_min_percentage}
                        onChange={(e) => handleOperatorChange(operator.id, 'cashback_min_percentage', parseFloat(e.target.value))}
                        disabled={editingOperator !== operator.id || !operator.cashback_enabled}
                        className="w-20 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.1"
                        value={operator.cashback_max_percentage}
                        onChange={(e) => handleOperatorChange(operator.id, 'cashback_max_percentage', parseFloat(e.target.value))}
                        disabled={editingOperator !== operator.id || !operator.cashback_enabled}
                        className="w-20 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {editingOperator === operator.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateOperator(operator)}
                            disabled={saving}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingOperator(null);
                              fetchOperators();
                            }}
                            disabled={saving}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingOperator(operator.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Configuration Guide</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li><strong>Commission Rate:</strong> Percentage of recharge amount given to retailers as commission</li>
          <li><strong>Cashback Enabled:</strong> Whether customers receive cashback on this operator</li>
          <li><strong>Cashback Min/Max:</strong> Random cashback percentage range for customers (e.g., 0.5% to 2.0%)</li>
          <li><strong>Status:</strong> Enable/disable operator for recharge operations</li>
          <li><strong>Bulk Update:</strong> Apply same rates to all operators in selected service type</li>
        </ul>
      </div>
    </div>
    </DashboardLayout>
  );
}
