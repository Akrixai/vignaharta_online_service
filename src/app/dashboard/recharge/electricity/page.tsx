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
  commission_rate?: number;
  metadata?: {
    bill_fetch?: string;
    message?: string;
  };
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
  
  const userRole = session?.user?.role;
  const rewardLabel = userRole === 'CUSTOMER' ? 'Cashback' : 'Commission';
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Dynamic fields for operators with additional requirements
  const [dynamicFields, setDynamicFields] = useState<{[key: string]: string}>({});
  
  const [loading, setLoading] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  
  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

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

  useEffect(() => {
    // Reset dynamic fields when operator changes
    setDynamicFields({});
  }, [selectedOperator]);

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
      
      // Prepare request body with special fields based on operator requirements
      const requestBody: any = {
        operator_code: operator?.operator_code,
        consumer_number: consumerNumber,
        service_type: 'ELECTRICITY',
      };

      // Add dynamic fields based on operator requirements
      const operatorMessage = operator?.metadata?.message?.toUpperCase() || '';
      
      // Parse operator message to determine required fields
      const requiredFields = parseOperatorRequirements(operatorMessage);
      
      // Add dynamic fields to request
      requiredFields.forEach(field => {
        if (field.parameter && dynamicFields[field.key]) {
          requestBody[field.parameter] = dynamicFields[field.key];
        }
      });

      const res = await fetch('/api/recharge/fetch-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      
      if (data.success) {
        setBillDetails(data.data);
        setAmount(data.data.due_amount);
        setCustomerName(data.data.consumer_name);
        setMessage(`✅ Bill found for ${data.data.consumer_name}`);
        setMessageType('success');
      } else {
        setMessage(`ℹ️ ${data.message}`);
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
    
    // Calculate total amount
    const totalAmount = parseFloat(amount);
    
    // CRITICAL: Check wallet balance BEFORE processing
    if (walletBalance < totalAmount) {
      setMessage(
        `❌ Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)}, but need ₹${totalAmount.toFixed(2)}. Please add money to your wallet.`
      );
      setMessageType('error');
      return;
    }
    
    // Validation for bill fetch operators
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

      const payload: any = {
        service_type: 'ELECTRICITY',
        operator_code: operator?.operator_code,
        consumer_number: consumerNumber,
        circle_code: circle?.circle_code,
        amount: parseFloat(amount),
        customer_name: customerName || billDetails?.consumer_name,
      };

      // Include ref_id from bill fetch if available
      if (billDetails?.ref_id) {
        payload.ref_id = billDetails.ref_id;
        payload.bill_details = billDetails;
      }

      const res = await fetch('/api/recharge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const reward = data.data.reward_amount || 0;
        setMessage(`✅ Electricity bill payment successful! ${data.data.reward_label}: ₹${reward.toFixed(2)} | Transaction ID: ${data.data.transaction_ref}`);
        
        // Refresh wallet balance
        fetchWalletBalance();
        
        setConsumerNumber('');
        setAmount('');
        setCustomerName('');
        setBillDetails(null);
        setDynamicFields({});
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Helper function to parse operator requirements
  const parseOperatorRequirements = (message: string) => {
    const requirements = [];
    const upperMessage = message.toUpperCase();
    
    // MSEDC MAHARASHTRA - Billing Unit in optional1
    if (upperMessage.includes('BILLING UNIT') && upperMessage.includes('OPTIONAL1')) {
      requirements.push({
        key: 'billing_unit',
        label: 'Billing Unit',
        placeholder: 'Enter billing unit (last 2 digits of consumer number)',
        required: true,
        parameter: 'optional1',
        description: 'For MSEDC MAHARASHTRA, this is typically the last 2 digits of your consumer number'
      });
    }
    
    // JBVNL - JHARKHAND - Subdivision Code in optional1
    if (upperMessage.includes('SUBDIVISION CODE') && upperMessage.includes('OPTIONAL1')) {
      requirements.push({
        key: 'subdivision_code',
        label: 'Subdivision Code',
        placeholder: 'Enter subdivision code',
        required: true,
        parameter: 'optional1',
        description: 'Required for JBVNL - JHARKHAND. Please check your electricity bill for this code.'
      });
    }
    
    // Torrent Power operators - City in optional1
    if (upperMessage.includes('CITY') && upperMessage.includes('OPTIONAL1')) {
      requirements.push({
        key: 'city',
        label: 'City',
        placeholder: 'Enter city name',
        required: true,
        parameter: 'optional1',
        description: 'Required for Torrent Power operators. Please enter the correct city name.'
      });
    }
    
    // UHBVN/DHBVN - HARYANA - Mobile Number in optional1
    if (upperMessage.includes('MOBILE NUMBER') && upperMessage.includes('OPTIONAL1')) {
      requirements.push({
        key: 'mobile_number',
        label: 'Mobile Number',
        placeholder: 'Enter mobile number (10 digits)',
        required: true,
        parameter: 'optional1',
        description: 'Required for UHBVN/DHBVN - HARYANA. Enter your registered mobile number.'
      });
    }
    
    // PSPCL - PUNJAB - Email Id in optional2
    if (upperMessage.includes('EMAIL ID') && upperMessage.includes('OPTIONAL2')) {
      requirements.push({
        key: 'email_id',
        label: 'Email ID',
        placeholder: 'Enter email address',
        required: true,
        parameter: 'optional2',
        description: 'Required for PSPCL - PUNJAB. Enter your registered email address.'
      });
    }
    
    // Adani Electricity - MUMBAI - Consumer Mobile Number in optional1
    if (upperMessage.includes('CONSUMER MOBILE NUMBER') && upperMessage.includes('OPTIONAL1')) {
      requirements.push({
        key: 'mobile_number',
        label: 'Mobile Number',
        placeholder: 'Enter mobile number (10 digits)',
        required: true,
        parameter: 'optional1',
        description: 'Required for Adani Electricity - MUMBAI. Enter your registered mobile number.'
      });
    }
    
    // Adani Electricity - MUMBAI - Consumer Email Id in optional2
    if (upperMessage.includes('CONSUMER EMAIL ID') && upperMessage.includes('OPTIONAL2')) {
      requirements.push({
        key: 'email_id',
        label: 'Email ID',
        placeholder: 'Enter email address',
        required: true,
        parameter: 'optional2',
        description: 'Required for Adani Electricity - MUMBAI. Enter your registered email address.'
      });
    }
    
    // Adani Electricity - MUMBAI - UID in optional3
    if (upperMessage.includes('UID') && upperMessage.includes('OPTIONAL3')) {
      requirements.push({
        key: 'uid',
        label: 'UID',
        placeholder: 'Enter UID',
        required: true,
        parameter: 'optional3',
        description: 'Required for Adani Electricity - MUMBAI. Enter your UID.'
      });
    }
    
    return requirements;
  };

  // Get selected operator for conditional rendering
  const selectedOperatorObj = operators.find(op => op.id === selectedOperator);
  const operatorMessage = selectedOperatorObj?.metadata?.message?.toUpperCase() || '';
  const requiredFields = parseOperatorRequirements(operatorMessage);

  return (
    <DashboardLayout>
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">⚡ Electricity Bill Payment</h1>

      {/* Wallet Balance Display - Responsive */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs sm:text-sm opacity-90 mb-1">💰 Available Wallet Balance</p>
            <p className="text-3xl sm:text-4xl font-bold">
              {loadingBalance ? (
                <span className="animate-pulse">...</span>
              ) : (
                `₹${walletBalance.toFixed(2)}`
              )}
            </p>
            <p className="text-xs opacity-75 mt-1 sm:mt-2">
              {session?.user?.name && `${session.user.name}'s Wallet`}
            </p>
          </div>
          <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={fetchWalletBalance}
              disabled={loadingBalance}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all disabled:opacity-50 text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => router.push('/dashboard/wallet')}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg transition-all text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              💳 Add Money
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                setBillDetails(null); // Reset bill details when number changes
              }}
              placeholder="Enter consumer/meter number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Dynamic Fields for Operators with Additional Requirements */}
          {selectedOperator && requiredFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <input
                type="text"
                value={dynamicFields[field.key] || ''}
                onChange={(e) => setDynamicFields(prev => ({
                  ...prev,
                  [field.key]: e.target.value
                }))}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={field.required}
              />
              <p className="text-xs text-gray-500 mt-1">
                {field.description}
              </p>
            </div>
          ))}

          {/* Operator Selection - Searchable */}
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
              onChange={setSelectedOperator}
              placeholder="Search and select electricity board..."
              required
            />
          </div>

          {/* Circle Selection - Searchable */}
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
                      ? 'Click "Get Bill Details" to view your bill information.'
                      : 'Bill fetch not available for this operator. Enter amount manually.'}
                  </p>
                </div>
              </div>
              {operators.find(op => op.id === selectedOperator)?.metadata?.message && (
                <div className="bg-white border border-purple-300 rounded p-3 mb-3">
                  <p className="text-xs text-purple-800 font-medium">
                    ℹ️ {operators.find(op => op.id === selectedOperator)?.metadata?.message}
                  </p>
                </div>
              )}
              {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES' && !billDetails && (
                <button
                  type="button"
                  onClick={fetchBill}
                  disabled={fetchingBill}
                  className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {fetchingBill ? '⏳ Getting Your Bill...' : '🔍 Get Bill Details'}
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
                  <span className="text-gray-600 text-xs">Bill Period</span>
                  <p className="font-semibold text-gray-900">{billDetails.bill_period}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <span className="text-gray-600 text-xs">Due Date</span>
                  <p className="font-semibold text-red-600">{billDetails.due_date}</p>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-3 border-2 border-green-400">
                  <span className="text-gray-700 text-xs font-medium">Amount Due</span>
                  <p className="font-bold text-2xl text-green-700">₹{billDetails.due_amount}</p>
                </div>
              </div>
              <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Note:</strong> The amount has been auto-filled. Please verify before proceeding with payment.
                </p>
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

          {/* Reward Info - Generic Message */}
          {selectedOperator && amount && parseFloat(amount) > 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center">
                <div className="text-2xl mr-3">💰</div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {userRole === 'CUSTOMER' 
                      ? '🎉 You will earn cashback on this bill payment!' 
                      : '💼 You will earn commission on this bill payment!'}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {rewardLabel} will be credited to your wallet after successful transaction
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES' ? (
            billDetails ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? '⏳ Processing Payment...' : `💳 Pay Bill - ₹${amount}`}
              </button>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Please get your bill details first before making payment
                </p>
              </div>
            )
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading ? 'Processing...' : 'Pay Electricity Bill'}
            </button>
          )}

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

      {/* Info Panel */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Electricity Bill Payment Guide</h3>
        <ul className="text-blue-700 text-sm space-y-2">
          <li>• Enter your consumer number or meter ID as shown on your electricity bill</li>
          <li>• Select your electricity board/provider</li>
          <li>• Choose your state or circle</li>
          <li>• Enter the exact bill amount</li>
          <li>• Earn commission on every successful payment!</li>
          <li>• Payment is instant and secure</li>
        </ul>
      </div>

      {/* Popular Electricity Boards */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Popular Electricity Boards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operators.slice(0, 6).map((op) => (
            <div key={op.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{op.operator_name}</h4>
                  <p className="text-sm text-gray-600">{rewardLabel}: {op.commission_rate ?? 0}%</p>
                </div>
                <div className="text-3xl">⚡</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}