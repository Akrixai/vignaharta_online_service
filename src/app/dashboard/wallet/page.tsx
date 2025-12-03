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
import { useCashfree } from '@/hooks/useCashfree';
import PaymentSuccess from '@/components/PaymentSuccess';
import LogoSpinner, { PageLoader } from '@/components/ui/logo-spinner';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function WalletPage() {
  const { data: session } = useSession();
  const { getWallet, getTransactions, createTransaction } = useApi();
  const { initiatePayment, loading: paymentLoading } = useCashfree();

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [gstBreakdown, setGstBreakdown] = useState<{
    recharge_amount: number;
    gst_percentage: number;
    gst_amount: number;
    total_payable: number;
    wallet_credit: number;
  } | null>(null);

  // Calculate GST breakdown for Cashfree payment (2% GST)
  const calculateGSTBreakdown = (amount: number) => {
    // Dynamic max based on environment
    const isProduction = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION';
    const maxAmount = isProduction ? 50000 : 980;
    
    if (!amount || amount < 10 || amount > maxAmount) {
      return null;
    }

    const baseAmount = amount;
    const gstPercentage = 2.00; // 2% GST for Cashfree payments
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const totalPayable = baseAmount + gstAmount;

    return {
      recharge_amount: baseAmount,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      total_payable: totalPayable,
      wallet_credit: baseAmount // Only base amount credited to wallet
    };
  };
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showCashfreeRecharge, setShowCashfreeRecharge] = useState(false);
  const [showManualQRRecharge, setShowManualQRRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<File | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual QR Recharge states
  const [manualRechargeAmount, setManualRechargeAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [payerUpiId, setPayerUpiId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [isSubmittingManualRecharge, setIsSubmittingManualRecharge] = useState(false);
  const paymentScreenshotRef = useRef<HTMLInputElement>(null);
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

  // Check if coming from payment success and force refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromPayment = urlParams.get('from_payment');
    
    if (fromPayment === 'success') {
      // Force refresh after a short delay to allow webhook to process
      const timer = setTimeout(() => {
        refreshWalletAndTransactions();
        // Remove the query parameter
        window.history.replaceState({}, '', '/dashboard/wallet');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Calculate GST breakdown instantly when amount changes
  useEffect(() => {
    const amount = parseFloat(addMoneyAmount);
    const breakdown = calculateGSTBreakdown(amount);
    setGstBreakdown(breakdown);
  }, [addMoneyAmount]);

  if (!session) {
    return null; // Middleware will redirect
  }

  const user = session.user;

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addMoneyAmount);
    const isProduction = process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION';
    const maxAmount = isProduction ? 50000 : 980;

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

    if (amount > maxAmount) {
      showToast.error('Amount too high', {
        description: isProduction 
          ? 'Maximum amount is ₹50,000 per transaction'
          : 'TEST mode: Maximum ₹980 (₹999.60 with GST). Use QR Payment for higher amounts.'
      });
      return;
    }

    // Calculate GST breakdown if not already calculated
    const breakdown = gstBreakdown || calculateGSTBreakdown(amount);
    
    if (!breakdown) {
      showToast.error('Invalid amount', {
        description: `Please enter a valid amount between ₹10 and ₹${maxAmount.toLocaleString()}`
      });
      return;
    }

    setIsAddingMoney(true);

    // Direct payment without GST
    await initiatePayment(
      breakdown.total_payable,
      (data) => {
        // Payment successful
        setAddMoneyAmount('');
        setGstBreakdown(null);
        setShowAddMoney(false);
        setIsAddingMoney(false);
        setPaymentStatusMessage('');

        showToast.success('Payment Successful!', {
          description: `₹${breakdown.wallet_credit} has been added to your wallet.`
        });

        // Refresh wallet and transactions
        refreshWalletAndTransactions();
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

  const handleManualQRRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(manualRechargeAmount);

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

    // Check both state and file input directly
    const fileInput = paymentScreenshotRef.current;
    const file = paymentScreenshot || (fileInput?.files?.[0]);
    
    if (!file) {
      showToast.error('Screenshot required', {
        description: 'Please upload payment screenshot'
      });
      return;
    }

    if (!utrNumber || utrNumber.trim() === '') {
      showToast.error('UTR required', {
        description: 'Please enter UTR/Transaction ID'
      });
      return;
    }

    if (!payerName || payerName.trim() === '') {
      showToast.error('Name required', {
        description: 'Please enter payer name'
      });
      return;
    }

    if (!payerPhone || !/^[0-9]{10}$/.test(payerPhone)) {
      showToast.error('Invalid phone', {
        description: 'Please enter valid 10-digit phone number'
      });
      return;
    }

    if (!transactionDate) {
      showToast.error('Date required', {
        description: 'Please select transaction date and time'
      });
      return;
    }

    setIsSubmittingManualRecharge(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('payment_screenshot', file); // Use the validated file
      formData.append('utr_number', utrNumber);
      formData.append('payer_name', payerName);
      formData.append('payer_phone', payerPhone);
      formData.append('payer_upi_id', payerUpiId || '');
      formData.append('transaction_date', transactionDate);
      formData.append('payment_mode', 'MANUAL_QR');

      const response = await fetch('/api/wallet/manual-recharge', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setManualRechargeAmount('');
        setPaymentScreenshot(null);
        setUtrNumber('');
        setPayerName('');
        setPayerPhone('');
        setPayerUpiId('');
        setTransactionDate('');
        if (paymentScreenshotRef.current) {
          paymentScreenshotRef.current.value = '';
        }
        setShowManualQRRecharge(false);

        showToast.success('Request submitted successfully!', {
          description: `Your wallet recharge request for ₹${amount} is pending approval. You'll be notified once approved.`
        });

        // Refresh wallet and transactions
        refreshWalletAndTransactions();
      } else {
        throw new Error(result.error || 'Failed to submit recharge request');
      }
    } catch (error) {
      showToast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmittingManualRecharge(false);
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
              <Button
                onClick={() => setShowAddMoney(true)}
                className="bg-white text-green-600 hover:bg-gray-100 flex-1 h-12 font-semibold text-base shadow-md hover:shadow-xl transition-all duration-200"
              >
                💳 Add Money
              </Button>
              <Button
                onClick={() => setShowWithdraw(true)}
                variant="outline"
                className="border-white text-green-600 bg-white hover:bg-green-50 hover:text-green-700 flex-1 h-12 font-semibold text-base shadow-md hover:shadow-xl transition-all duration-200"
              >
                💸 Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Money Options Modal */}
        {showAddMoney && (
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Add Money to Wallet</CardTitle>
                    <CardDescription className="text-green-100">Choose your preferred recharge method</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMoney(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Two Recharge Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Option 1: Instant Cashfree Payment (with 2% GST) */}
                <Card className="border-2 border-red-300 hover:border-red-500 transition-all cursor-pointer hover:shadow-lg"
                  onClick={() => {
                    setShowAddMoney(false);
                    setShowCashfreeRecharge(true);
                  }}>
                  <CardHeader className="bg-gradient-to-br from-red-50 to-pink-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚡</span>
                        <CardTitle className="text-lg text-red-800">Instant Recharge</CardTitle>
                      </div>
                      <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">With 2% GST</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Instant wallet credit</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Multiple payment options (UPI, Cards, Net Banking)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Secure Cashfree gateway</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 mr-2">⚠</span>
                        <span className="text-orange-700 font-medium">2% GST applicable on total amount</span>
                      </li>
                    </ul>
                    <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
                      Choose Instant Recharge
                    </Button>
                  </CardContent>
                </Card>

                {/* Option 2: Manual QR Payment (No GST, Approval-based) */}
                <Card className="border-2 border-blue-300 hover:border-blue-500 transition-all cursor-pointer hover:shadow-lg"
                  onClick={() => {
                    setShowAddMoney(false);
                    setShowManualQRRecharge(true);
                  }}>
                  <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">📱</span>
                        <CardTitle className="text-lg text-blue-800">QR Payment</CardTitle>
                      </div>
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">No GST</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="font-medium text-green-700">No GST charges</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Pay via UPI to our QR code</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Upload payment screenshot</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">⏱</span>
                        <span className="text-blue-700">Credit after admin approval (within 24 hours)</span>
                      </li>
                    </ul>
                    <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                      Choose QR Payment
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-start">
                  <span className="mr-2 mt-0.5">💡</span>
                  <span>
                    <strong>Choose wisely:</strong> Use <strong>Instant Recharge</strong> for urgent needs (with 2% GST), 
                    or <strong>QR Payment</strong> to save on GST (requires approval).
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cashfree Instant Recharge Form (with 2% GST) */}
        {showCashfreeRecharge && (
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Instant Wallet Recharge</CardTitle>
                  <CardDescription className="text-red-100">Secure Cashfree payment gateway (2% GST applicable)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Payment Info */}
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-blue-600 text-xl">💳</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Instant Wallet Recharge
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Pay securely using Cashfree payment gateway. Your wallet will be credited instantly after successful payment.
                      </p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Multiple payment options: UPI, Cards, Net Banking</li>
                        <li>Instant wallet credit on successful payment</li>
                        <li>Secure and encrypted transactions</li>
                        <li>No manual approval required</li>
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
                    Recharge Amount (₹10 - ₹{process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? '50,000' : '980'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <Input
                      id="addAmount"
                      type="number"
                      min="10"
                      max={process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 50000 : 980}
                      value={addMoneyAmount}
                      onChange={(e) => setAddMoneyAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                      className="pl-8 h-12 text-lg font-medium text-gray-900 border-2 border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">Minimum: ₹10</span>
                    <span className="text-orange-600 font-medium">
                      Maximum: ₹{process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? '50,000' : '980'}
                      {process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT !== 'PRODUCTION' && ' (TEST mode)'}
                    </span>
                  </div>
                  {process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT !== 'PRODUCTION' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                      <p className="text-xs text-yellow-800">
                        ⚠️ <strong>TEST Mode:</strong> Max ₹980 + GST = ₹999.60. For higher amounts, use QR Payment (no GST).
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Summary with GST Breakdown */}
                {gstBreakdown && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border-2 border-red-300">
                    <h4 className="font-bold text-red-800 mb-3 flex items-center">
                      <span className="mr-2">💳</span>
                      Payment Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Base Amount:</span>
                        <span className="font-semibold text-gray-900">₹{gstBreakdown.recharge_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-700">GST (2%):</span>
                        <span className="font-semibold text-orange-900">₹{gstBreakdown.gst_amount.toFixed(2)}</span>
                      </div>
                      <div className="border-t-2 border-red-200 pt-2 mt-2"></div>
                      <div className="flex justify-between text-base">
                        <span className="font-bold text-red-800">Total to Pay:</span>
                        <span className="font-bold text-red-900 text-lg">₹{gstBreakdown.total_payable.toFixed(2)}</span>
                      </div>
                      <div className="bg-white p-3 rounded border-2 border-green-300 mt-3">
                        <p className="text-sm text-green-700 flex items-center">
                          <span className="mr-2 text-lg">✓</span>
                          <span><strong>Wallet Credit:</strong> ₹{gstBreakdown.wallet_credit.toFixed(2)} will be added to your wallet</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1 ml-6">
                          (GST amount is not credited to wallet)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 flex items-center">
                    <span className="mr-2">🔒</span>
                    <strong>Secure Payment:</strong> Your payment is processed through Cashfree&apos;s secure payment gateway
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCashfreeRecharge(false)}
                    className="flex-1 h-12 bg-white border-2 border-gray-300 text-black hover:bg-gray-50 font-medium"
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
                        Pay Now
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Manual QR Recharge Form (No GST, Approval-based) */}
        {showManualQRRecharge && (
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">QR Payment Recharge</CardTitle>
                  <CardDescription className="text-blue-100">No GST • Approval-based • Save money</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* QR Code Display */}
              <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                  <span className="mr-2">📱</span>
                  Step 1: Scan & Pay
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <Image
                      src="/akrixPayQR.jpg"
                      alt="Payment QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex-1 space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Open any UPI app (PhonePe, Google Pay, Paytm, etc.)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Scan the QR code shown above</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Enter the amount you want to add</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="font-medium text-green-700">Complete the payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details Form */}
              <form onSubmit={handleManualQRRecharge} className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-2">📝</span>
                  Step 2: Submit Payment Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="manualAmount" className="text-sm font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">💰</span>
                      Amount Paid (₹)
                    </label>
                    <Input
                      id="manualAmount"
                      type="number"
                      min="10"
                      max="50000"
                      value={manualRechargeAmount}
                      onChange={(e) => setManualRechargeAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                      className="h-12 text-lg font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="utrNumber" className="text-sm font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">🔢</span>
                      UTR/Transaction ID
                    </label>
                    <Input
                      id="utrNumber"
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="12-digit UTR number"
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="payerName" className="text-sm font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">👤</span>
                      Payer Name
                    </label>
                    <Input
                      id="payerName"
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Name as per UPI"
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="payerPhone" className="text-sm font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📞</span>
                      Phone Number
                    </label>
                    <Input
                      id="payerPhone"
                      type="tel"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10}"
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="payerUpiId" className="text-sm font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">💳</span>
                      UPI ID (Optional)
                    </label>
                    <Input
                      id="payerUpiId"
                      type="text"
                      value={payerUpiId}
                      onChange={(e) => setPayerUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="transactionDate" className="text-sm font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">📅</span>
                      Transaction Date & Time
                    </label>
                    <Input
                      id="transactionDate"
                      type="datetime-local"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Payment Screenshot Upload */}
                <div className="space-y-2">
                  <label htmlFor="paymentScreenshot" className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📸</span>
                    Payment Screenshot
                  </label>
                  <Input
                    ref={paymentScreenshotRef}
                    id="paymentScreenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                    className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {paymentScreenshot && (
                    <div className="mt-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm">✓</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Screenshot Uploaded!</p>
                            <p className="text-xs text-green-600">{paymentScreenshot.name} ({(paymentScreenshot.size / 1024).toFixed(1)} KB)</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentScreenshot(null);
                            if (paymentScreenshotRef.current) {
                              paymentScreenshotRef.current.value = '';
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

                {/* Important Notes */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-bold text-yellow-900 mb-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Important Notes:
                  </h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span><strong>No GST charges</strong> - Full amount will be credited to your wallet</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Request will be reviewed by admin within <strong>24 hours</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Ensure all details match your payment screenshot</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>You'll receive a notification once approved</span>
                    </li>
                  </ul>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualQRRecharge(false)}
                    className="flex-1 h-12 bg-white border-2 border-gray-300 text-black hover:bg-gray-50 font-medium"
                    disabled={isSubmittingManualRecharge}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingManualRecharge}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-lg transition-all duration-200"
                  >
                    {isSubmittingManualRecharge ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="mr-2">📤</span>
                        Submit for Approval
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


    </DashboardLayout>
  );
}
