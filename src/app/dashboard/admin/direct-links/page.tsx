'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import DashboardLayout from '@/components/dashboard/layout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  ExternalLink,
  DollarSign,
  Users,
  TrendingUp,
  Star
} from 'lucide-react';

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

export default function DirectLinksManagement() {
  const { data: session } = useSession();
  const [services, setServices] = useState<DirectLinkService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState<DirectLinkService | null>(null);

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

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [selectedCategory, showActiveOnly]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (showActiveOnly) params.append('is_active', 'true');

      const response = await fetch(`/api/admin/direct-links?${params}`);
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

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Direct Links Services</h1>
              <p className="text-gray-600">Manage direct service links for customers and retailers</p>
            </div>
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
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active only</span>
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

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <CreateServiceModal
            categories={categories}
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
            categories={categories}
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
      </div>
    </DashboardLayout>
  );
}

// Create Service Modal Component
function CreateServiceModal({ 
  categories, 
  onClose, 
  onSuccess 
}: { 
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service_url: '',
    service_type: 'EXTERNAL_LINK',
    amount: 0,
    is_active: true,
    is_featured: false,
    category: '',
    icon_url: '',
    button_text: 'Access Service',
    redirect_type: 'NEW_TAB',
    requires_payment: true,
    allowed_roles: ['RETAILER', 'CUSTOMER']
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/direct-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        alert('Failed to create service: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Direct Link Service</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service URL *
            </label>
            <input
              type="url"
              required
              value={formData.service_url}
              onChange={(e) => setFormData({ ...formData, service_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Featured Service</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requires_payment}
                onChange={(e) => setFormData({ ...formData, requires_payment: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Requires Payment</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Service Modal Component
function EditServiceModal({ 
  service, 
  categories, 
  onClose, 
  onSuccess 
}: { 
  service: DirectLinkService;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description || '',
    service_url: service.service_url,
    service_type: service.service_type,
    amount: service.amount,
    is_active: service.is_active,
    is_featured: service.is_featured,
    category: service.category,
    icon_url: service.icon_url || '',
    button_text: service.button_text,
    redirect_type: service.redirect_type,
    requires_payment: service.requires_payment,
    allowed_roles: service.allowed_roles
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/direct-links/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        alert('Failed to update service: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Direct Link Service</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service URL *
            </label>
            <input
              type="url"
              required
              value={formData.service_url}
              onChange={(e) => setFormData({ ...formData, service_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Featured Service</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requires_payment}
                onChange={(e) => setFormData({ ...formData, requires_payment: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Requires Payment</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}