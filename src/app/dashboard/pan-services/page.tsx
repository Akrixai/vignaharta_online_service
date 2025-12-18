'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@/types';
import DashboardLayout from '@/components/dashboard/layout';

interface PanService {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  price: number;
  features: string[];
}

const panServices: PanService[] = [
  {
    id: 'new-pan',
    title: 'New PAN Application',
    description: 'Apply for a new PAN card with instant processing',
    icon: '🆔',
    href: '/dashboard/pan-services/new',
    price: 107,
    features: [
      'EKYC (Instant PAN without signature)',
      'ESIGN (PAN with signature and photo)',
      'Instant processing',
      'Digital delivery'
    ]
  },
  {
    id: 'pan-correction',
    title: 'PAN Correction',
    description: 'Correct errors in your existing PAN card',
    icon: '✏️',
    href: '/dashboard/pan-services/correction',
    price: 107,
    features: [
      'Name correction',
      'Date of birth correction',
      'Address update',
      'Photo update'
    ]
  },
  {
    id: 'incomplete-pan',
    title: 'Incomplete PAN',
    description: 'Complete your pending PAN application',
    icon: '📋',
    href: '/dashboard/pan-services/incomplete',
    price: 107,
    features: [
      'Resume incomplete application',
      'Same fee as new application',
      'Quick completion',
      'Status tracking'
    ]
  }
];

export default function PanServicesPage() {
  const { data: session } = useSession();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Check if user has access to PAN services
  const hasAccess = session?.user?.email === 'AkrixRetailerTest@gmail.com' && 
    (session?.user?.role === UserRole.RETAILER || session?.user?.role === UserRole.CUSTOMER);

  useEffect(() => {
    if (hasAccess) {
      fetchWalletBalance();
    }
  }, [hasAccess]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PAN Services</h1>
          <p className="text-gray-600">Complete PAN card services with instant processing</p>
          
          {/* Wallet Balance */}
          <div className="mt-4 bg-white rounded-lg shadow p-4 inline-block">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Wallet Balance:</span>
              <span className="text-lg font-semibold text-green-600">
                {loadingWallet ? '...' : `₹${walletBalance.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {panServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{service.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Service Fee:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {service.price === 0 ? 'Free' : `₹${service.price}`}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={service.href}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-center block"
                >
                  Start Application
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/pan-services/history"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h3 className="font-medium text-gray-900">Service History</h3>
                <p className="text-sm text-gray-600">View all your PAN service applications</p>
              </div>
            </Link>
            
            <Link
              href="/dashboard/wallet"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="text-2xl mr-3">💰</span>
              <div>
                <h3 className="font-medium text-gray-900">Add Money to Wallet</h3>
                <p className="text-sm text-gray-600">Top up your wallet for seamless transactions</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-xl font-bold text-orange-900 mb-2">Important: Instant Payment System</h3>
              <p className="text-sm text-orange-800 mb-3">
                We follow InsPay's instant deduction model for faster processing and better tracking.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                <span className="mr-2">💳</span> Payment Process
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Instant deduction</strong> when you start application</li>
                <li>• Amount debited from wallet immediately</li>
                <li>• Order ID generated for tracking</li>
                <li>• Visible in history instantly</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                <span className="mr-2">⏰</span> 24-Hour Window
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Complete application within 24 hours</li>
                <li>• Auto-refund if not completed</li>
                <li>• Full refund on failure</li>
                <li>• Real-time status updates</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                <span className="mr-2">✅</span> On Success
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Commission credited instantly</li>
                <li>• Application marked complete</li>
                <li>• PAN details updated</li>
                <li>• Receipt generated</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                <span className="mr-2">💸</span> Refund Policy
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Automatic refund on failure</li>
                <li>• Refund if expired (24 hours)</li>
                <li>• Amount returned to wallet</li>
                <li>• No manual intervention needed</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Application Modes:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
              <div>
                <strong>EKYC (Recommended):</strong> Instant PAN without signature requirement. Faster processing.
              </div>
              <div>
                <strong>ESIGN:</strong> PAN with signature and photo. Traditional processing method.
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-orange-800">
            <strong>Note:</strong> All applications are processed through NSDL official portal. Ensure you have sufficient wallet balance before starting.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}