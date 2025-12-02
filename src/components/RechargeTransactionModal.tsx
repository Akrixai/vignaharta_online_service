'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  transaction_ref: string;
  service_type: string;
  operator: {
    operator_name: string;
    operator_code: string;
  };
  circle?: {
    circle_name: string;
  };
  mobile_number?: string;
  dth_number?: string;
  consumer_number?: string;
  amount: number;
  commission_amount: number;
  cashback_amount: number;
  platform_fee: number;
  total_amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  created_at: string;
  completed_at?: string;
  error_message?: string;
  response_data?: any;
}

interface Props {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RechargeTransactionModal({ transactionId, isOpen, onClose }: Props) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchTransaction();
    }
  }, [isOpen, transactionId]);

  const fetchTransaction = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/recharge/transaction-status?transaction_id=${transactionId}`);
      const data = await res.json();
      
      if (data.success) {
        setTransaction(data.data);
      } else {
        console.error('Transaction fetch failed:', data.message);
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '✅';
      case 'PENDING':
        return '⏳';
      case 'FAILED':
        return '❌';
      case 'REFUNDED':
        return '↩️';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading transaction details...</div>
          ) : !transaction ? (
            <div className="text-center py-12 text-red-500">Transaction not found</div>
          ) : (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className={`px-4 py-2 rounded-lg border-2 font-semibold ${getStatusColor(transaction.status)}`}>
                  {getStatusIcon(transaction.status)} {transaction.status}
                </div>
                <button
                  onClick={() => fetchTransaction(true)}
                  disabled={refreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                >
                  {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Status'}
                </button>
              </div>

              {/* Transaction Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono text-sm font-medium">{transaction.transaction_ref}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service Type</p>
                    <p className="font-medium">{transaction.service_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Operator</p>
                    <p className="font-medium">{transaction.operator.operator_name}</p>
                  </div>
                  {transaction.circle && (
                    <div>
                      <p className="text-sm text-gray-600">Circle</p>
                      <p className="font-medium">{transaction.circle.circle_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Number</p>
                    <p className="font-medium">
                      {transaction.mobile_number || transaction.dth_number || transaction.consumer_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium text-sm">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-blue-900 mb-3">💰 Amount Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Amount Debited</span>
                    <span className="font-semibold text-lg">₹{transaction.amount.toFixed(2)}</span>
                  </div>
                  {transaction.commission_amount > 0 && (
                    <div className="flex justify-between text-green-600 border-t pt-2">
                      <span className="font-medium">Commission Earned</span>
                      <span className="font-semibold">+₹{transaction.commission_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {transaction.cashback_amount > 0 && (
                    <div className="flex justify-between text-green-600 border-t pt-2">
                      <span className="font-medium">Cashback Earned</span>
                      <span className="font-semibold">+₹{transaction.cashback_amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Messages */}
              {transaction.status === 'PENDING' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    ⏳ <strong>Transaction is being processed.</strong> Your amount has been debited from your wallet. 
                    You will receive confirmation shortly. If not completed within 24 hours, please contact admin.
                  </p>
                </div>
              )}

              {transaction.status === 'SUCCESS' && transaction.completed_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    ✅ <strong>Transaction completed successfully!</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Completed at: {new Date(transaction.completed_at).toLocaleString()}
                  </p>
                </div>
              )}

              {transaction.status === 'FAILED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    ❌ <strong>Transaction failed.</strong> Amount has been refunded to your wallet.
                  </p>
                  {transaction.error_message && (
                    <p className="text-sm text-red-700 mt-1">
                      Reason: {transaction.error_message}
                    </p>
                  )}
                </div>
              )}

              {/* Response Data (for debugging) */}
              {transaction.response_data && Object.keys(transaction.response_data).length > 0 && (
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    Technical Details
                  </summary>
                  <pre className="mt-3 text-xs bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify(transaction.response_data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
