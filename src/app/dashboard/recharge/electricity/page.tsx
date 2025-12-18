'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import SearchableSelect from '@/components/SearchableSelect';

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
  service_type: string;
  logo_url: string;
  min_amount: number;
  max_amount: number;
  metadata: any;
  kwikapi_opid?: number;
}

interface Circle {
  id: string;
  circle_code: string;
  circle_name: string;
}

interface BillDetails {
  consumer_name: string;
  bill_number: string;
  bill_date: string;
  bill_period: string;
  bill_amount: string;
  due_amount: string;
  due_date: string;
  ref_id: string;
}

export default function ElectricityBillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  
  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Dynamic fields for different operators
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchOperators();
    fetchCircles();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch('/api/wallet/balance');
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/recharge/operators?service_type=ELECTRICITY');
      const data = await res.json();
      if (data.success) {
        setOperators(data.data);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchCircles = async () => {
    try {
      const res = await fetch('/api/recharge/circles');
      const data = await res.json();
      if (data.success) {
        setCircles(data.data);
      }
    } catch (error) {
      console.error('Error fetching circles:', error);
    }
  };

  const fetchBillerDetails = async (operatorId: string) => {
    const operator = operators.find(op => op.id === operatorId);
    if (!operator?.kwikapi_opid) return;

    try {
      const res = await fetch('/api/kwikapi/biller-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opid: operator.kwikapi_opid }),
      });

      const data = await res.json();
      if (data.success && data.data.parameters) {
        const requiredFields = data.data.parameters.filter((param: any) => param.required);
        setDynamicFields(requiredFields);
        
        // Initialize field values
        const initialValues: {[key: string]: string} = {};
        requiredFields.forEach((field: any) => {
          initialValues[field.name] = '';
        });
        setDynamicFieldValues(initialValues);
      }
    } catch (error) {
      console.error('Error fetching biller details:', error);
    }
  };

  const fetchBill = async () => {
    if (!consumerNumber || !selectedOperator) {
      setMessage('Please enter consumer number and select electricity board');
      setMessageType('error');
      return;
    }

    setFetchingBill(true);
    setMessage('');
    setBillDetails(null);

    try {
      const operator = operators.find(op => op.id === selectedOperator);
      
      // Prepare optional parameters
      const optionalParams: {[key: string]: string} = {};
      dynamicFields.forEach(field => {
        const value = dynamicFieldValues[field.name];
        if (value) {
          optionalParams[field.kwikapi_param] = value;
        }
      });

      const res = await fetch('/api/kwikapi/bill-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opid: operator?.kwikapi_opid,
          account_number: consumerNumber,
          mobile: '9999999999',
          optional_params: optionalParams,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        const billData = data.data;
        setBillDetails({
          consumer_name: billData.customer_name || billData.customername || 'N/A',
          bill_number: billData.bill_number || billData.billnumber || 'N/A',
          due_amount: billData.due_amount || billData.dueamount || '0',
          due_date: billData.due_date || billData.duedate || 'N/A',
          bill_date: billData.bill_date || billData.billdate || 'N/A',
          bill_period: billData.bill_period || billData.billperiod || 'N/A',
          bill_amount: billData.bill_amount || billData.due_amount || '0',
          ref_id: billData.ref_id || billData.refid || '',
        });
        setAmount(billDetails?.due_amount || '0');
        setCustomerName(billDetails?.consumer_name || '');
        setMessage(`✅ Bill found for ${billDetails?.consumer_name}`);
        setMessageType('success');
      } else {
        setMessage(`ℹ️ ${data.message || 'Unable to fetch bill details'}`);
        setMessageType('info');
      }
    } catch (error: any) {
      setMessage(`❌ Error fetching bill: ${error.message}`);
      setMessageType('error');
    } finally {
      setFetchingBill(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = parseFloat(amount);
    
    // Check wallet balance
    if (walletBalance < totalAmount) {
      setMessage(
        `❌ Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)}, but need ₹${totalAmount.toFixed(2)}. Please add money to your wallet.`
      );
      setMessageType('error');
      return;
    }
    
    // Check if bill fetch is required
    const operator = operators.find(op => op.id === selectedOperator);
    if (operator?.metadata?.bill_fetch === 'YES' && !billDetails) {
      setMessage('⚠️ Please get your bill details first before making payment.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const circle = circles.find(c => c.id === selectedCircle);

      // Prepare optional parameters
      const optionalParams: {[key: string]: string} = {};
      dynamicFields.forEach(field => {
        const value = dynamicFieldValues[field.name];
        if (value) {
          optionalParams[field.kwikapi_param] = value;
        }
      });

      const payload = {
        service_type: 'ELECTRICITY',
        operator_code: operator?.operator_code,
        amount: totalAmount,
        customer_name: customerName || billDetails?.consumer_name,
        consumer_number: consumerNumber,
        circle_code: circle?.circle_code,
        ref_id: billDetails?.ref_id,
        bill_details: billDetails,
        optional_params: optionalParams,
      };

      const res = await fetch('/api/recharge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        if (data.pending) {
          setMessage(data.data.message || '⏳ Transaction is being processed. Please check status after some time.');
          setMessageType('info');
        } else {
          setMessage(data.data.message || `✅ Payment successful! Transaction ID: ${data.data.transaction_ref}`);
          setMessageType('success');
        }
        
        // Refresh wallet balance
        fetchWalletBalance();
        
        // Reset form
        setConsumerNumber('');
        setAmount('');
        setCustomerName('');
        setBillDetails(null);
        setDynamicFieldValues({});
      } else {
        setMessage(data.data?.message || data.message || '❌ Payment failed');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorChange = (operatorId: string) => {
    setSelectedOperator(operatorId);
    setBillDetails(null);
    setDynamicFields([]);
    setDynamicFieldValues({});
    if (operatorId) {
      fetchBillerDetails(operatorId);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚡ Electricity Bill Payment</h1>
          <p className="text-gray-600">Pay your electricity bills instantly with real-time processing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">💰 Available Wallet Balance</p>
                  <p className="text-4xl font-bold">
                    {loadingBalance ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `₹${walletBalance.toFixed(2)}`
                    )}
                  </p>
                  <p className="text-xs opacity-75 mt-2">
                    {session?.user?.name && `${session.user.name}'s Wallet`}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={fetchWalletBalance}
                    disabled={loadingBalance}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all disabled:opacity-50 text-sm font-medium"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/wallet')}
                    className="px-4 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg transition-all text-sm font-medium"
                  >
                    💳 Add Money
                  </button>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Consumer Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consumer Number / Meter ID
                  </label>
                  <input
                    type="text"
                    value={consumerNumber}
                    onChange={(e) => {
                      setConsumerNumber(e.target.value);
                      setBillDetails(null);
                    }}
                    placeholder="Enter consumer/meter number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Operator Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Electricity Board
                  </label>
                  <SearchableSelect
                    options={operators.map(op => ({
                      value: op.id,
                      label: op.operator_name,
                      data: op
                    }))}
                    value={selectedOperator}
                    onChange={handleOperatorChange}
                    placeholder="Search and select electricity board..."
                    required
                  />
                  
                  {/* Operator Tips */}
                  {selectedOperator && (
                    <div className="mt-3">
                      {operators.find(op => op.id === selectedOperator)?.operator_name.includes('Torrent Power') && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">💡 Torrent Power Tip:</span> Make sure to select the correct city-specific operator (Surat, Ahmedabad, Bhiwandi, or Agra).
                          </p>
                        </div>
                      )}
                      
                      {operators.find(op => op.id === selectedOperator)?.metadata?.message && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <span className="font-semibold">ℹ️ Note:</span> {operators.find(op => op.id === selectedOperator)?.metadata?.message}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dynamic Fields */}
                {dynamicFields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.options && field.options.length > 0 ? (
                      <select
                        value={dynamicFieldValues[field.name] || ''}
                        onChange={(e) => setDynamicFieldValues(prev => ({
                          ...prev,
                          [field.name]: e.target.value
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((option: any) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={dynamicFieldValues[field.name] || ''}
                        onChange={(e) => setDynamicFieldValues(prev => ({
                          ...prev,
                          [field.name]: e.target.value
                        }))}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={field.required}
                      />
                    )}
                    {field.description && (
                      <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                    )}
                  </div>
                ))}

                {/* Circle Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select State/Circle
                  </label>
                  <SearchableSelect
                    options={circles.map(c => ({
                      value: c.id,
                      label: c.circle_name,
                      data: c
                    }))}
                    value={selectedCircle}
                    onChange={setSelectedCircle}
                    placeholder="Search and select state/circle..."
                    required
                  />
                </div>

                {/* Bill Fetch Section */}
                {selectedOperator && consumerNumber && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">📋</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-purple-900 mb-1">Bill Fetch</h3>
                        <p className="text-sm text-purple-700">
                          {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES'
                            ? 'Click "Get Bill Details" to view your bill information before payment.'
                            : 'Bill fetch not available for this operator. Enter amount manually.'}
                        </p>
                      </div>
                    </div>
                    
                    {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES' && !billDetails && (
                      <button
                        type="button"
                        onClick={fetchBill}
                        disabled={fetchingBill}
                        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                      >
                        {fetchingBill ? '⏳ Getting Bill Details...' : '🔍 Get Bill Details'}
                      </button>
                    )}
                  </div>
                )}

                {/* Bill Details Display */}
                {billDetails && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-5 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-blue-900 text-lg">📄 Your Bill Details</h3>
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        ✓ Verified
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-gray-600 text-xs">Consumer Name</span>
                        <p className="font-semibold text-gray-900">{billDetails.consumer_name}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-gray-600 text-xs">Bill Number</span>
                        <p className="font-semibold text-gray-900">{billDetails.bill_number}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-gray-600 text-xs">Bill Date</span>
                        <p className="font-semibold text-gray-900">{billDetails.bill_date}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-gray-600 text-xs">Due Date</span>
                        <p className="font-semibold text-red-600">{billDetails.due_date}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-3 border-2 border-green-400 md:col-span-2">
                        <span className="text-gray-700 text-xs font-medium">Amount Due</span>
                        <p className="font-bold text-2xl text-green-700">₹{billDetails.due_amount}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter bill amount"
                    min={operators.find(op => op.id === selectedOperator)?.min_amount || 100}
                    max={operators.find(op => op.id === selectedOperator)?.max_amount || 50000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? '⏳ Processing Payment...' : `💳 Pay Electricity Bill${amount ? ` - ₹${amount}` : ''}`}
                </button>

                {/* Message */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 text-gray-800">💡 Quick Tips</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Bill Fetch</h3>
                  <p className="text-sm text-blue-800">
                    Use bill fetch to automatically get your bill details and ensure accurate payment.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">⚡ Instant Processing</h3>
                  <p className="text-sm text-green-800">
                    All payments are processed in real-time with immediate confirmation.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">💰 Earn Rewards</h3>
                  <p className="text-sm text-purple-800">
                    Get cashback and commissions on every successful payment.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">🔒 Secure Payments</h3>
                  <p className="text-sm text-yellow-800">
                    All transactions are encrypted and processed through secure channels.
                  </p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">📊 Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/dashboard/recharge/transactions')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    📈 View Transaction History
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/wallet')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    💳 Manage Wallet
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/recharge')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    📱 Other Recharge Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}