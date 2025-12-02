'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';

interface WalletData {
  balance: number;
  plan_credit: number;
  available_balance: number;
  currency: string;
  last_updated: string;
}

export default function KWIKAPIWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchWalletBalance();
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

  const syncOperators = async () => {
    setSyncing(true);
    setMessage('');

    try {
      const res = await fetch('/api/recharge/sync-all-operators', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSyncing(false);
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">💰 KWIKAPI Wallet Management</h1>
          <button
            onClick={fetchWalletBalance}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Wallet Balance Card */}
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

        {/* Last Updated */}
        {walletData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="text-sm font-medium text-gray-800">
                {new Date(walletData.last_updated).toLocaleString()}
              </span>
            </div>
          </div>
        )}

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

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.includes('✅')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">ℹ️ KWIKAPI Wallet Information</h3>
          <ul className="text-blue-700 text-sm space-y-2">
            <li>• <strong>Wallet Balance:</strong> Your main KWIKAPI wallet balance</li>
            <li>• <strong>Plan Credit:</strong> Bonus or promotional credits</li>
            <li>• <strong>Available Balance:</strong> Total usable amount for transactions</li>
            <li>• Ensure sufficient balance before processing recharges</li>
            <li>• Contact KWIKAPI support to add funds to your wallet</li>
            <li>• Balance is updated in real-time from KWIKAPI servers</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Transaction History</h3>
            <p className="text-gray-600 mb-4 text-sm">
              View all recharge transactions processed through KWIKAPI
            </p>
            <button
              onClick={() => router.push('/dashboard/recharge/transactions')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Transactions
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

        {/* API Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔌 API Configuration</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Base URL:</span>
              <span className="text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_KWIKAPI_BASE_URL || 'https://www.kwikapi.com'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">API Key:</span>
              <span className="text-sm text-gray-600 font-mono">
                {process.env.KWIKAPI_API_KEY ? '••••••••••••' : 'Not Configured'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`text-sm font-semibold ${walletData ? 'text-green-600' : 'text-red-600'}`}>
                {walletData ? '✅ Connected' : '❌ Not Connected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
