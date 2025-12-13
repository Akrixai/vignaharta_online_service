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
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Information</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Ensure you have sufficient wallet balance before starting any application</li>
            <li>• Payment will be deducted only after successful completion of your application</li>
            <li>• EKYC mode provides instant PAN without signature requirement</li>
            <li>• ESIGN mode requires signature and photo for PAN card</li>
            <li>• All applications are processed through NSDL official portal</li>
            <li>• Commission will be credited to your wallet immediately upon successful completion</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}