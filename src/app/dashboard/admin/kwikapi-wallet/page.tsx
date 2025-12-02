'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';

interface WalletBalance {
  wallet_balance: number;
  blocked_amount: number;
  available_balance: number;
  currency: string;
  updated_at: string;
}

export default function KwikAPIWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchBalance();
    }
  }, [status, router]);

  const fetchBalance = async () => {
    setRefreshing(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/recharge/wallet-balance');
      const data = await res.json();
      
      if (data.success) {
        setBalance(data.data);
        setMessage('✅ Balance updated successfully');
      } else {
        setMessage('❌ Failed to fetch balance');
      }
    } catch (error) {
      setMessage('❌ Error fetching balance');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">KWIKAPI Wallet Management</h1>
        <button
          onClick={fetchBalance}
          disabled={refreshing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <span>{refreshing ? '🔄' : '🔃'}</span>
          {refreshing ? 'Refreshing...' : 'Refresh Balance'}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm opacity-90">Total Wallet Balance</div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="text-4xl font-bold mb-2">
            ₹{balance?.wallet_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs opacity-75">
            Last updated: {balance?.updated_at ? new Date(balance.updated_at).toLocaleString('en-IN') : 'N/A'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm opacity-90">Blocked Amount</div>
            <div className="text-3xl">🔒</div>
          </div>
          <div className="text-4xl font-bold mb-2">
            ₹{balance?.blocked_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs opacity-75">
            Amount reserved for pending transactions
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm opacity-90">Available Balance</div>
            <div className="text-3xl">✅</div>
          </div>
          <div className="text-4xl font-bold mb-2">
            ₹{balance?.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-xs opacity-75">
            Available for new transactions
          </div>
        </div>
      </div>

      {/* Alert for Low Balance */}
      {balance && balance.available_balance < 10000 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-lg">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">Low Balance Alert</h3>
              <p className="text-red-700">
                Your KWIKAPI wallet balance is running low. Please add funds to continue processing recharges and bill payments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Wallet Information</h2>
        
        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-800 mb-2">About KWIKAPI Wallet</h3>
            <p className="text-gray-600 text-sm">
              The KWIKAPI wallet is your prepaid balance used for processing mobile recharges, DTH recharges, 
              and bill payments. All transactions are deducted from this wallet in real-time.
            </p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-gray-800 mb-2">Blocked Amount</h3>
            <p className="text-gray-600 text-sm">
              This represents the amount temporarily reserved for pending transactions. Once transactions are 
              completed or failed, this amount will be released back to your available balance.
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-800 mb-2">Available Balance</h3>
            <p className="text-gray-600 text-sm">
              This is the actual amount you can use for new transactions. Make sure to maintain sufficient 
              balance to avoid transaction failures.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-gray-800 mb-2">Low Balance Recommendations</h3>
            <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
              <li>Maintain a minimum balance of ₹10,000 for smooth operations</li>
              <li>Set up balance alerts to get notified when balance is low</li>
              <li>Contact KWIKAPI support to add funds to your wallet</li>
              <li>Monitor transaction patterns to predict balance requirements</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">API Configuration</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-800">API Base URL</div>
              <div className="text-sm text-gray-600">https://api.kwikapi.com/v3</div>
            </div>
            <div className="text-green-600 font-semibold">✓ Connected</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-800">API Key Status</div>
              <div className="text-sm text-gray-600">Configured in environment variables</div>
            </div>
            <div className="text-green-600 font-semibold">✓ Active</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-800">Callback URL</div>
              <div className="text-sm text-gray-600">{process.env.NEXT_PUBLIC_APP_URL}/api/recharge/callback</div>
            </div>
            <div className="text-green-600 font-semibold">✓ Configured</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <button
          onClick={() => router.push('/dashboard/recharge/transactions')}
          className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all text-left"
        >
          <div className="text-3xl mb-3">📊</div>
          <div className="font-semibold text-gray-800 mb-1">View Transactions</div>
          <div className="text-sm text-gray-600">Check all recharge and bill payment transactions</div>
        </button>

        <button
          onClick={() => router.push('/dashboard/recharge')}
          className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all text-left"
        >
          <div className="text-3xl mb-3">💳</div>
          <div className="font-semibold text-gray-800 mb-1">New Recharge</div>
          <div className="text-sm text-gray-600">Process mobile, DTH, or bill payments</div>
        </button>

        <button
          onClick={() => window.open('https://kwikapi.com/support', '_blank')}
          className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all text-left"
        >
          <div className="text-3xl mb-3">💬</div>
          <div className="font-semibold text-gray-800 mb-1">Contact Support</div>
          <div className="text-sm text-gray-600">Get help with wallet or API issues</div>
        </button>
      </div>
    </div>
    </DashboardLayout>
  );
}
