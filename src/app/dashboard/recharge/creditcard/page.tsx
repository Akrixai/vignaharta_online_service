'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import SearchableSelect from '@/components/SearchableSelect';
import RechargeBrandingFooter from '@/components/recharge/RechargeBrandingFooter';

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

interface FieldOption {
  value: string;
  label: string;
}

interface DynamicField {
  key: string;
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  order: number;
  type: string;
  kwikapi_param: string;
  description: string;
  options: FieldOption[];
}

export default function CreditCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [operators, setOperators] = useState<Operator[]>([]);

  const [selectedOperator, setSelectedOperator] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);

  // Wallet balance state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Dynamic fields for different operators
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string }>({});

  // Two-step process state
  const [currentStep, setCurrentStep] = useState(1);
  const [operatorSelected, setOperatorSelected] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchOperators();
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
      const res = await fetch('/api/recharge/operators?service_type=CREDITCARD');
      const data = await res.json();
      if (data.success) {
        setOperators(data.data);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchBillerDetails = async (operatorId: string) => {
    const operator = operators.find(op => op.id === operatorId);
    if (!operator?.kwikapi_opid) {
      console.log('🔧 [Biller Details] No KwikAPI opid found for operator:', operator);
      return;
    }

    console.log('🔧 [Biller Details] Fetching details for operator:', operator.operator_name, 'opid:', operator.kwikapi_opid);

    try {
      const res = await fetch('/api/kwikapi/biller-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opid: operator.kwikapi_opid }),
      });

      const data = await res.json();
      console.log('🔧 [Biller Details] API Response:', data);

      if (data.success && data.data) {
        console.log('🔧 [Biller Details] Parameters from API:', data.data.parameters);

        // Process parameters and create dynamic fields
        const processedFields: DynamicField[] = [];

        // Process parameters from API response
        if (data.data.parameters && Array.isArray(data.data.parameters) && data.data.parameters.length > 0) {
          console.log('🔧 [Biller Details] Processing API parameters:', data.data.parameters);

          data.data.parameters.forEach((apiParam: any, index: number) => {
            const paramName = apiParam.name || apiParam.label;
            const paramLabel = apiParam.label || apiParam.name;
            const kwikApiParam = apiParam.kwikapi_param;

            console.log(`🔧 [Biller Details] Processing param ${index}:`, { paramName, paramLabel, kwikApiParam });

            if (paramName && paramLabel && kwikApiParam) {
              let fieldConfig: DynamicField = {
                key: `param_${index + 1}`,
                name: paramName,
                label: paramLabel,
                placeholder: `Enter ${paramLabel.toLowerCase()}`,
                required: true,
                order: index + 1,
                type: 'text',
                kwikapi_param: kwikApiParam,
                description: `Required parameter: ${paramLabel}`,
                options: [] as FieldOption[]
              };

              processedFields.push(fieldConfig);
            }
          });

          console.log('🔧 [Biller Details] Final processed fields:', processedFields);
          setDynamicFields(processedFields);
        } else {
          console.log('🔧 [Biller Details] No parameters found in API response');
          setDynamicFields([]);
        }
      } else {
        console.log('🔧 [Biller Details] API call failed or no data:', data.message);
        setDynamicFields([]);
      }
    } catch (error) {
      console.error('🔧 [Biller Details] Error fetching biller details:', error);
      setDynamicFields([]);
    }
  };

  const fetchBill = async () => {
    // Get the primary identifier from dynamic fields or fallback to cardNumber
    let primaryNumber = '';
    let hasRequiredFields = true;
    
    if (dynamicFields.length > 0) {
      // Find the primary number field (usually the first required field)
      const primaryField = dynamicFields.find(field => 
        field.required && (
          field.name.toLowerCase().includes('card') ||
          field.name.toLowerCase().includes('number') ||
          field.name.toLowerCase().includes('account') ||
          field.name.toLowerCase().includes('id')
        )
      );
      
      if (primaryField) {
        primaryNumber = dynamicFieldValues[primaryField.key] || '';
      }
      
      // Check if all required fields are filled
      const missingFields = dynamicFields.filter(field => 
        field.required && !dynamicFieldValues[field.key]
      );
      
      if (missingFields.length > 0) {
        setMessage(`⚠️ Please fill required fields: ${missingFields.map(f => f.label).join(', ')}`);
        setMessageType('error');
        return;
      }
    } else {
      primaryNumber = cardNumber;
      if (!primaryNumber) {
        setMessage('Please enter card number');
        setMessageType('error');
        return;
      }
    }

    if (!selectedOperator) {
      setMessage('Please select credit card provider');
      setMessageType('error');
      return;
    }

    const operator = operators.find(op => op.id === selectedOperator);

    // Check if operator supports bill fetch
    if (operator?.metadata?.bill_fetch !== 'YES') {
      setMessage('⚠️ Bill fetch not supported for this operator. Please enter the amount manually.');
      setMessageType('info');
      return;
    }

    setFetchingBill(true);
    setMessage('🔍 Fetching your bill details...');
    setMessageType('info');
    setBillDetails(null);

    try {
      console.log('🔍 [Frontend] Fetching bill for:', {
        operator: operator.operator_name,
        card: primaryNumber,
        service_type: 'CREDITCARD'
      });

      // Prepare dynamic parameters
      const dynamicParams: { [key: string]: string } = {};
      dynamicFields.forEach(field => {
        const value = dynamicFieldValues[field.key];
        if (value) {
          dynamicParams[field.kwikapi_param] = value;
        }
      });

      // Use KwikAPI bill fetch endpoint
      const res = await fetch('/api/kwikapi/bill-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opid: operator?.kwikapi_opid,
          number: primaryNumber,
          mobile: customerMobile || primaryNumber,
          amount: parseFloat(amount) || 100, // Default amount for bill fetch
          ...dynamicParams
        }),
      });

      const data = await res.json();

      console.log('📦 [Frontend] Bill fetch response:', data);

      if (data.success) {
        const billData = data.data;
        setBillDetails({
          consumer_name: billData.customer_name || billData.customername || 'N/A',
          bill_number: billData.bill_number || billData.billnumber || 'N/A',
          bill_amount: billData.bill_amount || billData.billamount || '0',
          due_amount: billData.due_amount || billData.dueamount || '0',
          due_date: billData.due_date || billData.duedate || 'N/A',
          bill_date: billData.bill_date || billData.billdate || 'N/A',
          bill_period: billData.bill_period || billData.billperiod || 'N/A',
          ref_id: billData.ref_id || billData.refid,
        });
        setAmount((billData.due_amount || billData.dueamount || '0').toString());
        setCustomerName(billData.customer_name || billData.customername || '');
        setMessage(`✅ Bill found for ${billData.customer_name || billData.customername || 'customer'} - Amount: ₹${billData.due_amount || billData.dueamount}`);
        setMessageType('success');
      } else {
        setMessage(data.message || 'Unable to fetch bill');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(`❌ Error fetching bill: ${error.message}`);
      setMessageType('error');
    } finally {
      setFetchingBill(false);
    }
  };

  // Handle operator selection
  const handleOperatorSelect = (operatorId: string) => {
    setSelectedOperator(operatorId);
    setOperatorSelected(true);
    setCurrentStep(2);
    
    // Reset form when operator changes
    setCardNumber('');
    setAmount('');
    setCustomerName('');
    setCustomerMobile('');
    setBillDetails(null);
    setDynamicFieldValues({});
    setMessage('');
    
    // Fetch biller details for the selected operator
    fetchBillerDetails(operatorId);
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

    // Get the primary identifier from dynamic fields or fallback to cardNumber
    let primaryNumber = '';
    
    if (dynamicFields.length > 0) {
      // Find the primary number field (usually the first required field)
      const primaryField = dynamicFields.find(field => 
        field.required && (
          field.name.toLowerCase().includes('card') ||
          field.name.toLowerCase().includes('number') ||
          field.name.toLowerCase().includes('account') ||
          field.name.toLowerCase().includes('id')
        )
      );
      
      if (primaryField) {
        primaryNumber = dynamicFieldValues[primaryField.key] || '';
      }
      
      // Validate dynamic fields
      const missingFields = dynamicFields.filter(field => 
        field.required && !dynamicFieldValues[field.key]
      );
      
      if (missingFields.length > 0) {
        setMessage(`⚠️ Please fill required fields: ${missingFields.map(f => f.label).join(', ')}`);
        setMessageType('error');
        return;
      }
    } else {
      primaryNumber = cardNumber;
    }

    // Validation
    if (!selectedOperator || !primaryNumber || !amount) {
      setMessage('⚠️ Please fill all required fields.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const operator = operators.find(op => op.id === selectedOperator);

      // Prepare dynamic parameters
      const dynamicParams: { [key: string]: string } = {};
      dynamicFields.forEach(field => {
        const value = dynamicFieldValues[field.key];
        if (value) {
          dynamicParams[field.kwikapi_param] = value;
        }
      });

      // Use KwikAPI bill payment endpoint
      const payload: any = {
        opid: operator?.kwikapi_opid || operator?.operator_code,
        number: primaryNumber,
        amount: parseFloat(amount),
        mobile: customerMobile || primaryNumber,
        customer_name: customerName,
        ...dynamicParams
      };

      // Add bill reference if available
      if (billDetails?.ref_id) {
        payload.ref_id = billDetails.ref_id;
      }

      const res = await fetch('/api/kwikapi/bill-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const responseData = data.data;
        const status = responseData.status;
        const message = responseData.message || 'Transaction completed';
        const operatorRef = responseData.opr_id || responseData.operator_ref || '';

        // Show real-time KwikAPI status
        if (status === 'SUCCESS') {
          // Clean up message - remove KwikAPI balance if present in the message string
          let cleanMessage = message.replace(/Your Balance is.*$/i, '').trim();
          if (cleanMessage.endsWith('.')) cleanMessage = cleanMessage.slice(0, -1);

          const finalSuccessMsg = `✅ ${cleanMessage}! Your credit card bill payment for ${primaryNumber} was successful.${operatorRef ? `\nRef: ${operatorRef}` : ''}`;

          setMessage(finalSuccessMsg);
          setMessageType('success');

          // Refresh wallet balance on success
          fetchWalletBalance();

          // Reset form on success
          setCardNumber('');
          setAmount('');
          setCustomerName('');
          setCustomerMobile('');
          setBillDetails(null);
          setDynamicFieldValues({});
          setSelectedOperator('');
          setOperatorSelected(false);
          setCurrentStep(1);
        } else if (status === 'PENDING') {
          setMessage(
            `⏳ ${message}${operatorRef ? `\nRef: ${operatorRef}` : ''}`
          );
          setMessageType('info');
        } else {
          setMessage(
            `❌ ${message}${operatorRef ? `\nRef: ${operatorRef}` : ''}`
          );
          setMessageType('error');
        }
      } else {
        setMessage(`❌ ${data.message || 'Transaction failed'}`);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">💳 Credit Card Bill Payment</h1>

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-center">
            💳 CREDIT CARD BILL PAYMENT
          </div>
        </div>

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

        {/* Two-Step Process */}
        {currentStep === 1 ? (
          /* Step 1: Operator Selection */
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Step 1: Select Your Credit Card Provider</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Credit Card Provider
              </label>
              <SearchableSelect
                options={operators.map(op => ({
                  value: op.id,
                  label: op.operator_name,
                  data: op
                }))}
                value={selectedOperator}
                onChange={handleOperatorSelect}
                placeholder="Search and select your credit card provider..."
                required
              />
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                {message}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Bill Payment Form */
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Step 2: Enter Bill Details</h2>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setOperatorSelected(false);
                  setSelectedOperator('');
                  setMessage('');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Change Provider
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Dynamic Fields - All fields from API */}
                {dynamicFields.map((field) => (
                  <div key={field.key} className={dynamicFields.length === 1 ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={dynamicFieldValues[field.key] || ''}
                        onChange={(e) => setDynamicFieldValues(prev => ({
                          ...prev,
                          [field.key]: e.target.value
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required={field.required}
                      >
                        <option value="">{field.placeholder}</option>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={dynamicFieldValues[field.key] || ''}
                        onChange={(e) => setDynamicFieldValues(prev => ({
                          ...prev,
                          [field.key]: e.target.value
                        }))}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required={field.required}
                      />
                    )}
                    {field.description && (
                      <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                    )}
                  </div>
                ))}

                {/* Fallback Card Number field - only show if no dynamic fields */}
                {dynamicFields.length === 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Card Number *
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="Enter your credit card number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {/* Customer Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter mobile number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Fetch Bill Button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={fetchBill}
                    disabled={fetchingBill || (!cardNumber && dynamicFields.length === 0) || !selectedOperator}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                  >
                    {fetchingBill ? '⏳ Fetching Bill...' : '🔍 Fetch Bill Details'}
                  </button>
                </div>

                {/* Bill Details Display */}
                {billDetails && (
                  <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3">📋 Bill Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Customer Name:</span>
                        <span className="ml-2 text-gray-900">{billDetails.consumer_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Bill Number:</span>
                        <span className="ml-2 text-gray-900">{billDetails.bill_number}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Due Amount:</span>
                        <span className="ml-2 text-gray-900 font-bold">₹{billDetails.due_amount}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Due Date:</span>
                        <span className="ml-2 text-gray-900">{billDetails.due_date}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Bill Period:</span>
                        <span className="ml-2 text-gray-900">{billDetails.bill_period}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Bill Date:</span>
                        <span className="ml-2 text-gray-900">{billDetails.bill_date}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to pay"
                    min={operators.find(op => op.id === selectedOperator)?.min_amount || 100}
                    max={operators.find(op => op.id === selectedOperator)?.max_amount || 100000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Customer Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? '⏳ Processing Payment...' : `🚀 Pay Credit Card Bill - ₹${amount || '0'}`}
              </button>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg ${messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Branding Footer */}
      <RechargeBrandingFooter />
    </DashboardLayout>
  );
}