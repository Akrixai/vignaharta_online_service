'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import SearchableSelect from '@/components/SearchableSelect';
import PlanDetailsModal from '@/components/PlanDetailsModal';

interface Operator {
    id: string;
    operator_code: string;
    operator_name: string;
    service_type: string;
    logo_url: string;
    min_amount: number;
    max_amount: number;
    kwikapi_opid: string;
    metadata?: any;
}

interface Plan {
    amount: number;
    validity: string;
    description: string;
    type: string;
    planName?: string;
    channels?: string;
    paidChannels?: string;
    hdChannels?: string;
    lastUpdate?: string;
}

interface PlanCategory {
    code: string;
    name: string;
    icon: string;
    order: number;
    plans: Plan[];
}

export default function DTHRechargePageEnhanced() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const userRole = session?.user?.role;
    const rewardLabel = userRole === 'CUSTOMER' ? 'Cashback' : 'Commission';

    const [operators, setOperators] = useState<Operator[]>([]);
    const [planCategories, setPlanCategories] = useState<PlanCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    const [selectedOperator, setSelectedOperator] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const [dthNumber, setDthNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [customerName, setCustomerName] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
    
    // Wallet balance state
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [loadingBalance, setLoadingBalance] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPlan, setModalPlan] = useState<Plan | null>(null);

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
            const res = await fetch('/api/recharge/operators?service_type=DTH');
            const data = await res.json();
            if (data.success) {
                setOperators(data.data);
            }
        } catch (error) {
            console.error('Error fetching operators:', error);
        }
    };

    const detectOperator = async () => {
        if (!dthNumber || dthNumber.length < 8) {
            setMessage('⚠️ Please enter a valid DTH subscriber ID');
            setMessageType('error');
            return;
        }

        setDetecting(true);
        setMessage('🔍 Detecting your DTH operator...');
        setMessageType('info');

        try {
            // DTH operator detection logic can be added here if API supports it
            // For now, we'll show a message that user should select operator
            setMessage('ℹ️ Please select your DTH operator from the list');
            setMessageType('info');
        } catch (error: any) {
            console.error('❌ Detection error:', error);
            setMessage('ℹ️ Please select your DTH operator from the list');
            setMessageType('info');
        } finally {
            setDetecting(false);
        }
    };

    const fetchPlans = async () => {
        if (!selectedOperator) return;

        const operator = operators.find(op => op.id === selectedOperator);
        if (!operator) return;

        setLoadingPlans(true);
        setPlanCategories([]);
        setSelectedCategory('ALL');

        try {
            // For DTH, we use the dedicated DTH_plans.php API endpoint
            // Only opid (operator ID) is required - DTH plans are nationwide
            const params = new URLSearchParams({
                operator_code: operator.kwikapi_opid || operator.operator_code,
                service_type: 'DTH',
            });

            console.log('📱 Fetching DTH plans with params:', {
                operator_code: operator.kwikapi_opid || operator.operator_code,
                operator_name: operator.operator_name,
                service_type: 'DTH',
                api_endpoint: 'DTH_plans.php'
            });

            const res = await fetch(`/api/recharge/plans?${params}`);
            const data = await res.json();

            console.log('📦 DTH Plans API Response:', data);

            // Handle different response scenarios
            if (data.success && data.data?.categories) {
                console.log(`✅ DTH Plans loaded: ${data.data.categories.length} categories`);
                setPlanCategories(data.data.categories);
                setSelectedCategory('ALL');
                setMessage('');
                setMessageType('success');
            } else if (data.isDTH && (data.reason === 'dth_plans_not_supported' || data.reason === 'no_dth_plans_available')) {
                // DTH plans not supported by API - this is expected
                console.warn('⚠️ DTH Plans not available from KWIKAPI:', data.message);
                setPlanCategories([]);
                setMessage(`ℹ️ ${data.message || 'DTH plans are not available. Please enter a custom amount.'}\n${data.suggestion || ''}`);
                setMessageType('info');
            } else {
                // Other errors
                console.error('❌ Failed to load DTH plans:', data.message);
                setPlanCategories([]);
                setMessage(`ℹ️ ${data.message || 'Plans not available. Please enter your recharge amount.'}`);
                setMessageType('info');
            }
        } catch (error) {
            console.error('❌ Error fetching DTH plans:', error);
            setPlanCategories([]);
            setMessage('ℹ️ Plans not available. Please enter your recharge amount.');
            setMessageType('info');
        } finally {
            setLoadingPlans(false);
        }
    };


    useEffect(() => {
        if (selectedOperator) {
            fetchPlans();
        }
    }, [selectedOperator]);

    // Auto-fetch plans when DTH number is entered (10+ digits) and operator is selected
    useEffect(() => {
        if (dthNumber.length >= 10 && selectedOperator) {
            fetchPlans();
        }
    }, [dthNumber, selectedOperator]);

    const handlePlanClick = (plan: Plan) => {
        setModalPlan(plan);
        setIsModalOpen(true);
    };

    const handlePlanSelect = (plan: Plan) => {
        setSelectedPlan(plan);
        setAmount(plan.amount.toString());
        setIsModalOpen(false);
        // Scroll to form on mobile
        if (window.innerWidth < 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        setLoading(true);
        setMessage('');

        try {
            const operator = operators.find(op => op.id === selectedOperator);

            const payload: any = {
                service_type: 'DTH',
                operator_code: operator?.operator_code,
                dth_number: dthNumber,
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
                setMessage(`✅ DTH Recharge successful! ${data.data.reward_label}: ₹${reward.toFixed(2)} | Transaction ID: ${data.data.transaction_ref}`);
                setMessageType('success');
                
                // Refresh wallet balance
                fetchWalletBalance();
                
                setDthNumber('');
                setAmount('');
                setCustomerName('');
                setSelectedPlan(null);
            } else {
                setMessage(`❌ ${data.message}`);
                setMessageType('error');
            }
        } catch (error: any) {
            setMessage(`❌ Error: ${error.message}`);
            setMessageType('error');
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
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
                {/* Plan Details Modal */}
                <PlanDetailsModal
                    plan={modalPlan}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={handlePlanSelect}
                    serviceType="DTH"
                />
                
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">📺 DTH Recharge</h1>

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

                {/* Form Section - Responsive */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* DTH Number */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    DTH Subscriber ID / Customer ID
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={dthNumber}
                                        onChange={(e) => setDthNumber(e.target.value)}
                                        placeholder="Enter your DTH subscriber ID or customer ID"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-24"
                                        required
                                    />
                                    {detecting && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                        </div>
                                    )}
                                    {dthNumber.length >= 10 && !detecting && selectedOperator && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    ✨ Plans will be loaded automatically after selecting operator
                                </p>
                            </div>

                            {/* Operator Selection - Searchable */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select DTH Operator
                                </label>
                                <SearchableSelect
                                    options={operators.map(op => ({
                                        value: op.id,
                                        label: op.operator_name,
                                        data: op
                                    }))}
                                    value={selectedOperator}
                                    onChange={setSelectedOperator}
                                    placeholder="Search and select DTH operator..."
                                    required
                                />
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
                                    min={operators.find(op => op.id === selectedOperator)?.min_amount || 100}
                                    max={operators.find(op => op.id === selectedOperator)?.max_amount || 5000}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Customer Name */}
                            <div className="md:col-span-2">
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

                        {/* Reward Preview - Generic Message */}
                        {selectedOperator && amount && parseFloat(amount) > 0 && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <div className="flex items-center">
                                    <div className="text-2xl mr-3">💰</div>
                                    <div>
                                        <p className="text-sm font-medium text-green-800">
                                            {userRole === 'CUSTOMER' 
                                                ? '🎉 You will earn cashback on this recharge!' 
                                                : '💼 You will earn commission on this recharge!'}
                                        </p>
                                        <p className="text-xs text-green-700 mt-1">
                                            {rewardLabel} will be credited to your wallet after successful transaction
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
                            {loading ? 'Processing...' : 'Proceed to DTH Recharge'}
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

                {/* Plans Section - Full Width Below Form - Responsive */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex flex-wrap items-center gap-2">
                        <span>📋</span>
                        <span>Available DTH Plans</span>
                        {totalPlansCount > 0 && (
                            <span className="text-xs sm:text-sm font-normal text-gray-600">
                                ({totalPlansCount} plans available)
                            </span>
                        )}
                    </h2>

                    {loadingPlans ? (
                        <div className="py-12">
                            <div className="flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600">Finding best plans for you...</p>
                            </div>
                        </div>
                    ) : planCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📺</div>
                            {selectedOperator ? (
                                <>
                                    <p className="text-lg font-semibold mb-2 text-gray-700">
                                        No plans available for this DTH operator
                                    </p>
                                    <p className="text-sm text-gray-600 mb-6">
                                        DTH plans may not be available through the API. <br />
                                        Please enter a custom recharge amount above.
                                    </p>

                                    {/* Suggested Amounts */}
                                    <div className="max-w-2xl mx-auto mt-8">
                                        <h3 className="text-md font-semibold text-gray-700 mb-4">💡 Common DTH Recharge Amounts</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                            {[100, 200, 300, 500, 1000].map((suggestedAmount) => (
                                                <button
                                                    key={suggestedAmount}
                                                    type="button"
                                                    onClick={() => setAmount(suggestedAmount.toString())}
                                                    className="px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-400 transition-all"
                                                >
                                                    <div className="text-sm text-gray-600">Amount</div>
                                                    <div className="text-xl font-bold text-purple-600">₹{suggestedAmount}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4">
                                            Click on an amount above to quickly fill the recharge amount field
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-semibold mb-2 text-gray-700">
                                        Select a DTH operator to view available plans
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Choose your DTH operator from the form above to see recharge plans
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Enhanced Horizontal Category Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">📂 Filter by Category</h3>
                                <div className="relative group">
                                    {/* Left Scroll Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const container = document.getElementById('dth-category-scroll-container');
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
                                            const container = document.getElementById('dth-category-scroll-container');
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
                                        id="dth-category-scroll-container"
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
                                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl transform scale-105'
                                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:shadow-md'
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
                                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl transform scale-105'
                                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:shadow-md'
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

                            {/* Plans Grid - Professional Design - Fully Responsive */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                                {getFilteredPlans().map((plan, index) => (
                                    <div
                                        key={`${plan.amount}-${plan.validity}-${index}`}
                                        onClick={() => handlePlanClick(plan)}
                                        className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 group ${selectedPlan?.amount === plan.amount &&
                                            selectedPlan?.validity === plan.validity
                                            ? 'shadow-2xl ring-4 ring-purple-400 transform scale-105'
                                            : 'shadow-md hover:shadow-xl hover:transform hover:scale-102'
                                            }`}
                                    >
                                        {/* Card Background with Gradient */}
                                        <div className={`absolute inset-0 ${selectedPlan?.amount === plan.amount &&
                                            selectedPlan?.validity === plan.validity
                                            ? 'bg-gradient-to-br from-purple-50 via-white to-purple-50'
                                            : 'bg-white group-hover:bg-gradient-to-br group-hover:from-gray-50 group-hover:via-white group-hover:to-gray-50'
                                            }`} />

                                        {/* Popular Badge */}
                                        {(plan.amount === 299 || plan.amount === 399 || plan.amount === 499 || plan.amount === 599) && (
                                            <div className="absolute top-0 right-0 z-10">
                                                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-4 py-1.5 rounded-bl-2xl rounded-tr-2xl font-bold shadow-lg flex items-center gap-1">
                                                    <span>⭐</span>
                                                    <span>POPULAR</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Selected Badge */}
                                        {selectedPlan?.amount === plan.amount &&
                                            selectedPlan?.validity === plan.validity && (
                                                <div className="absolute top-0 left-0 z-10">
                                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-4 py-1.5 rounded-br-2xl rounded-tl-2xl font-bold shadow-lg flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span>SELECTED</span>
                                                    </div>
                                                </div>
                                            )}

                                        {/* Card Content */}
                                        <div className="relative p-6">
                                            {/* Plan Name Header */}
                                            {plan.planName && (
                                                <div className="mb-4 pb-3 border-b-2 border-purple-100">
                                                    <h4 className="text-base font-bold text-gray-800 line-clamp-2 leading-tight">
                                                        {plan.planName}
                                                    </h4>
                                                </div>
                                            )}

                                            {/* Amount Box - Right Corner Style */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                        Recharge Amount
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl px-4 py-3 shadow-lg transform group-hover:scale-110 transition-transform">
                                                    <div className="text-2xl font-black leading-none">
                                                        ₹{plan.amount}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Validity Badge */}
                                            <div className="mb-4">
                                                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 text-green-800 px-4 py-2 rounded-full">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-sm font-bold">{plan.validity}</span>
                                                </div>
                                            </div>

                                            {/* Channel Information (DTH specific) */}
                                            {plan.channels && (
                                                <div className="mb-4 space-y-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-lg mt-0.5">📺</span>
                                                        <div className="flex-1">
                                                            <div className="text-xs font-semibold text-gray-600 mb-1">Total Channels</div>
                                                            <div className="text-sm font-bold text-gray-800">{plan.channels}</div>
                                                        </div>
                                                    </div>
                                                    {plan.paidChannels && (
                                                        <div className="flex items-start gap-2 pt-2 border-t border-blue-200">
                                                            <span className="text-lg mt-0.5">💳</span>
                                                            <div className="flex-1">
                                                                <div className="text-xs font-semibold text-gray-600 mb-1">Paid Channels</div>
                                                                <div className="text-sm font-bold text-gray-800">{plan.paidChannels}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {plan.hdChannels && plan.hdChannels !== 'No HD Channels' && (
                                                        <div className="flex items-start gap-2 pt-2 border-t border-blue-200">
                                                            <span className="text-lg mt-0.5">🎬</span>
                                                            <div className="flex-1">
                                                                <div className="text-xs font-semibold text-blue-600 mb-1">HD Channels</div>
                                                                <div className="text-sm font-bold text-blue-700">{plan.hdChannels}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Description (fallback if no channel info) */}
                                            {!plan.channels && plan.description && (
                                                <div className="mb-4 min-h-[60px]">
                                                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                                        {plan.description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Language/Type Badge */}
                                            {plan.type && (
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="inline-flex items-center gap-1.5 text-xs bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 text-purple-800 px-3 py-1.5 rounded-full font-semibold">
                                                        <span>🌐</span>
                                                        <span>{plan.type}</span>
                                                    </span>
                                                    {plan.lastUpdate && (
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            {plan.lastUpdate}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Click to Select Hint */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="text-center">
                                                    <span className="text-xs font-semibold text-purple-600 group-hover:text-purple-700">
                                                        {selectedPlan?.amount === plan.amount && selectedPlan?.validity === plan.validity
                                                            ? '✓ This plan is selected'
                                                            : '👆 Click to select this plan'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/0 to-purple-400/0 group-hover:from-purple-400/10 group-hover:via-transparent group-hover:to-pink-400/10 transition-all duration-300 pointer-events-none rounded-2xl" />
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
