'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface WalletData {
  balance: number;
  plan_credit: number;
  available_balance: number;
  currency: string;
  last_updated: string;
}

interface KwikAPITransaction {
  trx_id: string;
  your_id: string | null;
  number: string;
  number2: string | null;
  ref_id: string;
  amount: number;
  charged_amount: number;
  date: string;
  status: string;
  service: string;
  profit: number;
}

interface TransactionSummary {
  total_transactions: number;
  total_amount: number;
  total_charged: number;
  total_profit: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
  reversal_count: number;
  refunded_count: number;
  credit_count: number;
}

export default function KWIKAPIWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<KwikAPITransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  
  // Filter states
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchWalletBalance();
    fetchTransactions();
  }, []);

  const fetchWalletBalance = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/recharge/wallet-balance');
      const data = await res.json();

      if (data.success) {
        setWalletData(data.data);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    setTransactionMessage('');

    try {
      let url = '/api/admin/kwikapi-transactions?limit=100';
      if (serviceFilter) url += `&service_type=${encodeURIComponent(serviceFilter)}`;
      if (dateFrom) url += `&from_date=${dateFrom}`;
      if (dateTo) url += `&to_date=${dateTo}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.data.transactions);
        setSummary(data.data.summary);
        setTransactionMessage(`✅ Loaded ${data.data.transactions.length} transactions`);
      } else {
        setTransactionMessage(`❌ ${data.error}`);
      }
    } catch (error: any) {
      setTransactionMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const syncOperators = async () => {
    setSyncing(true);
    setMessage('');

    try {
      const res = await fetch('/api/recharge/sync-all-operators', {
        method: 'POST',
      });

      const text = await res.text();
      console.log('Raw response:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setMessage(`❌ Server returned invalid response: ${text.substring(0, 200)}`);
        return;
      }

      if (data.success) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.message || 'Unknown error'}`);
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REVERSAL': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'REFUNDED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CREDIT': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS': return '✅';
      case 'FAILED': return '❌';
      case 'PENDING': return '⏳';
      case 'REVERSAL': return '🔄';
      case 'REFUNDED': return '💰';
      case 'CREDIT': return '💳';
      default: return '❓';
    }
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
          <h1 className="text-3xl font-bold text-gray-800">💰 KWIKAPI Wallet & Transactions</h1>
          <div className="flex space-x-3">
            <button
              onClick={fetchTransactions}
              disabled={loadingTransactions}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loadingTransactions ? 'Loading...' : '📊 Refresh Transactions'}
            </button>
            <button
              onClick={fetchWalletBalance}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Wallet'}
            </button>
          </div>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Wallet Balance</span>
              <span className="text-2xl">💳</span>
            </div>
            <div className="text-3xl font-bold">
              {walletData ? `₹${walletData.balance.toFixed(2)}` : '---'}
            </div>
            <div className="text-xs opacity-75 mt-2">
              {walletData?.currency || 'INR'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Plan Credit</span>
              <span className="text-2xl">🎁</span>
            </div>
            <div className="text-3xl font-bold">
              {walletData ? `₹${walletData.plan_credit.toFixed(2)}` : '---'}
            </div>
            <div className="text-xs opacity-75 mt-2">
              Bonus/Credit
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Available Balance</span>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold">
              {walletData ? `₹${walletData.available_balance.toFixed(2)}` : '---'}
            </div>
            <div className="text-xs opacity-75 mt-2">
              Usable Amount
            </div>
          </div>
        </div>

        {/* Transaction Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-blue-600">{summary.total_transactions}</div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-600">{summary.success_count}</div>
              <div className="text-sm text-gray-600">Success</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="text-2xl font-bold text-red-600">{summary.failed_count}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <div className="text-2xl font-bold text-yellow-600">{summary.pending_count}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <div className="text-2xl font-bold text-orange-600">{summary.reversal_count}</div>
              <div className="text-sm text-gray-600">Reversals</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.total_profit)}</div>
              <div className="text-sm text-gray-600">Total Profit</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Transaction Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Services</option>
                <option value="MSEDC MAHARASHTRA">MSEDC MAHARASHTRA</option>
                <option value="Airtel">Airtel</option>
                <option value="Reliance Jio">Reliance Jio</option>
                <option value="TATA SKY DTH">TATA SKY DTH</option>
                <option value="WALLET">WALLET</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
                <option value="REVERSAL">Reversal</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchTransactions}
              disabled={loadingTransactions}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loadingTransactions ? 'Filtering...' : '🔍 Apply Filters'}
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">📊 Recent Transactions</h2>
            {transactionMessage && (
              <div className={`mt-2 text-sm ${transactionMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {transactionMessage}
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charged</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                        Loading transactions...
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-4">📊</div>
                      <div>No transactions found</div>
                      <div className="text-sm">Try adjusting your filters or check back later</div>
                    </td>
                  </tr>
                ) : (
                  transactions
                    .filter(t => !statusFilter || t.status === statusFilter)
                    .map((transaction) => (
                    <tr key={transaction.trx_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{transaction.trx_id}</div>
                        <div className="text-xs text-gray-500">Ref: {transaction.ref_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.service}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.number}</div>
                        {transaction.number2 && (
                          <div className="text-xs text-gray-500">{transaction.number2}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(transaction.charged_amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${transaction.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.profit >= 0 ? '+' : ''}{formatCurrency(transaction.profit)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                          <span className="mr-1">{getStatusIcon(transaction.status)}</span>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(transaction.date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operator Sync Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔄 Operator Synchronization</h2>
          <p className="text-gray-600 mb-4">
            Sync all operators from KWIKAPI to your database. This will fetch the latest operator list
            including prepaid, postpaid, DTH, and electricity providers.
          </p>
          <button
            onClick={syncOperators}
            disabled={syncing}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing Operators...' : '🔄 Sync All Operators'}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-8 ${
              message.includes('✅')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Last Updated */}
        {walletData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Wallet Last Updated:</span>
              <span className="text-sm font-medium text-gray-800">
                {new Date(walletData.last_updated).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Local Transactions</h3>
            <p className="text-gray-600 mb-4 text-sm">
              View all recharge transactions processed through your system
            </p>
            <button
              onClick={() => router.push('/dashboard/recharge/transactions')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Local Transactions
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">⚙️ Operator Management</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Manage operators, commission rates, and settings
            </p>
            <button
              onClick={() => router.push('/dashboard/admin/recharge-config')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Manage Operators
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">ℹ️ KWIKAPI Integration Information</h3>
          <ul className="text-blue-700 text-sm space-y-2">
            <li>• <strong>Wallet Balance:</strong> Your main KWIKAPI wallet balance</li>
            <li>• <strong>Plan Credit:</strong> Bonus or promotional credits</li>
            <li>• <strong>Available Balance:</strong> Total usable amount for transactions</li>
            <li>• <strong>Transactions:</strong> Real-time data from KWIKAPI servers</li>
            <li>• <strong>Profit:</strong> Difference between amount and charged amount</li>
            <li>• Ensure sufficient balance before processing recharges</li>
            <li>• Contact KWIKAPI support to add funds to your wallet</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
