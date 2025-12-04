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
  kwikapi_opid: string;
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

export default function MobileRechargePageEnhanced() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const userRole = session?.user?.role;
  const rewardLabel = userRole === 'CUSTOMER' ? 'Cashback' : 'Commission';

  const [serviceType, setServiceType] = useState<ServiceType>('PREPAID');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [planCategories, setPlanCategories] = useState<PlanCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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
      setMessage('⚠️ Please enter a valid 10-digit mobile number');
      return;
    }

    setDetecting(true);
    setMessage('🔍 Detecting operator and circle from KWIKAPI...');

    try {
      console.log('🔍 [Frontend] Calling detect-operator API for:', mobileNumber);

      const res = await fetch('/api/recharge/detect-operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      const data = await res.json();
      console.log('📦 [Frontend] Detection response:', data);

      if (data.success && data.data) {
        console.log('✅ [Frontend] Detection successful:', {
          operator_code: data.data.operator_code,
          operator_name: data.data.operator_name,
          circle_code: data.data.circle_code,
          circle_name: data.data.circle_name,
          detection_method: data.data.detection_method
        });

        // Find operator by operator_code or kwikapi_opid
        let operator = operators.find(op => op.operator_code === data.data.operator_code);

        // If not found by code, try by kwikapi_opid
        if (!operator && data.data.kwikapi_opid) {
          operator = operators.find(op => op.kwikapi_opid === data.data.kwikapi_opid.toString());
        }

        const circle = circles.find(c => c.circle_code === data.data.circle_code);

        console.log('🔍 [Frontend] Database lookup:', {
          foundOperator: operator ? { id: operator.id, name: operator.operator_name } : null,
          foundCircle: circle ? { id: circle.id, name: circle.circle_name } : null
        });

        if (operator) {
          setSelectedOperator(operator.id);
          console.log('✅ [Frontend] Operator selected:', operator.operator_name);
        } else {
          console.warn('⚠️ [Frontend] Operator not found in database:', data.data.operator_code);
        }


        if (circle) {
          setSelectedCircle(circle.id);
          console.log('✅ [Frontend] Circle selected:', circle.circle_name);
        } else {
          console.warn('⚠️ [Frontend] Circle not found in database:', data.data.circle_code);
        }

        // Build success message
        let successMessage = `✅ Detected: ${data.data.operator_name} - ${data.data.circle_name} (Real-time from KWIKAPI)`;

        // Add credit info if available (check both fields for backwards compatibility)
        const credits = data.data.credit_balance || data.data.hit_credit;
        if (credits) {
          successMessage += `\n💳 Remaining Credits: ${credits}`;
        }

        setMessage(successMessage);

        if (!operator || !circle) {
          setMessage(prev => prev + '\n⚠️ Some information could not be matched. Please verify the selection.');
        }
      } else {
        console.error('❌ [Frontend] Detection failed:', data.message);
        setMessage(`⚠️ ${data.message || 'Could not detect operator. Please select manually.'}`);
      }
    } catch (error: any) {
      console.error('❌ [Frontend] Detection error:', error);
      setMessage(`❌ Error: ${error.message || 'Failed to detect operator. Please try again.'}`);
    } finally {
      setDetecting(false);
    }
  };

  const fetchPlans = async () => {
    if (serviceType === 'POSTPAID') {
      setPlanCategories([]);
      setSelectedCategory('ALL');
      return;
    }

    if (!selectedOperator || !selectedCircle) return;

    const operator = operators.find(op => op.id === selectedOperator);
    const circle = circles.find(c => c.id === selectedCircle);
    if (!operator || !circle) return;

    setLoadingPlans(true);
    setPlanCategories([]);
    setSelectedCategory('ALL');

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
        setSelectedCategory('ALL');
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
    // Scroll to form on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const getAllPlans = () => {
    return planCategories.flatMap(cat => cat.plans);
  };

  const getFilteredPlans = () => {
    if (selectedCategory === 'ALL') {
      return getAllPlans();
    }
    return planCategories.find(cat => cat.code === selectedCategory)?.plans || [];
  };

  const totalPlansCount = planCategories.reduce((sum, cat) => sum + cat.plans.length, 0);

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
                setPlanCategories([]);
                setSelectedPlan(null);
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${serviceType === type
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile Number */}
              <div className="md:col-span-2">
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
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {detecting ? 'Detecting...' : 'Auto Detect'}
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
                  placeholder="Enter amount or select a plan"
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

        {/* Plans Section - Full Width Below Form */}
        {serviceType === 'PREPAID' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span>📋</span>
              <span>Available Recharge Plans</span>
              {totalPlansCount > 0 && (
                <span className="text-sm font-normal text-gray-600">
                  ({totalPlansCount} plans available)
                </span>
              )}
            </h2>

            {loadingPlans ? (
              <div className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading plans...</p>
                </div>
              </div>
            ) : planCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-lg font-semibold mb-2">
                  {selectedOperator && selectedCircle
                    ? 'No plans available for this operator'
                    : 'Select operator and circle to view available plans'}
                </p>
                <p className="text-sm">
                  Choose your operator and circle from the form above to see recharge plans
                </p>
              </div>
            ) : (
              <>
                {/* Enhanced Horizontal Category Filter */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category</h3>
                  <div className="relative group">
                    {/* Left Scroll Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const container = document.getElementById('category-scroll-container');
                        if (container) {
                          container.scrollBy({ left: -200, behavior: 'smooth' });
                        }
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200"
                      aria-label="Scroll left"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Right Scroll Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const container = document.getElementById('category-scroll-container');
                        if (container) {
                          container.scrollBy({ left: 200, behavior: 'smooth' });
                        }
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-lg rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200"
                      aria-label="Scroll right"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Gradient indicators */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none z-10" />

                    {/* Scrollable categories */}
                    <div
                      id="category-scroll-container"
                      className="overflow-x-auto pb-2 scroll-smooth"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                      }}
                    >
                      <div className="flex gap-3 px-1">
                        {/* All Plans Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('ALL')}
                          className={`px-5 py-4 rounded-2xl font-semibold transition-all whitespace-nowrap ${selectedCategory === 'ALL'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl transform scale-105'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📋</span>
                            <div className="text-left">
                              <div className="font-bold">All Plans</div>
                              <div className="text-xs opacity-75">
                                {totalPlansCount} plans
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Category Buttons */}
                        {planCategories.map((category) => (
                          <button
                            type="button"
                            key={category.code}
                            onClick={() => setSelectedCategory(category.code)}
                            className={`px-5 py-4 rounded-2xl font-semibold transition-all whitespace-nowrap ${selectedCategory === category.code
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl transform scale-105'
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{category.icon}</span>
                              <div className="text-left">
                                <div className="font-bold">{category.name}</div>
                                <div className="text-xs opacity-75">
                                  {category.plans.length} plans
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getFilteredPlans().map((plan, index) => (
                    <div
                      key={`${plan.amount}-${index}`}
                      onClick={() => handlePlanSelect(plan)}
                      className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg group ${selectedPlan?.amount === plan.amount &&
                        selectedPlan?.validity === plan.validity
                        ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      {/* Popular badge for common amounts */}
                      {(plan.amount === 299 || plan.amount === 399 || plan.amount === 499) && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-bold shadow-md">
                          POPULAR
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Amount</div>
                          <div className="text-2xl font-bold text-blue-600">
                            ₹{plan.amount}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-600 mb-1">Validity</div>
                          <div className="text-sm font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            {plan.validity}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2 min-h-[40px]">
                        {plan.description}
                      </p>

                      {plan.type && (
                        <span className="inline-block text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                          {plan.type}
                        </span>
                      )}

                      {selectedPlan?.amount === plan.amount &&
                        selectedPlan?.validity === plan.validity && (
                          <div className="mt-3 flex items-center text-blue-600 text-sm font-semibold">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Selected
                          </div>
                        )}

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none rounded-xl" />
                    </div>
                  ))}
                </div>

                {getFilteredPlans().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No plans available in this category</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {serviceType === 'POSTPAID' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📞</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Postpaid Bill Payment</h3>
            <p className="text-gray-600">
              Enter the bill amount directly in the form above. No plan selection required for postpaid.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
    </DashboardLayout>
  );
}
