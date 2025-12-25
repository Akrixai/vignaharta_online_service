'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ExternalLink, 
  Search, 
  Filter,
  Star,
  DollarSign,
  Gift,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet
} from 'lucide-react';

interface DirectLinkService {
  id: string;
  name: string;
  description: string;
  service_url: string;
  service_type: string;
  amount: number;
  commission_rate: number;
  cashback_enabled: boolean;
  cashback_percentage: number;
  is_featured: boolean;
  category: string;
  icon_url?: string;
  button_text: string;
  redirect_type: string;
  requires_payment: boolean;
  allowed_roles: string[];
  category_info?: {
    name: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface WalletInfo {
  balance: number;
}

import DashboardLayout from '@/components/dashboard/layout';

export default function DirectLinksPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<DirectLinkService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedService, setSelectedService] = useState<DirectLinkService | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (session) {
      fetchServices();
      fetchCategories();
      fetchWallet();
    }
  }, [session, selectedCategory, showFeaturedOnly]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (showFeaturedOnly) params.append('featured', 'true');

      const response = await fetch(`/api/direct-links?${params}`);
      const data = await response.json();

      if (data.success) {
        setServices(data.data);
      } else {
        console.error('Failed to fetch services:', data.error);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/direct-links/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();

      if (data.success) {
        setWallet({ balance: data.data.balance });
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const handleServiceClick = (service: DirectLinkService) => {
    if (service.requires_payment && service.amount > 0) {
      setSelectedService(service);
      setShowPaymentModal(true);
    } else {
      // Free service - redirect directly
      redirectToService(service);
    }
  };

  const redirectToService = (service: DirectLinkService) => {
    if (service.redirect_type === 'NEW_TAB') {
      window.open(service.service_url, '_blank');
    } else {
      window.location.href = service.service_url;
    }
  };

  const processPayment = async () => {
    if (!selectedService) return;

    setProcessingPayment(true);

    try {
      const response = await fetch('/api/direct-links/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: selectedService.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Payment successful - redirect to service
        setShowPaymentModal(false);
        setSelectedService(null);
        
        // Show success message
        alert(`Payment successful! ${data.message}`);
        
        // Update wallet balance
        fetchWallet();
        
        // Redirect to service
        redirectToService(selectedService);
      } else {
        alert('Payment failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h1>
            <p className="text-gray-600">You need to be logged in to access direct links services.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Direct Links Services</h1>
            <p className="text-gray-600">Access various services directly with secure payments</p>
          </div>
          
          {wallet && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                Wallet Balance: <span className="font-semibold">₹{wallet.balance.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Featured only</span>
          </label>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {service.icon_url ? (
                    <img src={service.icon_url} alt="" className="w-10 h-10 rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-lg">
                      {service.category_info?.icon || '🔗'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {service.name}
                      {service.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </h3>
                    <p className="text-sm text-gray-500">{service.category_info?.name}</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {service.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Amount:
                  </span>
                  <span className="font-medium">
                    {service.amount > 0 ? `₹${service.amount}` : 'Free'}
                  </span>
                </div>
              </div>

              {/* Insufficient balance warning */}
              {service.requires_payment && service.amount > 0 && wallet && wallet.balance < service.amount && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-red-800 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Insufficient wallet balance</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleServiceClick(service)}
                disabled={service.requires_payment && service.amount > 0 && wallet && wallet.balance < service.amount}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  service.requires_payment && service.amount > 0 && wallet && wallet.balance < service.amount
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                {service.button_text}
              </button>
            </div>
          ))}
        </div>
      )}

      {filteredServices.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ExternalLink className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filters' 
              : 'No direct link services are available at the moment'
            }
          </p>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Payment</h2>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {selectedService.icon_url ? (
                  <img src={selectedService.icon_url} alt="" className="w-12 h-12 rounded" />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center text-xl">
                    {selectedService.category_info?.icon || '🔗'}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedService.name}</h3>
                  <p className="text-sm text-gray-500">{selectedService.category_info?.name}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Amount:</span>
                    <span className="font-medium">₹{selectedService.amount}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-medium">₹{wallet?.balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">After Payment:</span>
                      <span className="font-medium">
                        ₹{((wallet?.balance || 0) - selectedService.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                You will be redirected to the service after successful payment.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedService(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={processingPayment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Pay ₹{selectedService.amount}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}