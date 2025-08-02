'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';
import { useRazorpay } from '@/hooks/useRazorpay';
import QRPaymentModal from '@/components/wallet/QRPaymentModal';
import PaymentSuccess from '@/components/PaymentSuccess';
import LogoSpinner, { PageLoader } from '@/components/ui/logo-spinner';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';



export default function WalletPage() {
  const { data: session } = useSession();
  const { getWallet, getTransactions, createTransaction } = useApi();
  const { initiatePayment, loading: paymentLoading } = useRazorpay();

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [qrPaymentLoading, setQRPaymentLoading] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<File | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    amount: number;
    transactionId?: string;
    walletBalance?: number;
  }>({ amount: 0 });
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>('');

  // Add a function to manually refresh wallet and transactions
  const refreshWalletAndTransactions = async () => {
    if (!session) return;
    await getWallet().then(response => {
      if (response?.success) setWallet({
        ...response.data,
        balance: typeof response.data.balance === 'string' ? parseFloat(response.data.balance) : response.data.balance
      });
    });
    await getTransactions({ limit: 20 }).then(response => {
      if (response?.success) setTransactions(response.data);
    });
  };

  // Fetch wallet data with real-time updates
  useEffect(() => {
    if (!session) return;

    const fetchWallet = async () => {
      setLoadingWallet(true);
      const response = await getWallet();
      if (response?.success) {
        // Ensure balance is properly formatted as number
        const walletData = {
          ...response.data,
          balance: typeof response.data.balance === 'string' ? parseFloat(response.data.balance) : response.data.balance
        };
        setWallet(walletData);
      }
      setLoadingWallet(false);
    };

    fetchWallet();

    // Set up real-time subscription for wallet updates
    const channel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          fetchWallet(); // Refresh wallet data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getWallet, session]);

  // Fetch transactions with real-time updates
  useEffect(() => {
    if (!session) return;

    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      const response = await getTransactions({ limit: 20 });
      if (response?.success) {
        setTransactions(response.data);
      }
      setLoadingTransactions(false);
    };

    fetchTransactions();

    // Set up real-time subscription for transactions
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            // Transaction change detected
          }
          fetchTransactions(); // Refresh transactions
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getTransactions, session]);

  // Listen for custom event to refresh wallet/transactions after rejection or reapply
  useEffect(() => {
    const handler = () => refreshWalletAndTransactions();
    window.addEventListener('walletOrTransactionChanged', handler);
    return () => window.removeEventListener('walletOrTransactionChanged', handler);
  }, []);

  if (!session) {
    return null; // Middleware will redirect
  }

  const user = session.user;

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addMoneyAmount);

    if (!amount || amount <= 0) {
      showToast.error('Invalid amount', {
        description: 'Please enter a valid amount'
      });
      return;
    }

    if (amount < 10) {
      showToast.error('Amount too low', {
        description: 'Minimum amount is ₹10'
      });
      return;
    }

    if (amount > 50000) {
      showToast.error('Amount too high', {
        description: 'Maximum amount is ₹50,000 per transaction'
      });
      return;
    }

    setIsAddingMoney(true);

    await initiatePayment(
      amount,
      (data) => {
        // Payment successful
        setAddMoneyAmount('');
        setShowAddMoney(false);
        setIsAddingMoney(false);
        setPaymentStatusMessage('');

        // Set success data for modal
        setSuccessData({
          amount: amount,
          transactionId: data?.transaction?.reference || data?.transaction?.id || data?.payment?.id,
          walletBalance: data?.wallet?.balance
        });
        setShowPaymentSuccess(true);

        // Refresh wallet and transactions
        getWallet().then(response => {
          if (response?.success) {
            setWallet(response.data);
          }
        });

        getTransactions({ limit: 20 }).then(response => {
          if (response?.success) {
            setTransactions(response.data);
          }
        });
      },
      (error) => {
        // Payment failed
        setIsAddingMoney(false);
        setPaymentStatusMessage(error || 'Payment failed');
        showToast.error('Payment failed', {
          description: `${error}`
        });
      }
    );
  };

  const handleQRPayment = async (paymentData: { amount: number; paymentMethod: string; transactionId: string; screenshot?: File }) => {
    setQRPaymentLoading(true);

    try {
      // Create a payment verification request
      const formData = new FormData();
      formData.append('amount', paymentData.amount.toString());
      formData.append('payment_method', paymentData.paymentMethod);
      formData.append('transaction_id', paymentData.transactionId);
      formData.append('type', 'WALLET_TOPUP');

      if (paymentData.screenshot) {
        formData.append('screenshot', paymentData.screenshot);
      }

      const response = await fetch('/api/wallet/payment-verification', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setShowQRPayment(false);
        showToast.success('Payment verification request submitted successfully!', {
          description: 'Your wallet will be updated after admin approval.'
        });

        // Refresh transactions to show pending verification
        getTransactions({ limit: 20 }).then(response => {
          if (response?.success) {
            setTransactions(response.data);
          }
        });
      } else {
        throw new Error(result.error || 'Failed to submit payment verification');
      }
    } catch (error) {
      showToast.error('Payment verification failed', {
        description: error instanceof Error ? error.message : 'Failed to submit payment verification'
      });
    } finally {
      setQRPaymentLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      showToast.error('Invalid amount', {
        description: 'Please enter a valid amount'
      });
      return;
    }

    if (amount < 100) {
      showToast.error('Amount too low', {
        description: 'Minimum withdrawal amount is ₹100'
      });
      return;
    }

    if (amount > (wallet?.balance || 0)) {
      showToast.error('Insufficient balance', {
        description: 'You do not have enough balance for this withdrawal'
      });
      return;
    }

    // Validate QR code image
    if (!qrCodeImage) {
      showToast.error('QR code required', {
        description: 'Please upload your QR code image'
      });
      return;
    }

    setIsWithdrawing(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('qr_code_image', qrCodeImage);
      formData.append('reason', withdrawReason);

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setWithdrawAmount('');
        setQrCodeImage(null);
        setWithdrawReason('');
        // Clear the file input
        if (qrFileInputRef.current) {
          qrFileInputRef.current.value = '';
        }
        setShowWithdraw(false);

        // Refresh wallet and transactions
        getWallet().then(response => {
          if (response?.success) {
            setWallet(response.data);
          }
        });

        getTransactions({ limit: 20 }).then(response => {
          if (response?.success) {
            setTransactions(response.data);
          }
        });

        showToast.success(`Withdrawal request for ₹${amount} submitted successfully!`, {
          description: 'Waiting for admin approval.'
        });
      } else {
        throw new Error(result.error || 'Withdrawal request failed');
      }
    } catch (error) {
      showToast.error('Withdrawal failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-green-600';
      case 'REFUND': return 'text-blue-600';
      case 'SCHEME_PAYMENT': return 'text-red-600';
      case 'WITHDRAWAL': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return '⬇️';
      case 'REFUND': return '🔄';
      case 'SCHEME_PAYMENT': return '📝';
      case 'WITHDRAWAL': return '⬆️';
      default: return '💳';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Wallet Balance */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <span className="mr-2 text-2xl">💰</span>
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              {loadingWallet ? (
                <div className="flex items-center justify-center">
                  <LogoSpinner size="md" showText={false} />
                </div>
              ) : (
                formatCurrency(wallet?.balance || 0)
              )}
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Online Payment Button - Commented Out */}
              {/*
              <Button
                onClick={() => {
                  showToast.info('Coming Soon', {
                    description: 'Online payment integration is under development. Please use QR payment for now.'
                  });
                }}
                className="bg-white text-green-600 hover:bg-gray-100 flex-1"
              >
                💳 Online Payment
              </Button>
              */}

              <Button
                onClick={() => setShowQRPayment(true)}
                className="bg-white text-green-600 hover:bg-gray-100 flex-1 h-12 font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200"
              >
                📱 QR Pay
              </Button>
              <Button
                onClick={() => setShowWithdraw(true)}
                variant="outline"
                className="border-white text-green-600 hover:bg-white hover:text-green-600 flex-1 h-12 font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200"
              >
                💸 Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Money Form */}
        {showAddMoney && (
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Add Money to Wallet</CardTitle>
                  <CardDescription className="text-red-100">Secure Razorpay payment gateway integration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Important Notice */}
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important: QR Form Requirement
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        <strong>Whether you pay by Card or QR, you MUST fill the QR form</strong> to confirm your transaction.
                        This is mandatory for all payments to ensure proper wallet credit.
                      </p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Complete your payment (Card or QR)</li>
                        <li>Then click "📱 QR Pay" button above</li>
                        <li>Fill the QR form with payment details and type of payment</li>
                        <li>Upload payment screenshot with note card or QR for verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {paymentStatusMessage && (
                <div className="mb-4 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <span className="mr-2">⏳</span>
                    {paymentStatusMessage}
                  </p>
                </div>
              )}

              <form onSubmit={handleAddMoney} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="addAmount" className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">💰</span>
                    Amount (₹10 - ₹50,000)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <Input
                      id="addAmount"
                      type="number"
                      min="10"
                      max="50000"
                      value={addMoneyAmount}
                      onChange={(e) => setAddMoneyAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                      className="pl-8 h-12 text-lg font-medium text-gray-900 border-2 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">Minimum: ₹10</span>
                    <span className="text-orange-600 font-medium">Maximum: ₹50,000</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 flex items-center">
                    <span className="mr-2">🔒</span>
                    <strong>Secure Payment:</strong> Your payment is processed through Razorpay&apos;s secure gateway
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddMoney(false)}
                    className="flex-1 h-12 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-700 text-white font-medium"
                    disabled={isAddingMoney || paymentLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddingMoney || paymentLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg transition-all duration-200"
                  >
                    {isAddingMoney || paymentLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2">💳</span>
                        Add Money
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Withdraw Money Form */}
        {showWithdraw && (
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xl">💸</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Withdraw Money</CardTitle>
                  <CardDescription className="text-orange-100">Secure withdrawal using QR code</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleWithdraw} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="withdrawAmount" className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">💰</span>
                    Amount (₹100 - ₹{(wallet?.balance || 0).toFixed(2)})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      min="100"
                      max={wallet?.balance || 0}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                      className="pl-8 h-12 text-lg font-medium text-gray-900 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">Minimum: ₹100</span>
                    <span className="text-blue-600 font-medium">Available: ₹{(wallet?.balance || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* QR Code Upload Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="qrCodeImage" className="text-sm font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📱</span>
                      Upload Your Payment QR Code
                    </label>
                    <div className="relative">
                      <Input
                        ref={qrFileInputRef}
                        id="qrCodeImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setQrCodeImage(e.target.files?.[0] || null)}
                        className="h-12 text-gray-900 border-2 border-gray-200 focus:border-pink-500 focus:ring-pink-500 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                      />
                    </div>
                    {qrCodeImage && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-sm">✓</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-green-800">QR Code Uploaded Successfully!</p>
                              <p className="text-xs text-green-600">
                                <strong>File:</strong> {qrCodeImage.name} ({(qrCodeImage.size / 1024).toFixed(1)} KB)
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setQrCodeImage(null);
                              if (qrFileInputRef.current) {
                                qrFileInputRef.current.value = '';
                              }
                            }}
                            className="text-green-600 hover:text-green-800 font-medium text-sm underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Code Instructions */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                      <span className="mr-2">💡</span>
                      How to get your QR Code:
                    </h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Open your UPI app (PhonePe, Google Pay, Paytm, etc.)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Go to "Receive Money" or "My QR Code" section</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Take a screenshot of your QR code</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                        <span className="font-medium text-green-800">Upload the screenshot here</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="withdrawReason" className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📝</span>
                    Reason for Withdrawal (Optional)
                  </label>
                  <Input
                    id="withdrawReason"
                    type="text"
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    placeholder="e.g., Personal expense, Emergency, etc."
                    className="h-12 text-gray-900 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  />
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 flex items-start">
                    <span className="mr-2 mt-0.5">⚡</span>
                    <span>
                      <strong>Quick Processing:</strong> Withdrawal requests are processed within 24 hours.
                      Money will be transferred directly to your UPI account using the uploaded QR code.
                    </span>
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWithdraw(false)}
                    className="flex-1 h-12 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 hover:border-gray-700 text-gray-700 font-medium"
                    disabled={isWithdrawing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isWithdrawing}
                    className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg transition-all duration-200"
                  >
                    {isWithdrawing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2">💸</span>
                        Withdraw Money
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Transaction History</CardTitle>
            <CardDescription className="text-gray-600">All your wallet transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading transactions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(transaction.created_at)} • Ref: {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {transaction.status.toLowerCase()}
                    </div>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">💳</span>
                  <p>No transactions yet</p>
                  <p className="text-sm">Your wallet transactions will appear here</p>
                </div>
              )}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">🔒 Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Your wallet is protected with bank-level security and encryption.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">⚡ Instant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Add money instantly using UPI, cards, or net banking.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">📱 Convenient</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Use your wallet balance for all government service payments.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Payment Modal */}
      <QRPaymentModal
        isOpen={showQRPayment}
        onClose={() => setShowQRPayment(false)}
        onSubmit={handleQRPayment}
        loading={qrPaymentLoading}
      />
      
      {/* Payment Success Modal */}
      <PaymentSuccess
        isOpen={showPaymentSuccess}
        onClose={() => setShowPaymentSuccess(false)}
        amount={successData.amount}
        transactionId={successData.transactionId}
        walletBalance={successData.walletBalance}
      />
    </DashboardLayout>
  );
}
