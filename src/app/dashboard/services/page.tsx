'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
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
  Wallet,
  Globe,
  ArrowRight
} from 'lucide-react';
import {
  useRealTimeServices,
  useRealTimeDirectLinks,
  useRealTimeDirectLinkCategories
} from '@/hooks/useRealTimeData';
import { formatCurrency } from '@/lib/utils';
import ServiceApplicationForm from '@/components/ServiceApplicationForm';
import './services.css';

export default function ServicesPage() {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<'GOVERNMENT' | 'DIRECT'>('GOVERNMENT');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Direct Link specific states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDirectLink, setSelectedDirectLink] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Fetch government services
  const {
    data: services,
    loading: loadingServices,
    error: errorServices,
    refresh: refreshServices
  } = useRealTimeServices(viewMode === 'GOVERNMENT');

  // Fetch direct links
  const {
    data: directLinks,
    loading: loadingDirectLinks,
    error: errorDirectLinks,
    refresh: refreshDirectLinks
  } = useRealTimeDirectLinks(
    undefined, // We filter locally
    undefined,
    viewMode === 'DIRECT'
  );

  // Fetch direct link categories
  const {
    data: directLinkCategories,
  } = useRealTimeDirectLinkCategories(viewMode === 'DIRECT');

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await fetch('/api/wallet');
        const data = await response.json();
        if (data.success) {
          setWalletBalance(data.data.balance);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    };
    if (session) {
      fetchWallet();
    }
  }, [session]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedCategory, selectedType, searchTerm]);

  // Check access - Allow both retailers and customers
  if (!session || (session.user.role !== UserRole.RETAILER && session.user.role !== UserRole.CUSTOMER)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers and customers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isCustomer = session.user.role === UserRole.CUSTOMER;

  const handleApplyService = (service: any) => {
    setSelectedService(service);
    setShowApplicationForm(true);
  };

  const handleDirectLinkClick = (service: any) => {
    if (service.requires_payment && service.amount > 0) {
      setSelectedDirectLink(service);
      setShowPaymentModal(true);
    } else {
      redirectToDirectLink(service);
    }
  };

  const redirectToDirectLink = (service: any) => {
    if (service.redirect_type === 'NEW_TAB') {
      window.open(service.service_url, '_blank');
    } else {
      window.location.href = service.service_url;
    }
  };

  const processDirectLinkPayment = async () => {
    if (!selectedDirectLink) return;

    setProcessingPayment(true);
    try {
      const response = await fetch('/api/direct-links/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: selectedDirectLink.id }),
      });

      const data = await response.json();
      if (data.success) {
        setShowPaymentModal(false);
        setSelectedDirectLink(null);
        alert(`Payment successful! ${data.message}`);

        // Refresh wallet balance
        const walletRes = await fetch('/api/wallet');
        const walletData = await walletRes.json();
        if (walletData.success) setWalletBalance(walletData.data.balance);

        redirectToDirectLink(selectedDirectLink);
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

  const categories = viewMode === 'GOVERNMENT'
    ? [...new Set(services.map((s) => s.category).filter(Boolean))]
    : directLinkCategories.map(c => c.name);

  const loading = viewMode === 'GOVERNMENT' ? loadingServices : loadingDirectLinks;
  const error = viewMode === 'GOVERNMENT' ? errorServices : errorDirectLinks;
  const refresh = viewMode === 'GOVERNMENT' ? refreshServices : refreshDirectLinks;

  const filteredItems = viewMode === 'GOVERNMENT'
    ? services.filter((service) => {
      const matchesCategory =
        selectedCategory === 'ALL' || service.category === selectedCategory;
      const matchesType =
        selectedType === 'ALL' ||
        (selectedType === 'FREE' && service.is_free) ||
        (selectedType === 'PAID' && !service.is_free);
      const matchesSearch =
        searchTerm === '' ||
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesType && matchesSearch;
    })
    : directLinks.filter(s =>
      (selectedCategory === 'ALL' || s.category === selectedCategory) &&
      (searchTerm === '' || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="services-page-container">
        {/* Header with Tab Switcher */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">
                {viewMode === 'GOVERNMENT' ? 'Government Services' : 'Direct Link Services'}
              </h1>
              <p className="text-red-100 text-xl">
                {viewMode === 'GOVERNMENT'
                  ? 'Apply for government services and schemes through our platform'
                  : 'Access various services directly with secure payments'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="bg-black/30 p-1.5 rounded-2xl backdrop-blur-xl border border-white/10 grid grid-cols-2 gap-2 w-full max-w-[450px]">
              <button
                onClick={() => {
                  setViewMode('GOVERNMENT');
                  setSelectedCategory('ALL');
                }}
                className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${viewMode === 'GOVERNMENT'
                  ? 'bg-[#059669] shadow-[0_0_20px_rgba(5,150,105,0.4)] scale-100'
                  : 'hover:bg-white/10'
                  }`}
              >
                <Globe
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: '#ffffff' }}
                />
                <span
                  className="whitespace-nowrap text-base font-black"
                  style={{ color: '#ffffff' }}
                >
                  Government
                </span>
              </button>
              <button
                onClick={() => {
                  setViewMode('DIRECT');
                  setSelectedCategory('ALL');
                }}
                className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${viewMode === 'DIRECT'
                  ? 'bg-[#059669] shadow-[0_0_20px_rgba(5,150,105,0.4)] scale-100'
                  : 'hover:bg-white/10'
                  }`}
              >
                <ExternalLink
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: '#ffffff' }}
                />
                <span
                  className="whitespace-nowrap text-base font-black"
                  style={{ color: '#ffffff' }}
                >
                  Direct Links
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-red-50 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {viewMode === 'GOVERNMENT' ? services.length : directLinks.length} Services
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Real-time Updates
            </span>
            {viewMode === 'DIRECT' && walletBalance !== null && (
              <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <Wallet className="w-5 h-5" />
                Wallet: ₹{walletBalance.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Filters - Sticky */}
        <div
          style={{
            position: 'sticky',
            top: '-1px',
            zIndex: 40,
            backgroundColor: 'rgba(254, 242, 242, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '1rem 0',
            borderBottom: '1px solid #fee2e2'
          }}
          className="w-full"
        >
          <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search services..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {viewMode === 'GOVERNMENT' ? (
                <div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="ALL">All Types</option>
                    <option value="FREE">Free Services</option>
                    <option value="PAID">Paid Services</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Direct Access Links
                </div>
              )}

              <Button
                onClick={() => refresh()}
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Service Results */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-red-100 shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading services...</p>
            </div>
          ) : error ? (
            <Card className="border-red-200">
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => refresh()} className="bg-red-600 hover:bg-red-700 text-white">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <div className="text-6xl mb-4 opacity-20">🔎</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any services matching your current filters. Try adjusting your search or category.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedItems.map((item) => (
                  viewMode === 'GOVERNMENT' ? (
                    <Card key={item.id} className="group hover:shadow-2xl transition-all duration-300 border border-red-100 flex flex-col">
                      {item.image_url && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                          <div className="absolute top-4 right-4 shadow-xl">
                            <div className={`px-4 py-1 rounded-full text-xs font-black border-2 border-white ${item.is_free ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}>
                              {item.is_free ? 'FREE' : formatCurrency(isCustomer && item.customer_price ? item.customer_price : item.price)}
                            </div>
                          </div>
                        </div>
                      )}
                      <CardHeader className="flex-none">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                              {item.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Filter className="w-3 h-3" /> {item.category}
                            </CardDescription>
                          </div>
                          {!item.image_url && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.is_free ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {item.is_free ? 'FREE' : formatCurrency(isCustomer && item.customer_price ? item.customer_price : item.price)}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Processing Time</span>
                            <span className="font-bold text-gray-900">{item.processing_time_days} Days</span>
                          </div>
                          {isCustomer ? (
                            item.cashback_enabled && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">💰 Potential Cashback</span>
                                <span className="font-bold text-green-600">{item.cashback_min_percentage}% - {item.cashback_max_percentage}%</span>
                              </div>
                            )
                          ) : (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Commission</span>
                              <span className="font-bold text-red-600">{item.commission_rate}%</span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleApplyService(item)}
                          className="mt-auto w-full bg-red-600 hover:bg-black text-white font-bold h-12 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          Apply Now <ArrowRight className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={item.id} className="group hover:shadow-2xl transition-all duration-300 border border-blue-100 flex flex-col">
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            {item.icon_url ? (
                              <img src={item.icon_url} alt="" className="w-14 h-14 rounded-2xl shadow-md p-1 bg-white border border-gray-100" />
                            ) : (
                              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-50">
                                {item.category_info?.icon || '🔗'}
                              </div>
                            )}
                            <div>
                              <h3 className="font-black text-xl text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                {item.name}
                                {item.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-blue-500 px-2 py-0.5 bg-blue-50 rounded-md">
                                  {item.category_info?.name || item.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="grid grid-cols-1 gap-3 mb-6">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <DollarSign className="w-3 h-3" /> Access Fee
                            </span>
                            <span className="font-black text-gray-900">
                              {item.amount > 0 ? `₹${item.amount}` : <span className="text-green-600">Free Access</span>}
                            </span>
                          </div>
                          {isCustomer && item.cashback_enabled && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100 italic">
                              <span className="text-xs font-bold text-green-700">💰 Cashback</span>
                              <span className="font-black text-green-700">{item.cashback_percentage}%</span>
                            </div>
                          )}
                        </div>

                        {/* Insufficient balance warning */}
                        {item.requires_payment && item.amount > 0 && walletBalance !== null && walletBalance < item.amount && (
                          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-6 animate-pulse">
                            <div className="flex items-center gap-2 text-red-700 text-xs font-bold">
                              <AlertCircle className="w-4 h-4" />
                              <span>Recharge Wallet to Access</span>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => handleDirectLinkClick(item)}
                          disabled={item.requires_payment && item.amount > 0 && walletBalance !== null && walletBalance < item.amount}
                          className={`mt-auto w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${item.requires_payment && item.amount > 0 && walletBalance !== null && walletBalance < item.amount
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 text-white hover:bg-black hover:scale-[1.02]'
                            }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {item.button_text}
                        </Button>
                      </div>
                    </Card>
                  )
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Page <span className="text-red-600">{currentPage}</span> of {totalPages}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="rounded-xl px-6 font-bold border-2 hover:bg-gray-50"
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === pageNum
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          (pageNum === 2 && currentPage > 3) ||
                          (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={pageNum} className="px-2 text-gray-300 font-black">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="rounded-xl px-6 font-bold border-2 hover:bg-gray-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Global Modals */}

      {/* Government Application Form */}
      <ServiceApplicationForm
        service={selectedService}
        isOpen={showApplicationForm}
        onClose={() => {
          setShowApplicationForm(false);
          setSelectedService(null);
        }}
        onSuccess={() => {
          setShowApplicationForm(false);
          setSelectedService(null);
          refresh();
        }}
      />

      {/* Direct Link Payment Modal */}
      {
        showPaymentModal && selectedDirectLink && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-2xl font-black text-gray-900">Secure Access</h2>
                <p className="text-gray-500 font-medium">Please confirm your payment to proceed</p>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-5 mb-8">
                  {selectedDirectLink.icon_url ? (
                    <img src={selectedDirectLink.icon_url} alt="" className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white" />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                      {selectedDirectLink.category_info?.icon || '🔗'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-xl text-gray-900">{selectedDirectLink.name}</h3>
                    <p className="text-blue-600 font-bold text-sm tracking-wide uppercase px-2 py-0.5 bg-blue-50 inline-block rounded-md mt-1">
                      {selectedDirectLink.category_info?.name || selectedDirectLink.category}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">Access Fee</span>
                      <span className="font-black text-gray-900 text-3xl">₹{selectedDirectLink.amount}</span>
                    </div>
                    <div className="px-1 space-y-3">
                      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                        <span>Current Wallet</span>
                        <span className="text-gray-900 font-black">₹{walletBalance?.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-gray-100 w-full" />
                      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                        <span>Balance After</span>
                        <span className="text-blue-600 font-black text-sm">₹{((walletBalance || 0) - selectedDirectLink.amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => { setShowPaymentModal(false); setSelectedDirectLink(null); }}
                    className="flex-1 px-4 py-4 text-gray-600 font-bold bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all"
                    disabled={processingPayment}
                  >
                    Back
                  </button>
                  <button
                    onClick={processDirectLinkPayment}
                    disabled={processingPayment}
                    className="flex-[2] px-4 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-black disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white"></div>
                        Securing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Pay ₹{selectedDirectLink.amount}
                      </>
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">
                  🔒 256-bit Secure Encryption Powered by Vighnaharta
                </p>
              </div>
            </div>
          </div>
        )
      }
    </DashboardLayout>
  );
}
