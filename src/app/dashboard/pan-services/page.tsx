'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/layout';

// Tab Components
import NewPanTab from '@/components/pan-services/NewPanTab';
import PanCorrectionTab from '@/components/pan-services/PanCorrectionTab';
import IncompletePanTab from '@/components/pan-services/IncompletePanTab';
import PanHistoryTab from '@/components/pan-services/PanHistoryTab';
import PanBrandingFooter from '@/components/pan-services/PanBrandingFooter';

type TabType = 'new' | 'correction' | 'incomplete' | 'history';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'new',
    label: 'New PAN',
    icon: '🆔',
    description: 'Apply for a new PAN card'
  },
  {
    id: 'correction',
    label: 'PAN Correction',
    icon: '✏️',
    description: 'Correct errors in existing PAN'
  },
  {
    id: 'incomplete',
    label: 'Incomplete PAN',
    icon: '📋',
    description: 'Resume pending applications'
  },
  {
    id: 'history',
    label: 'Service History',
    icon: '📊',
    description: 'View all applications'
  }
];

export default function PanServicesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Check if user has access to PAN services
  const hasAccess = session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER;

  useEffect(() => {
    if (hasAccess) {
      fetchWalletBalance();
    }
  }, [hasAccess]);

  // Check URL parameters for tab selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') as TabType;
    if (tab && tabs.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  const fetchWalletBalance = async () => {
    setLoadingWallet(true);
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
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url.toString());
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pan Services</h1>
          <p className="text-gray-600">Complete PAN card services with instant processing</p>

          {/* Wallet Balance */}
          <div className="mt-4 bg-white rounded-lg shadow p-4 inline-block">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Wallet Balance:</span>
              <span className="text-lg font-semibold text-green-600">
                {loadingWallet ? '...' : `₹${walletBalance.toLocaleString()}`}
              </span>
              <button
                onClick={() => router.push('/dashboard/wallet')}
                className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'new' && (
            <NewPanTab
              walletBalance={walletBalance}
              onWalletUpdate={fetchWalletBalance}
              router={router}
            />
          )}
          {activeTab === 'correction' && (
            <PanCorrectionTab
              walletBalance={walletBalance}
              onWalletUpdate={fetchWalletBalance}
              router={router}
            />
          )}
          {activeTab === 'incomplete' && (
            <IncompletePanTab
              walletBalance={walletBalance}
              onWalletUpdate={fetchWalletBalance}
              router={router}
            />
          )}
          {activeTab === 'history' && (
            <PanHistoryTab
              walletBalance={walletBalance}
              onWalletUpdate={fetchWalletBalance}
              router={router}
            />
          )}
        </div>

        {/* Important Notes - Only show on non-history tabs */}
        {activeTab !== 'history' && (
          <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <div className="flex items-start space-x-3 mb-4">
              <span className="text-3xl">💳</span>
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">New Payment Flow - Pay After Success</h3>
                <p className="text-sm text-blue-800 mb-3">
                  We've updated our payment system to charge you only after successful completion of your PAN application.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">🔒</span> No Upfront Payment
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Balance reserved</strong> but not deducted</li>
                  <li>• Start application without payment</li>
                  <li>• Order ID generated for tracking</li>
                  <li>• Visible in history instantly</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">✅</span> Payment on Success
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Money charged only after completion</li>
                  <li>• No risk of losing money</li>
                  <li>• Commission credited on success</li>
                  <li>• Receipt generated automatically</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">❌</span> No Charge on Failure
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• If application fails, no charge</li>
                  <li>• Reserved amount released automatically</li>
                  <li>• No refund process needed</li>
                  <li>• Complete transparency</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <span className="mr-2">🚀</span> Better Experience
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Reduced payment anxiety</li>
                  <li>• Faster application process</li>
                  <li>• Better success tracking</li>
                  <li>• Improved user confidence</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Application Modes:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800">
                <div>
                  <strong>EKYC (Recommended):</strong> Instant PAN without signature requirement. Faster processing.
                </div>
                <div>
                  <strong>ESIGN:</strong> PAN with signature and photo. Traditional processing method.
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-blue-800">
              <strong>Note:</strong> All applications are processed through NSDL official portal. Ensure you have sufficient wallet balance for reservation before starting.
            </div>
          </div>
        )}

        {/* Branding Footer */}
        <PanBrandingFooter />
      </div>
    </DashboardLayout>
  );
}