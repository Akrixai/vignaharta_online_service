'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';

type ServiceType = 'PREPAID' | 'POSTPAID';

interface Operator {
  id: string;
  operator_code: string;
  operator_name: string;
  service_type: string;
  logo_url: string;
  min_amount: number;
  max_amount: number;
  commission_rate: number;
}

interface Circle {
  id: string;
  circle_code: string;
  circle_name: string;
}

interface Plan {
  amount: number;
  validity: string;
  description: string;
  type: string;
}

interface PlanCategory {
  code: string;
  name: string;
  icon: string;
  order: number;
  plans: Plan[];
}

export default function MobileRechargePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const userRole = session?.user?.role;
  const rewardLabel = userRole === 'CUSTOMER' ? 'Cashback' : 'Commission';
  
  const [serviceType, setServiceType] = useState<ServiceType>('PREPAID');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [planCategories, setPlanCategories] = useState<PlanCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [message, setMessage] = useState('');

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
        
        setMessage(`✅ Detected: ${data.data.operator_name} - ${data.data.circle_name}`);
      } else {
        setMessage('⚠️ Could not detect operator. Please select manually.');
      }
    } catch (error) {
      setMessage('❌ Error detecting operator');
    } finally {
      setDetecting(false);
    }
  };

  const fetchPlans = async () => {
    // Only fetch plans for PREPAID, not for POSTPAID
    if (serviceType === 'POSTPAID') {
      setPlanCategories([]);
      setSelectedCategory('');
      return;
    }

    if (!selectedOperator || !selectedCircle) return;

    const operator = operators.find(op => op.id === selectedOperator);
    const circle = circles.find(c => c.id === selectedCircle);
    if (!operator || !circle) return;

    setLoadingPlans(true);
    setPlanCategories([]);
    setSelectedCategory('');

    try {
      const params = new URLSearchParams({
        operator_code: operator.kwikapi_opid.toString(),
        circle_code: circle.circle_code,
        service_type: serviceType,
      });

      const res = await fetch(`/api/recharge/plans?${params}`);
      const data = await res.json();
      
      if (data.success && data.data.categories) {
        setPlanCategories(data.data.categories);
        // Auto-select first category
        if (data.data.categories.length > 0) {
          setSelectedCategory(data.data.categories[0].code);
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (selectedOperator && selectedCircle) {
      fetchPlans();
    }
  }, [selectedOperator, selectedCircle, serviceType]);

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const operator = operators.find(op => op.id === selectedOperator);
      const circle = circles.find(c => c.id === selectedCircle);

      const payload: any = {
        service_type: serviceType,
        operator_code: operator?.operator_code,
        mobile_number: mobileNumber,
        circle_code: circle?.circle_code,
        amount: parseFloat(amount),
        customer_name: customerName,
      };

      // Include plan details if selected (for reference only)
      if (selectedPlan) {
        payload.plan_details = {
          amount: selectedPlan.amount,
          validity: selectedPlan.validity,
          description: selectedPlan.description,
        };
      }

      const res = await fetch('/api/recharge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const reward = data.data.reward_amount || 0;
        setMessage(`✅ Recharge successful! ${data.data.reward_label}: ₹${reward.toFixed(2)} | Transaction ID: ${data.data.transaction_ref}`);
        setMobileNumber('');
        setAmount('');
        setCustomerName('');
        setSelectedPlan(null);
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

  return (
    <DashboardLayout>
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📱 Mobile Recharge</h1>

      {/* Service Type Tabs */}
      <div className="flex gap-2 mb-8">
        {(['PREPAID', 'POSTPAID'] as ServiceType[]).map((type) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mobile Number */}
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
                      {op.operator_name} ({rewardLabel}: {op.commission_rate}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Circle Selection */}
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

              {/* Reward Preview */}
              {selectedOperator && amount && parseFloat(amount) > 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">💰</div>
                    <div>
                      <p className="text-sm font-medium text-green-800">{rewardLabel} Earnings</p>
                      <p className="text-lg font-bold text-green-900">
                        ₹{((parseFloat(amount) * (operators.find(op => op.id === selectedOperator)?.commission_rate || 0)) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? 'Processing...' : `Proceed to ${serviceType} Recharge`}
              </button>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right: Plans */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Available Plans</h2>
            
            {serviceType === 'POSTPAID' ? (
              <div className="text-center py-8 text-gray-600">
                <div className="text-4xl mb-3">📞</div>
                <p className="font-semibold mb-2">Postpaid Bill Payment</p>
                <p className="text-sm">Enter the bill amount directly. No plan selection required for postpaid.</p>
              </div>
            ) : loadingPlans ? (
              <div className="text-center py-8 text-gray-500">Loading plans...</div>
            ) : planCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedOperator && selectedCircle ? 'No plans available' : 'Select operator and circle to view plans'}
              </div>
            ) : (
              <>
                {/* Category Filter */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {planCategories.map((category) => (
                    <button
                      key={category.code}
                      onClick={() => setSelectedCategory(category.code)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category.code
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                      <span className="ml-1 text-xs opacity-75">({category.plans.length})</span>
                    </button>
                  ))}
                </div>

                {/* Plans List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {planCategories
                    .find((cat) => cat.code === selectedCategory)
                    ?.plans.map((plan, index) => (
                      <div
                        key={`${plan.amount}-${index}`}
                        onClick={() => handlePlanSelect(plan)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedPlan?.amount === plan.amount && selectedPlan?.validity === plan.validity
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-lg text-blue-600">₹{plan.amount}</span>
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">{plan.validity}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">{plan.description}</p>
                        {plan.type && (
                          <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {plan.type}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
