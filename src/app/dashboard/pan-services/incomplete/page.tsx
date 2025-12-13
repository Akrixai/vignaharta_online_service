'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/layout';

export default function IncompletePanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [formData, setFormData] = useState({
    existing_order_id: ''
  });

  // Check if user has access
  const hasAccess = session?.user?.email === 'AkrixRetailerTest@gmail.com' && 
    (session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER);

  useEffect(() => {
    if (hasAccess) {
      fetchWalletBalance();
    }
  }, [hasAccess]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletBalance(data.data.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.existing_order_id.trim()) {
      toast.error('Please enter your existing order ID');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/pan-services/incomplete-pan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Incomplete PAN application resumed successfully!');
        
        // Redirect to InsPay URL
        if (data.data.inspay_url) {
          window.open(data.data.inspay_url, '_blank');
        }
        
        // Redirect to history page
        router.push('/dashboard/pan-services/history');
      } else {
        toast.error(data.message || 'Failed to resume incomplete PAN application');
      }
    } catch (error) {
      console.error('Error resuming incomplete PAN application:', error);
      toast.error('An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-600">PAN services are currently available for selected retailers only.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Incomplete PAN</h1>
          <p className="text-gray-600">Resume your pending PAN application</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="existing_order_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Existing Order ID *
                  </label>
                  <input
                    type="text"
                    id="existing_order_id"
                    value={formData.existing_order_id}
                    onChange={(e) => setFormData({ ...formData, existing_order_id: e.target.value })}
                    placeholder="Enter your existing PAN application order ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the order ID from your previous incomplete PAN application
                  </p>
                </div>

                {/* Information Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">About Incomplete PAN Applications:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• No additional charges for completing incomplete applications</li>
                    <li>• You can resume where you left off in the application process</li>
                    <li>• All previously entered data will be preserved</li>
                    <li>• Complete the application within the validity period</li>
                  </ul>
                </div>

                {/* How to Find Order ID */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">How to Find Your Order ID:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check your email for the original application confirmation</li>
                    <li>• Look for SMS notifications from NSDL</li>
                    <li>• Check your PAN services history in this dashboard</li>
                    <li>• Contact support if you cannot locate your order ID</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    ← Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? 'Processing...' : 'Resume Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Balance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Balance</h3>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ₹{walletBalance.toLocaleString()}
              </div>
              <button
                onClick={() => router.push('/dashboard/wallet')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Add Money
              </button>
            </div>

            {/* Service Fee */}
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Service Fee</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                ₹107
              </div>
              <p className="text-sm text-blue-700">
                Payment will be deducted after successful completion
              </p>
            </div>

            {/* Process Info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Process Information</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">1.</span>
                  <span>Enter your existing order ID</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">2.</span>
                  <span>You'll be redirected to NSDL portal</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">3.</span>
                  <span>Complete the remaining application steps</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">4.</span>
                  <span>Payment will be deducted after successful completion</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/pan-services/history')}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="font-medium text-gray-900">View History</div>
                  <div className="text-sm text-gray-600">Check your previous applications</div>
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/pan-services/new')}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="font-medium text-gray-900">New Application</div>
                  <div className="text-sm text-gray-600">Start a fresh PAN application</div>
                </button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">Need Help?</h3>
              <p className="text-sm text-orange-800 mb-3">
                Can't find your order ID or facing issues?
              </p>
              <button
                onClick={() => router.push('/dashboard/help-support')}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}