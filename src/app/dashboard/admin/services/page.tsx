'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';

export default function AdminServicesPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixingDropdowns, setFixingDropdowns] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_free: false,
    category: '',
    documents: '',
    processing_time_days: '',
    commission_rate: '',
    image_url: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Define the type first to avoid hoisting issues
  type DynamicFieldType = {
    id: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'file' | 'image' | 'pdf';
    required: boolean;
    options?: string[];
    placeholder?: string;
    accept?: string;
    description?: string;
  };

  const [dynamicFields, setDynamicFields] = useState<DynamicFieldType[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<Array<{
    id: string;
    name: string;
    description: string;
    required: boolean;
  }>>([]);

  // Define functions before useEffect to avoid hoisting issues
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Check loading state first
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Check admin access after session is loaded
  if (!session || session?.user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      showToast.error('Service name required', {
        description: 'Service name is required'
      });
      return;
    }

    // Validate dynamic fields
    for (const field of dynamicFields) {
      if (!field.label.trim()) {
        showToast.error('Field label required', {
          description: 'All dynamic fields must have a label'
        });
        return;
      }
      if (field.type === 'select') {
        if (!field.options || field.options.length === 0) {
          showToast.error('Dropdown options required', {
            description: `Dropdown field "${field.label}" must have at least one option`
          });
          return;
        }
        // Check for empty options
        const emptyOptions = field.options.filter(opt => !opt.trim());
        if (emptyOptions.length > 0) {
          showToast.error('Invalid dropdown options', {
            description: `Dropdown field "${field.label}" contains empty options. Please remove empty options.`
          });
          return;
        }
      }
    }

    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const serviceData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        processing_time_days: parseInt(formData.processing_time_days) || 7,
        commission_rate: parseFloat(formData.commission_rate) || 0,
        documents: formData.documents.split(',').map(doc => doc.trim()).filter(doc => doc),
        dynamic_fields: dynamicFields,
        required_documents: requiredDocuments,
        image_url: imageUrl
      };

      // Add console logging for debugging dropdown options

      dynamicFields.forEach((field, index) => {
        if (field.type === 'select') {

        }
      });

      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      if (response.ok) {
        await fetchServices();
        resetForm();
        showToast.success(editingService ? 'Service updated successfully!' : 'Service added successfully!');
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || 'Unknown error';
        } catch (parseError) {
          // If response is not JSON, get text
          const errorText = await response.text();
          errorMessage = errorText || `HTTP ${response.status} error`;
        }
        showToast.error('Failed to save service', {
          description: errorMessage
        });
      }
    } catch (error) {
      showToast.error('Error saving service', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price?.toString() || '0',
      is_free: service.is_free || false,
      category: service.category || '',
      documents: service.documents?.join(', ') || '',
      processing_time_days: service.processing_time_days?.toString() || '7',
      commission_rate: service.commission_rate?.toString() || '0',
      image_url: service.image_url || ''
    });
    setDynamicFields(service.dynamic_fields || []);
    setRequiredDocuments(service.required_documents || []);
    setSelectedImage(null);
    setImagePreview(service.image_url || null);
    setShowAddForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    // Use custom toast confirmation instead of browser confirm
    showToast.custom('Delete service?', 'warning', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          await performDelete(serviceId);
        }
      }
    });
  };

  const performDelete = async (serviceId: string) => {

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchServices();
        showToast.success('Service deleted successfully!');
      } else {
        showToast.error('Failed to delete service');
      }
    } catch (error) {
      showToast.error('Error deleting service');
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        await fetchServices();
        showToast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'services');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      is_free: false,
      category: '',
      documents: '',
      processing_time_days: '',
      commission_rate: '',
      image_url: ''
    });
    setDynamicFields([]);
    setRequiredDocuments([]);
    setSelectedImage(null);
    setImagePreview(null);
    setEditingService(null);
    setShowAddForm(false);
  };

  const addDynamicField = () => {
    const newField: DynamicFieldType = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setDynamicFields(prevFields => [...prevFields, newField]);
  };

  const updateDynamicField = (id: string, updates: Partial<DynamicFieldType>) => {
    setDynamicFields(prevFields =>
      prevFields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeDynamicField = (id: string) => {
    setDynamicFields(prevFields => prevFields.filter(field => field.id !== id));
  };

  const addRequiredDocument = () => {
    const newDoc = {
      id: `doc_${Date.now()}`,
      name: '',
      description: '',
      required: true
    };
    setRequiredDocuments([...requiredDocuments, newDoc]);
  };

  const updateRequiredDocument = (id: string, updates: Partial<typeof requiredDocuments[0]>) => {
    setRequiredDocuments(docs =>
      docs.map(doc =>
        doc.id === id ? { ...doc, ...updates } : doc
      )
    );
  };

  const removeRequiredDocument = (id: string) => {
    setRequiredDocuments(docs => docs.filter(doc => doc.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const fixDropdownFields = async () => {
    setFixingDropdowns(true);
    try {
      const response = await fetch('/api/admin/fix-dropdown-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(`Fixed ${result.fixedServices?.length || 0} services with malformed dropdown fields`);
        await fetchServices(); // Refresh the services list
      } else {
        alert(result.error || 'Failed to fix dropdown fields');
      }
    } catch (error) {
      alert('Error fixing dropdown fields');
    } finally {
      setFixingDropdowns(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Service Management</h1>
          <p className="text-red-100 text-xl">
            Manage government services and schemes available to citizens
          </p>
        </div>

        {/* Add Service Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-red-800">Services ({services.length})</h2>
          <div className="flex gap-2">
            <Button
              onClick={fixDropdownFields}
              disabled={fixingDropdowns}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {fixingDropdowns ? '🔧 Fixing...' : '🔧 Fix Dropdowns'}
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {showAddForm ? '❌ Cancel' : '➕ Add Service'}
            </Button>
          </div>
        </div>

        {/* Add/Edit Service Form */}
        {showAddForm && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-red-700 mb-2">Service Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter service name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Identity Documents">Identity Documents</option>
                    <option value="Certificates">Certificates</option>
                    <option value="Business Services">Business Services</option>
                    <option value="Educational Services">Educational Services</option>
                    <option value="Social Welfare">Social Welfare</option>
                    <option value="Revenue Services">Revenue Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Processing Time (days)</label>
                  <input
                    type="number"
                    name="processing_time_days"
                    value={formData.processing_time_days}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="7"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 mb-2">Commission Rate (%)</label>
                  <input
                    type="number"
                    name="commission_rate"
                    value={formData.commission_rate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="10.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-red-700 mb-2">Required Documents</label>
                  <input
                    type="text"
                    name="documents"
                    value={formData.documents}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="photo, address_proof, identity_proof (comma separated)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-red-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter service description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-red-700 mb-2">Service Image</label>

                  {/* Image Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Service preview"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, image_url: '' }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Upload an image that will be displayed to retailers for this service
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_free"
                      checked={formData.is_free}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-red-700">This is a free service</span>
                  </label>
                </div>

                {/* Dynamic Fields Section */}
                <div className="md:col-span-2">
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-medium text-red-700">Custom Form Fields</label>
                      <Button
                        type="button"
                        onClick={addDynamicField}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                      >
                        ➕ Add Field
                      </Button>
                    </div>

                    {dynamicFields.map((field, index) => (
                      <div key={field.id} className="bg-gray-50 p-4 rounded-lg mb-4 border">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Field Label</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateDynamicField(field.id, { label: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter field label"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => updateDynamicField(field.id, { type: e.target.value as any })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="date">Date</option>
                              <option value="select">Dropdown</option>
                              <option value="textarea">Textarea</option>
                              <option value="file">File Upload</option>
                              <option value="image">Image Upload</option>
                              <option value="pdf">PDF Upload</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => updateDynamicField(field.id, { placeholder: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter placeholder text"
                            />
                          </div>

                          <div className="flex items-end gap-2">
                            <label className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateDynamicField(field.id, { required: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700">Required</span>
                            </label>
                            <Button
                              type="button"
                              onClick={() => removeDynamicField(field.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>

                        {field.type === 'select' && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Options (comma separated) *
                            </label>
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => {
                                const optionsText = e.target.value;
                                const options = optionsText
                                  .split(',')
                                  .map(opt => opt.trim())
                                  .filter(opt => opt.length > 0);
                                updateDynamicField(field.id, { options });
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Option 1, Option 2, Option 3"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Enter options separated by commas. Example: "Yes, No, Maybe"
                            </p>
                            {field.options && field.options.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">Preview:</p>
                                <div className="flex flex-wrap gap-1">
                                  {field.options.map((option, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {['file', 'image', 'pdf'].includes(field.type) && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">File Description</label>
                              <input
                                type="text"
                                value={field.description || ''}
                                onChange={(e) => updateDynamicField(field.id, { description: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Upload your Aadhaar card copy"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Accepted File Types</label>
                              <input
                                type="text"
                                value={field.accept || ''}
                                onChange={(e) => updateDynamicField(field.id, { accept: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder={
                                  field.type === 'image' ? '.jpg,.jpeg,.png,.gif' :
                                  field.type === 'pdf' ? '.pdf' :
                                  '.jpg,.jpeg,.png,.pdf,.doc,.docx'
                                }
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {field.type === 'image' && 'Default: .jpg,.jpeg,.png,.gif'}
                                {field.type === 'pdf' && 'Default: .pdf'}
                                {field.type === 'file' && 'Default: All file types'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {dynamicFields.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-2xl mb-2">📝</div>
                        <p className="text-sm">No custom fields added yet. Click "Add Field" to create custom form fields for this service.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                    {editingService ? '💾 Update Service' : '➕ Add Service'}
                  </Button>
                  <Button type="button" onClick={resetForm} variant="outline">
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Services List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </CardContent>
          </Card>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">Add your first service to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className={`hover:shadow-lg transition-shadow ${!service.is_active ? 'opacity-60' : ''}`}>
                {/* Service Image */}
                {service.image_url && (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image if it fails to load
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        service.is_active ? 'bg-green-100/90 text-green-600' : 'bg-red-100/90 text-red-600'
                      }`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                )}
                <CardHeader className={service.image_url ? 'pb-2' : ''}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-2">{service.name}</CardTitle>
                      <CardDescription>{service.category}</CardDescription>
                    </div>
                    {!service.image_url && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className={`font-medium ${service.is_free ? 'text-green-600' : 'text-gray-900'}`}>
                        {service.is_free ? 'FREE' : formatCurrency(service.price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Processing:</span>
                      <span className="font-medium">{service.processing_time_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Commission:</span>
                      <span className="font-medium">{service.commission_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Documents:</span>
                      <span className="font-medium">{service.documents?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(service)}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      onClick={() => toggleServiceStatus(service.id, service.is_active)}
                      size="sm"
                      className={`flex-1 ${service.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    >
                      {service.is_active ? '⏸️ Hide' : '▶️ Show'}
                    </Button>
                    <Button
                      onClick={() => handleDelete(service.id)}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      🗑️
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
