'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';

type ServiceType = 'PREPAID' | 'POSTPAID' | 'DTH' | 'ELECTRICITY';

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
  service_type: string;
  logo_url: string;
  min_amount: number;
  max_amount: number;
  commission_rate: number;
  cashback_enabled: boolean;
  cashback_min_percentage: number;
  cashback_max_percentage: number;
  metadata: any;
}

interface Circle {
  id: string;
  circle_code: string;
  circle_name: string;
}

interface Plan {
  plan_id: string;
  amount: number;
  validity: string;
  plan_type: string;
  description: string;
  category: string;
  data: string;
  voice: string;
  sms: string;
  features: string[];
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

export default function RechargePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [serviceType, setServiceType] = useState<ServiceType>('PREPAID');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  const [mobileNumber, setMobileNumber] = useState('');
  const [dthNumber, setDthNumber] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [planCategories, setPlanCategories] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchOperators();
    fetchCircles();
  }, [serviceType]);

  const fetchOperators = async () => {
    try {
      const res = await fetch(`/api/recharge/operators?service_type=${serviceType}`);
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

  const detectOperator = async () => {
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setDetecting(true);
    setMessage('');

    try {
      const res = await fetch('/api/recharge/detect-operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      const data = await res.json();
      
      if (data.success) {
        const operator = operators.find(op => op.operator_code === data.data.operator_code);
        const circle = circles.find(c => c.circle_code === data.data.circle_code);
        
        if (operator) setSelectedOperator(operator.id);
        if (circle) setSelectedCircle(circle.id);
        
        setMessage(`Detected: ${data.data.operator_name} - ${data.data.circle_name}`);
      } else {
        setMessage('Could not detect operator. Please select manually.');
      }
    } catch (error) {
      setMessage('Error detecting operator');
    } finally {
      setDetecting(false);
    }
  };

  const fetchPlans = async () => {
    if (!selectedOperator) return;

    const operator = operators.find(op => op.id === selectedOperator);
    if (!operator) return;

    setLoadingPlans(true);
    setPlans([]);

    try {
      const params = new URLSearchParams({
        operator_code: operator.operator_code,
        service_type: serviceType,
      });

      if (selectedCircle && serviceType === 'PREPAID') {
        const circle = circles.find(c => c.id === selectedCircle);
        if (circle) params.append('circle_code', circle.circle_code);
      }

      const res = await fetch(`/api/recharge/plans?${params}`);
      const data = await res.json();
      
      if (data.success && data.data.plans) {
        setPlans(data.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (selectedOperator && (serviceType === 'DTH' || selectedCircle)) {
      fetchPlans();
    }
  }, [selectedOperator, selectedCircle]);

  useEffect(() => {
    // Extract unique categories from plans
    if (plans.length > 0) {
      const categories = ['ALL', ...new Set(plans.map(p => p.category).filter(Boolean))];
      setPlanCategories(categories);
    }
  }, [plans]);

  const fetchBill = async () => {
    const numberToFetch = serviceType === 'ELECTRICITY' ? consumerNumber : mobileNumber;
    
    if (!numberToFetch || !selectedOperator) {
      setMessage(`Please enter ${serviceType === 'ELECTRICITY' ? 'consumer number' : 'mobile number'} and select operator`);
      setMessageType('error');
      return;
    }

    setFetchingBill(true);
    setMessage('');
    setBillDetails(null);

    try {
      const operator = operators.find(op => op.id === selectedOperator);
      
      const res = await fetch('/api/recharge/fetch-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_code: operator?.operator_code,
          consumer_number: numberToFetch,
          mobile_number: serviceType === 'POSTPAID' ? mobileNumber : undefined,
          service_type: serviceType,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setBillDetails(data.data);
        setAmount(data.data.due_amount);
        setCustomerName(data.data.consumer_name);
        if (serviceType === 'ELECTRICITY') {
          setConsumerNumber(numberToFetch);
        }
        setMessage(`✅ Bill fetched successfully for ${data.data.consumer_name}`);
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

  const filteredPlans = selectedCategory === 'ALL' 
    ? plans 
    : plans.filter(p => p.category === selectedCategory);

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for electricity/postpaid with bill fetch
    const operator = operators.find(op => op.id === selectedOperator);
    if ((serviceType === 'ELECTRICITY' || serviceType === 'POSTPAID') && 
        operator?.metadata?.bill_fetch === 'YES' && 
        !billDetails) {
      setMessage('⚠️ Please fetch bill details first before proceeding with payment.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const circle = circles.find(c => c.id === selectedCircle);

      const payload: any = {
        service_type: serviceType,
        operator_code: operator?.operator_code,
        amount: parseFloat(amount),
        customer_name: customerName || billDetails?.consumer_name,
      };

      if (serviceType === 'PREPAID') {
        payload.mobile_number = mobileNumber;
        payload.circle_code = circle?.circle_code;
        if (selectedPlan) payload.plan_id = selectedPlan.plan_id;
      } else if (serviceType === 'POSTPAID') {
        payload.mobile_number = mobileNumber;
        payload.circle_code = circle?.circle_code;
        // Include ref_id from bill fetch if available
        if (billDetails?.ref_id) {
          payload.ref_id = billDetails.ref_id;
          payload.bill_details = billDetails;
        }
      } else if (serviceType === 'DTH') {
        payload.dth_number = dthNumber;
        if (selectedPlan) payload.plan_id = selectedPlan.plan_id;
      } else if (serviceType === 'ELECTRICITY') {
        payload.consumer_number = consumerNumber;
        payload.circle_code = circle?.circle_code;
        // Include ref_id from bill fetch if available
        if (billDetails?.ref_id) {
          payload.ref_id = billDetails.ref_id;
          payload.bill_details = billDetails;
        }
      }

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
          setMessage(data.data.message || `✅ Recharge successful! Transaction ID: ${data.data.transaction_ref}`);
          setMessageType('success');
        }
        
        // Reset form
        setMobileNumber('');
        setDthNumber('');
        setConsumerNumber('');
        setAmount('');
        setCustomerName('');
        setSelectedPlan(null);
        setBillDetails(null);
      } else {
        setMessage(data.data?.message || data.message || '❌ Recharge failed');
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Mobile Recharge & Bill Payment</h1>

      {/* Service Type Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(['PREPAID', 'POSTPAID', 'DTH', 'ELECTRICITY'] as ServiceType[]).map((type) => (
          <button
            key={type}
            onClick={() => {
              setServiceType(type);
              setSelectedOperator('');
              setSelectedCircle('');
              setPlans([]);
              setSelectedPlan(null);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              serviceType === type
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mobile Number (Prepaid/Postpaid) */}
              {(serviceType === 'PREPAID' || serviceType === 'POSTPAID') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={detectOperator}
                      disabled={detecting || mobileNumber.length !== 10}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {detecting ? 'Detecting...' : 'Detect'}
                    </button>
                  </div>
                </div>
              )}

              {/* DTH Number */}
              {serviceType === 'DTH' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DTH Subscriber ID
                  </label>
                  <input
                    type="text"
                    value={dthNumber}
                    onChange={(e) => setDthNumber(e.target.value)}
                    placeholder="Enter DTH subscriber ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Consumer Number (Electricity/Postpaid with Bill Fetch) */}
              {(serviceType === 'ELECTRICITY' || serviceType === 'POSTPAID') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {serviceType === 'ELECTRICITY' ? 'Consumer Number' : 'Mobile Number'}
                    </label>
                    <input
                      type="text"
                      value={serviceType === 'ELECTRICITY' ? consumerNumber : mobileNumber}
                      onChange={(e) => {
                        if (serviceType === 'ELECTRICITY') {
                          setConsumerNumber(e.target.value);
                        } else {
                          setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                        }
                      }}
                      placeholder={`Enter ${serviceType === 'ELECTRICITY' ? 'consumer/meter' : 'mobile'} number`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Bill Fetch Instructions */}
                  {selectedOperator && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-3xl">📋</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-purple-900 mb-1">Bill Fetch Required</h3>
                          <p className="text-sm text-purple-700">
                            {operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES'
                              ? 'Click "Fetch Bill Details" button below to retrieve your bill information before payment.'
                              : 'Bill fetch not available for this operator. You can enter the amount manually and proceed with payment.'}
                          </p>
                        </div>
                      </div>
                      {operators.find(op => op.id === selectedOperator)?.metadata?.message && (
                        <div className="bg-white border border-purple-300 rounded p-3">
                          <p className="text-xs text-purple-800 font-medium">
                            ℹ️ <strong>Note:</strong> {operators.find(op => op.id === selectedOperator)?.metadata?.message}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Bill Details Display */}
              {billDetails && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-5 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-blue-900 text-lg">📄 Bill Details Fetched</h3>
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

              {/* Operator Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Operator
                </label>
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose operator...</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.operator_name} (Commission: {op.commission_rate}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Circle Selection (for Prepaid/Postpaid/Electricity) */}
              {(serviceType === 'PREPAID' || serviceType === 'POSTPAID' || serviceType === 'ELECTRICITY') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Circle
                  </label>
                  <select
                    value={selectedCircle}
                    onChange={(e) => setSelectedCircle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose circle...</option>
                    {circles.map((circle) => (
                      <option key={circle.id} value={circle.id}>
                        {circle.circle_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={operators.find(op => op.id === selectedOperator)?.min_amount || 10}
                  max={operators.find(op => op.id === selectedOperator)?.max_amount || 10000}
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

              {/* Submit Button - Different for Electricity/Postpaid */}
              {(serviceType === 'ELECTRICITY' || serviceType === 'POSTPAID') && 
               operators.find(op => op.id === selectedOperator)?.metadata?.bill_fetch === 'YES' ? (
                <>
                  {!billDetails ? (
                    <button
                      type="button"
                      onClick={fetchBill}
                      disabled={fetchingBill || !(serviceType === 'ELECTRICITY' ? consumerNumber : mobileNumber) || !selectedOperator}
                      className="w-full py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {fetchingBill ? '⏳ Fetching Bill...' : '🔍 Fetch Bill Details'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {loading ? '⏳ Processing Payment...' : `💳 Pay Bill - ₹${amount}`}
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? 'Processing...' : `Proceed to ${serviceType} ${serviceType === 'PREPAID' ? 'Recharge' : serviceType === 'DTH' ? 'Recharge' : 'Payment'}`}
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
        </div>

        {/* Right: Plans Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📋 Available Plans</h2>
            
            {loadingPlans ? (
              <div className="text-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📱</div>
                {selectedOperator ? 'No plans available for this operator' : 'Select operator and circle to view plans'}
              </div>
            ) : (
              <>
                {/* Plan Categories - Vertical */}
                {planCategories.length > 1 && (
                  <div className="mb-4 border-b pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {planCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-2 text-sm rounded-lg transition-all font-medium ${
                            selectedCategory === category
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plans Count */}
                <div className="mb-3 text-sm text-gray-600">
                  Showing <span className="font-semibold text-blue-600">{filteredPlans.length}</span> plans
                  {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
                </div>

                {/* Plans List - Scrollable */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                  {filteredPlans.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No plans in this category
                    </div>
                  ) : (
                    filteredPlans.map((plan) => (
                      <div
                        key={plan.plan_id}
                        onClick={() => handlePlanSelect(plan)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedPlan?.plan_id === plan.plan_id
                            ? 'border-blue-600 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <span className="font-bold text-xl text-blue-600">₹{plan.amount}</span>
                            {plan.category && plan.category !== 'ALL' && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                                {plan.category}
                              </span>
                            )}
                          </div>
                          {plan.validity && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium whitespace-nowrap">
                              {plan.validity}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{plan.description}</p>
                        <div className="space-y-1">
                          {plan.data && <p className="text-xs text-gray-600 flex items-center"><span className="mr-1">📊</span> {plan.data}</p>}
                          {plan.voice && <p className="text-xs text-gray-600 flex items-center"><span className="mr-1">📞</span> {plan.voice}</p>}
                          {plan.sms && <p className="text-xs text-gray-600 flex items-center"><span className="mr-1">💬</span> {plan.sms}</p>}
                        </div>
                        {selectedPlan?.plan_id === plan.plan_id && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <span className="text-xs text-blue-600 font-semibold">✓ Selected</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Plans Section Below Form (for mobile/prepaid/DTH) */}
      {(serviceType === 'PREPAID' || serviceType === 'DTH') && plans.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📱 Browse All Plans</h2>
          
          {/* Category Tabs */}
          {planCategories.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {planCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category} ({plans.filter(p => category === 'ALL' || p.category === category).length})
                </button>
              ))}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.plan_id}
                onClick={() => handlePlanSelect(plan)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan?.plan_id === plan.plan_id
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-2xl text-blue-600">₹{plan.amount}</span>
                  {plan.validity && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                      {plan.validity}
                    </span>
                  )}
                </div>
                {plan.category && plan.category !== 'ALL' && (
                  <div className="mb-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                      {plan.category}
                    </span>
                  </div>
                )}
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{plan.description}</p>
                <div className="space-y-1 text-xs text-gray-600">
                  {plan.data && <p className="flex items-center"><span className="mr-1">📊</span> {plan.data}</p>}
                  {plan.voice && <p className="flex items-center"><span className="mr-1">📞</span> {plan.voice}</p>}
                  {plan.sms && <p className="flex items-center"><span className="mr-1">💬</span> {plan.sms}</p>}
                </div>
                {selectedPlan?.plan_id === plan.plan_id && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-center">
                    <span className="text-sm text-blue-600 font-bold">✓ SELECTED</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
