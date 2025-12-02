'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
  service_type: string;
  min_amount: number;
  max_amount: number;
  commission_rate: number;
  is_active: boolean;
}

export default function RechargeConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filterService, setFilterService] = useState('');
  const [electricityCommission, setElectricityCommission] = useState('1.0');
  const [savingGlobal, setSavingGlobal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchOperators();
    }
  }, [status, router]);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/recharge-config');
      const data = await res.json();
      
      if (data.success) {
        setOperators(data.data);
        // Get global electricity commission
        const globalConfig = data.globalConfig;
        if (globalConfig?.electricity_commission_rate) {
          setElectricityCommission(globalConfig.electricity_commission_rate);
        }
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGlobalElectricityCommission = async () => {
    setSavingGlobal(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/recharge-config/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_key: 'electricity_commission_rate',
          config_value: electricityCommission,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ Global electricity commission updated successfully');
        // Update all electricity operators with new rate
        fetchOperators();
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSavingGlobal(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateOperator = async (operatorId: string, updates: Partial<Operator>) => {
    setSaving(operatorId);
    setMessage('');

    try {
      const res = await fetch('/api/admin/recharge-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: operatorId,
          ...updates,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ Configuration updated successfully');
        fetchOperators();
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCommissionChange = (operatorId: string, value: string) => {
    const commission = parseFloat(value);
    if (!isNaN(commission) && commission >= 0 && commission <= 100) {
      setOperators(prev =>
        prev.map(op =>
          op.id === operatorId ? { ...op, commission_rate: commission } : op
        )
      );
    }
  };

  const handleMinAmountChange = (operatorId: string, value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      setOperators(prev =>
        prev.map(op =>
          op.id === operatorId ? { ...op, min_amount: amount } : op
        )
      );
    }
  };

  const handleMaxAmountChange = (operatorId: string, value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      setOperators(prev =>
        prev.map(op =>
          op.id === operatorId ? { ...op, max_amount: amount } : op
        )
      );
    }
  };

  const toggleActive = async (operatorId: string, currentStatus: boolean) => {
    await updateOperator(operatorId, { is_active: !currentStatus });
  };

  // Exclude electricity operators from individual configuration (they use global config)
  const nonElectricityOperators = operators.filter(op => op.service_type !== 'ELECTRICITY');
  
  const filteredOperators = filterService
    ? nonElectricityOperators.filter(op => op.service_type === filterService)
    : nonElectricityOperators;

  const groupedOperators = filteredOperators.reduce((acc, op) => {
    if (!acc[op.service_type]) {
      acc[op.service_type] = [];
    }
    acc[op.service_type].push(op);
    return acc;
  }, {} as Record<string, Operator[]>);

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Recharge Commission Configuration</h1>
          <p className="text-gray-600 mt-2">Manage commission rates and limits for all operators</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Global Electricity Commission */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <span className="text-2xl mr-2">⚡</span>
              Global Electricity Commission Rate
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set a single commission rate that applies to all electricity bill payments
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={electricityCommission}
                  onChange={(e) => setElectricityCommission(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-32 px-4 py-2 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-500 font-semibold text-lg"
                  disabled={savingGlobal}
                />
                <span className="text-lg font-semibold text-gray-700">%</span>
              </div>
              <button
                onClick={updateGlobalElectricityCommission}
                disabled={savingGlobal}
                className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {savingGlobal ? 'Saving...' : 'Update Global Rate'}
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Example Earnings</div>
            <div className="text-2xl font-bold text-yellow-600">
              ₹{((1500 * parseFloat(electricityCommission || '0')) / 100).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">on ₹1500 bill</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Service Type
        </label>
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Services (Excluding Electricity)</option>
          <option value="PREPAID">Prepaid</option>
          <option value="POSTPAID">Postpaid</option>
          <option value="DTH">DTH</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          ⚡ Electricity operators use the global commission rate configured above
        </p>
      </div>

      {/* Operators by Service Type */}
      {Object.entries(groupedOperators).map(([serviceType, ops]) => (
        <div key={serviceType} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-3">
              {serviceType === 'PREPAID' && '📱'}
              {serviceType === 'POSTPAID' && '📞'}
              {serviceType === 'DTH' && '📺'}
              {serviceType === 'ELECTRICITY' && '⚡'}
            </span>
            {serviceType}
          </h2>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Operator
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Commission Rate (%)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Min Amount (₹)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Max Amount (₹)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ops.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{operator.operator_name}</div>
                        <div className="text-xs text-gray-500">{operator.operator_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={operator.commission_rate}
                          onChange={(e) => handleCommissionChange(operator.id, e.target.value)}
                          onBlur={() => updateOperator(operator.id, { commission_rate: operator.commission_rate })}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={saving === operator.id}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={operator.min_amount}
                          onChange={(e) => handleMinAmountChange(operator.id, e.target.value)}
                          onBlur={() => updateOperator(operator.id, { min_amount: operator.min_amount })}
                          min="0"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={saving === operator.id}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={operator.max_amount}
                          onChange={(e) => handleMaxAmountChange(operator.id, e.target.value)}
                          onBlur={() => updateOperator(operator.id, { max_amount: operator.max_amount })}
                          min="0"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={saving === operator.id}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          operator.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {operator.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(operator.id, operator.is_active)}
                          disabled={saving === operator.id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            operator.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {saving === operator.id ? 'Saving...' : operator.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Info Panel */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Commission Configuration Guide</h3>
        <ul className="text-blue-700 text-sm space-y-2">
          <li>• <strong>Commission Rate:</strong> Percentage earned by retailers/customers on each transaction (0-100%)</li>
          <li>• <strong>Min Amount:</strong> Minimum recharge/bill payment amount allowed</li>
          <li>• <strong>Max Amount:</strong> Maximum recharge/bill payment amount allowed</li>
          <li>• <strong>Status:</strong> Enable/disable operators for transactions</li>
          <li>• Changes are saved automatically when you move to the next field</li>
          <li>• Commission is calculated as: (Transaction Amount × Commission Rate) / 100</li>
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Total Operators</div>
          <div className="text-3xl font-bold">{nonElectricityOperators.length}</div>
          <div className="text-xs opacity-75 mt-1">Excluding Electricity</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Active Operators</div>
          <div className="text-3xl font-bold">
            {nonElectricityOperators.filter(op => op.is_active).length}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Avg Commission</div>
          <div className="text-3xl font-bold">
            {nonElectricityOperators.length > 0 ? (nonElectricityOperators.reduce((sum, op) => sum + op.commission_rate, 0) / nonElectricityOperators.length).toFixed(1) : '0.0'}%
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Service Types</div>
          <div className="text-3xl font-bold">
            {Object.keys(groupedOperators).length}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
