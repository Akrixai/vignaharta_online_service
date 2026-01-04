'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import DashboardLayout from '@/components/dashboard/layout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  ExternalLink,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  CreateServiceModal,
  EditServiceModal,
  CreateCategoryModal,
  EditCategoryModal
} from '@/components/admin/DirectLinksModals';

interface DirectLinkService {
  id: string;
  name: string;
  description: string;
  service_url: string;
  service_type: string;
  amount: number;
  is_active: boolean;
  is_featured: boolean;
  category: string;
  icon_url?: string;
  button_text: string;
  redirect_type: string;
  requires_payment: boolean;
  allowed_roles: string[];
  created_at: string;
  creator?: {
    name: string;
    email: string;
  };
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
  is_active: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DirectLinksManagement() {
  const { data: session } = useSession();
  const [services, setServices] = useState<DirectLinkService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]); // For dropdown
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState<DirectLinkService | null>(null);
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');
  
  // Category management states
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null);

  // Pagination states
  const [servicesPagination, setServicesPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [categoriesPagination, setCategoriesPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (session && (session.user.role === UserRole.ADMIN || session.user.role === UserRole.EMPLOYEE)) {
      if (activeTab === 'services') {
        fetchServices();
        fetchAllCategories(); // Fetch all categories for dropdown
      } else {
        fetchCategories();
      }
    }
  }, [session, selectedCategory, showActiveOnly, servicesPagination.page, categoriesPagination.page, activeTab]);

  // Fetch all categories for dropdown (without pagination)
  const fetchAllCategories = async () => {
    try {
      const response = await fetch('/api/admin/direct-links/categories?all=true');
      const data = await response.json();

      if (data.success) {
        setAllCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching all categories:', error);
    }
  };

  // Check authorization
  if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.EMPLOYEE)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (showActiveOnly) params.append('is_active', 'true');
      params.append('page', servicesPagination.page.toString());
      params.append('limit', servicesPagination.limit.toString());

      const response = await fetch(`/api/admin/direct-links?${params}`);
      const data = await response.json();

      if (data.success) {
        setServices(data.data || []);
        setServicesPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        console.error('Failed to fetch services:', data.error);
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', categoriesPagination.page.toString());
      params.append('limit', categoriesPagination.limit.toString());

      const response = await fetch(`/api/admin/direct-links/categories?${params}`);
      const data = await response.json();

      if (data.success) {
        setCategories(data.data || []);
        setCategoriesPagination(prev => ({
          ...prev,
          total: data.pagination?.total || data.data?.length || 0,
          totalPages: data.pagination?.totalPages || Math.ceil((data.data?.length || 0) / prev.limit)
        }));
      } else {
        console.error('Failed to fetch categories:', data.error);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/admin/direct-links/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchServices();
      } else {
        alert('Failed to delete service: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will affect all services using this category.')) return;

    try {
      const response = await fetch(`/api/admin/direct-links/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchCategories();
        fetchServices();
      } else {
        alert('Failed to delete category: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  // Pagination handlers
  const handleServicesPageChange = (newPage: number) => {
    setServicesPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCategoriesPageChange = (newPage: number) => {
    setCategoriesPagination(prev => ({ ...prev, page: newPage }));
  };

  // Reset pagination when switching tabs or changing filters
  const handleTabChange = (tab: 'services' | 'categories') => {
    setActiveTab(tab);
    if (tab === 'services') {
      setServicesPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setCategoriesPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handleFilterChange = () => {
    setServicesPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Component
  const PaginationComponent = ({ 
    pagination, 
    onPageChange 
  }: { 
    pagination: PaginationInfo; 
    onPageChange: (page: number) => void;
  }) => {
    if (pagination.totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
      let end = Math.min(pagination.totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNum === pagination.page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Direct Links Management</h1>
              <p className="text-gray-600">Manage direct service links and categories</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('services')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Services ({servicesPagination.total})
              </button>
              <button
                onClick={() => handleTabChange('categories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories ({categoriesPagination.total})
              </button>
            </nav>
          </div>

          {/* Services Tab Content */}
          {activeTab === 'services' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Manage Services</h2>
                {session.user.role === UserRole.ADMIN && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Service
                  </button>
                )}
              </div>

              {/* Services Filters */}
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
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    handleFilterChange();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => {
                      setShowActiveOnly(e.target.checked);
                      handleFilterChange();
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active only</span>
                </label>
              </div>

              {/* Services Grid */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {filteredServices.map(service => (
                      <div key={service.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {service.icon_url ? (
                              <img src={service.icon_url} alt="" className="w-8 h-8 rounded" />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
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
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              service.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {service.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Amount:</span>
                            <span className="font-medium">₹{service.amount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Roles:</span>
                            <span className="font-medium">{service.allowed_roles.join(', ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(service.service_url, '_blank')}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Preview
                          </button>
                          <button
                            onClick={() => {
                              setSelectedService(service);
                              setShowEditModal(true);
                            }}
                            className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {session.user.role === UserRole.ADMIN && (
                            <button
                              onClick={() => handleDelete(service.id)}
                              className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Services Pagination */}
                  <PaginationComponent 
                    pagination={servicesPagination} 
                    onPageChange={handleServicesPageChange} 
                  />
                </>
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
                      : 'Get started by creating your first direct link service'
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {/* Categories Tab Content */}
          {activeTab === 'categories' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Manage Categories</h2>
                {session.user.role === UserRole.ADMIN && (
                  <button
                    onClick={() => setShowCreateCategoryModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Category
                  </button>
                )}
              </div>

              {/* Categories Grid */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                    {categories.map(category => (
                      <div key={category.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{category.icon}</div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{category.name}</h3>
                              <p className="text-sm text-gray-500">Order: {category.sort_order}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            category.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {category.description || 'No description provided'}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCategoryForEdit(category);
                              setShowEditCategoryModal(true);
                            }}
                            className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 flex items-center justify-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          {session.user.role === UserRole.ADMIN && (
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Categories Pagination */}
                  <PaginationComponent 
                    pagination={categoriesPagination} 
                    onPageChange={handleCategoriesPageChange} 
                  />
                </>
              )}

              {categories.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <div className="text-6xl">📂</div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-600">Get started by creating your first category</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Service Modals */}
        {showCreateModal && (
          <CreateServiceModal
            categories={allCategories}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchServices();
            }}
          />
        )}

        {showEditModal && selectedService && (
          <EditServiceModal
            service={selectedService}
            categories={allCategories}
            onClose={() => {
              setShowEditModal(false);
              setSelectedService(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedService(null);
              fetchServices();
            }}
          />
        )}

        {/* Category Modals */}
        {showCreateCategoryModal && (
          <CreateCategoryModal
            onClose={() => setShowCreateCategoryModal(false)}
            onSuccess={() => {
              setShowCreateCategoryModal(false);
              fetchCategories();
            }}
          />
        )}

        {showEditCategoryModal && selectedCategoryForEdit && (
          <EditCategoryModal
            category={selectedCategoryForEdit}
            onClose={() => {
              setShowEditCategoryModal(false);
              setSelectedCategoryForEdit(null);
            }}
            onSuccess={() => {
              setShowEditCategoryModal(false);
              setSelectedCategoryForEdit(null);
              fetchCategories();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}