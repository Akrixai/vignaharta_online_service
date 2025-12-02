'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';

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
  
  const [loading, setLoading] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [message, setMessage] = useState('');
  const [billDetails, setBillDetails] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchOperators();
    fetchCircles();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const operator = operators.find(op => op.id === selectedOperator);
      const circle = circles.find(c => c.id === selectedCircle);

      const payload: any = {
        service_type: 'ELECTRICITY',
        operator_code: operator?.operator_code,
        consumer_number: consumerNumber,
        circle_code: circle?.circle_code,
        amount: parseFloat(amount),
        customer_name: customerName,
      };

      const res = await fetch('/api/recharge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const reward = data.data.reward_amount || 0;
        setMessage(`✅ Electricity bill payment successful! ${data.data.reward_label}: ₹${reward.toFixed(2)} | Transaction ID: ${data.data.transaction_ref}`);
        setConsumerNumber('');
        setAmount('');
        setCustomerName('');
        setBillDetails(null);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">⚡ Electricity Bill Payment</h1>

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
              onChange={(e) => setConsumerNumber(e.target.value)}
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
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose electricity board...</option>
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
              Select State/Circle
            </label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose state/circle...</option>
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

          {/* Reward Info */}
          {selectedOperator && amount && (
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
            {loading ? 'Processing...' : 'Pay Electricity Bill'}
          </button>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
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
                  <p className="text-sm text-gray-600">{rewardLabel}: {op.commission_rate}%</p>
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
