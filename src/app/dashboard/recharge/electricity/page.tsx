'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface BillDetails {
  customer_name?: string;
  due_amount?: string;
  bill_number?: string;
  due_date?: string;
  bill_date?: string;
  [key: string]: any;
}

interface Operator {
  id: number;
  operator_id: number;
  operator_name: string;
  operator_code: string;
  service_type: string;
  amount_minimum: number;
  amount_maximum: number;
  bill_fetch: string;
}

export default function ElectricityBillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [billFetching, setBillFetching] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await fetch('/api/recharge/operators?service_type=ELECTRICITY');
      const data = await response.json();
      if (data.success) {
        setOperators(data.data);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchBillDetails = async () => {
    if (!selectedOperator || !consumerNumber) {
      toast.error('Please select operator and enter consumer number');
      return;
    }

    setBillFetching(true);
    try {
      const response = await fetch('/api/kwikapi/bill-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opid: selectedOperator.operator_id,
          number: consumerNumber,
          mobile: mobileNumber || session?.user?.email,
          amount: '10', // Dummy amount for bill fetch
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBillDetails(data.data);
        if (data.data.due_amount) {
          setAmount(data.data.due_amount);
        }
        toast.success('Bill details fetched successfully');
      } else {
        toast.error(data.message || 'Failed to fetch bill details');
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
      toast.error('Failed to fetch bill details');
    } finally {
      setBillFetching(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedOperator || !consumerNumber || !amount) {
      toast.error('Please fill all required fields');
      return;
    }

    if (parseFloat(amount) < selectedOperator.amount_minimum || parseFloat(amount) > selectedOperator.amount_maximum) {
      toast.error(`Amount must be between ₹${selectedOperator.amount_minimum} and ₹${selectedOperator.amount_maximum}`);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/kwikapi/bill-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'ELECTRICITY',
          operator_code: selectedOperator.operator_id,
          consumer_number: consumerNumber,
          mobile_number: mobileNumber,
          amount: parseFloat(amount),
          customer_name: billDetails?.customer_name,
          ref_id: billDetails?.refrence_id || billDetails?.reference_id,
          bill_details: billDetails,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.pending) {
          toast.success(data.data.message);
        } else {
          toast.success(data.data.message);
        }
        // Reset form
        setConsumerNumber('');
        setMobileNumber('');
        setAmount('');
        setBillDetails(null);
        setSelectedOperator(null);
      } else {
        toast.error(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ⚡ Electricity Bill Payment
            </h1>
            <p className="text-gray-600">
              Pay your electricity bills instantly
            </p>
          </div>

          <div className="space-y-6">
            {/* Operator Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Electricity Board *
              </label>
              <select
                value={selectedOperator?.id || ''}
                onChange={(e) => {
                  const operator = operators.find(op => op.id === parseInt(e.target.value));
                  setSelectedOperator(operator || null);
                  setBillDetails(null);
                  setAmount('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose your electricity board</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.operator_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Consumer Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumer Number *
              </label>
              <input
                type="text"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value)}
                placeholder="Enter consumer number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number (Optional)
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={10}
              />
            </div>

            {/* Fetch Bill Button */}
            {selectedOperator?.bill_fetch === 'YES' && (
              <div>
                <button
                  onClick={fetchBillDetails}
                  disabled={billFetching || !consumerNumber}
                  className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {billFetching ? 'Fetching Bill...' : 'Fetch Bill Details'}
                </button>
              </div>
            )}

            {/* Bill Details */}
            {billDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Bill Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {billDetails.customer_name && (
                    <div>
                      <span className="font-medium text-gray-700">Customer Name:</span>
                      <span className="ml-2 text-gray-900">{billDetails.customer_name}</span>
                    </div>
                  )}
                  {billDetails.due_amount && (
                    <div>
                      <span className="font-medium text-gray-700">Due Amount:</span>
                      <span className="ml-2 text-gray-900">₹{billDetails.due_amount}</span>
                    </div>
                  )}
                  {billDetails.bill_number && (
                    <div>
                      <span className="font-medium text-gray-700">Bill Number:</span>
                      <span className="ml-2 text-gray-900">{billDetails.bill_number}</span>
                    </div>
                  )}
                  {billDetails.due_date && (
                    <div>
                      <span className="font-medium text-gray-700">Due Date:</span>
                      <span className="ml-2 text-gray-900">{billDetails.due_date}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={selectedOperator?.amount_minimum || 1}
                max={selectedOperator?.amount_maximum || 50000}
              />
              {selectedOperator && (
                <p className="text-sm text-gray-500 mt-1">
                  Amount range: ₹{selectedOperator.amount_minimum} - ₹{selectedOperator.amount_maximum}
                </p>
              )}
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing || !selectedOperator || !consumerNumber || !amount}
              className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {processing ? 'Processing Payment...' : `Pay ₹${amount || '0'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}