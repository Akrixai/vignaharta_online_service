'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import ServiceApplicationProgress from '@/components/ServiceApplicationProgress';
import { useSearchParams } from 'next/navigation';

export default function ServiceApplicationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const serviceId = params.id as string;
  const draftId = searchParams.get('draftId');

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [isReapply, setIsReapply] = useState(false);
  const [reapplyData, setReapplyData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    purpose: '',
    remarks: '',
    service_specific_data: {} as Record<string, any>
  });

  const [documents, setDocuments] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState<{
    base_amount: number;
    gst_percentage: number;
    gst_amount: number;
    platform_fee: number;
    total_amount: number;
  } | null>(null);

  // Calculate progress based on filled fields
  const calculateProgress = () => {
    let filledFields = 0;
    let totalFields = 5; // Basic fields: name, phone, address, purpose, remarks

    if (formData.customer_name) filledFields++;
    if (formData.customer_phone) filledFields++;
    if (formData.customer_address) filledFields++;
    if (formData.purpose) filledFields++;
    if (formData.remarks) filledFields++;

    // Add dynamic fields to calculation
    if (service?.dynamic_fields) {
      totalFields += service.dynamic_fields.length;
      service.dynamic_fields.forEach((field: any) => {
        if (formData.service_specific_data[`dynamic_${field.id}`]) {
          filledFields++;
        }
      });
    }

    const progress = Math.round((filledFields / totalFields) * 100);
    const step = Math.ceil((progress / 100) * totalSteps);
    return { progress, step: Math.max(1, Math.min(step, totalSteps)) };
  };

  // Update current step based on progress
  useEffect(() => {
    if (service) {
      const { step } = calculateProgress();
      setCurrentStep(step);
    }
  }, [formData, service]);

  // Save draft function
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const { progress } = calculateProgress();

      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheme_id: serviceId,
          draft_data: {
            formData,
            uploadedFiles,
            documents: documents.map(d => d.name)
          },
          progress_percentage: progress,
          current_step: currentStep,
          total_steps: totalSteps
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast.success('Draft saved successfully!', {
          description: 'You can continue this application later from Draft Applications'
        });
      } else {
        showToast.error('Failed to save draft', {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Load draft if draftId is present
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId) return;

      try {
        const response = await fetch(`/api/drafts/${draftId}`);
        const result = await response.json();

        if (result.success && result.data) {
          const draft = result.data;
          if (draft.draft_data) {
            setFormData(draft.draft_data.formData || formData);
            setUploadedFiles(draft.draft_data.uploadedFiles || {});
          }
          showToast.info('Draft loaded', {
            description: 'Continue where you left off'
          });
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadDraft();
  }, [draftId]);

  // Check for reapply data on component mount
  useEffect(() => {
    const reapplyDataStr = sessionStorage.getItem('reapplyData');
    if (reapplyDataStr) {
      try {
        const data = JSON.parse(reapplyDataStr);
        if (data.schemeId === serviceId && data.isReapply) {
          setIsReapply(true);
          setReapplyData(data);
          
          // Prefill form data
          setFormData({
            customer_name: data.customerData.name || '',
            customer_phone: data.customerData.phone || '',
            customer_email: data.customerData.email || '',
            customer_address: data.customerData.address || '',
            purpose: data.formData?.purpose || '',
            remarks: data.formData?.remarks || '',
            service_specific_data: data.formData?.service_specific_data || {}
          });

          // Clear the session storage
          sessionStorage.removeItem('reapplyData');
          
          showToast.info('Reapplication Form', {
            description: 'Your previous data has been prefilled. Regular fees applied again.'
          });
        }
      } catch (error) {
      }
    }
  }, [serviceId]);

  // Fetch service details
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/schemes/${serviceId}`);
        if (response.ok) {
          const result = await response.json();
          setService(result.scheme);
        } else {
          showToast.error('Service not found');
          router.push('/dashboard/services');
        }
      } catch (error) {
        showToast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId, router]);

  // Check retailer access
  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!service) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Service Not Found</h1>
          <p className="text-gray-600">The requested service could not be found.</p>
          <Button onClick={() => router.push('/dashboard/services')} className="mt-4">
            Back to Services
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceSpecificChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      service_specific_data: {
        ...prev.service_specific_data,
        [`dynamic_${fieldId}`]: value
      }
    }));
  };

  const handleFileUpload = async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', file);
      formDataForUpload.append('folder', 'applications');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataForUpload,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.url) {
            uploadedUrls.push(result.url);
          }
        } else {
          showToast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        showToast.error('Failed to upload file');
      }
    }

    if (uploadedUrls.length > 0) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), ...uploadedUrls]
      }));
    }
  };

  // Calculate fee breakdown
  const calculateFeeBreakdown = () => {
    if (!service || isReapply) {
      return null;
    }

    const baseAmount = service.is_free ? 0 : service.price;
    const gstPercentage = 2; // 2% GST
    const gstAmount = (baseAmount * gstPercentage) / 100;
    const platformFee = 5; // ₹5 platform fee
    const totalAmount = baseAmount + gstAmount + platformFee;

    return {
      base_amount: parseFloat(baseAmount.toFixed(2)),
      gst_percentage: gstPercentage,
      gst_amount: parseFloat(gstAmount.toFixed(2)),
      platform_fee: platformFee,
      total_amount: parseFloat(totalAmount.toFixed(2))
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.customer_name.trim()) {
      showToast.error('Customer name is required');
      return;
    }

    if (!formData.customer_phone || formData.customer_phone.length !== 10) {
      showToast.error('Phone number must be exactly 10 digits');
      return;
    }

    if (!formData.customer_address.trim()) {
      showToast.error('Customer address is required');
      return;
    }

    // Calculate fee breakdown and show modal
    const breakdown = calculateFeeBreakdown();
    if (breakdown && breakdown.total_amount > 0) {
      setFeeBreakdown(breakdown);
      setShowPaymentModal(true);
      return;
    }

    // If free service or reapply, submit directly
    await submitApplication();
  };

  const submitApplication = async () => {
    setSubmitting(true);

    try {
      // Upload regular documents if any
      let documentUrls: string[] = [];
      if (documents.length > 0) {
        for (const file of documents) {
          const formDataForUpload = new FormData();
          formDataForUpload.append('file', file);
          formDataForUpload.append('folder', 'applications');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formDataForUpload,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            if (uploadResult.success && uploadResult.url) {
              documentUrls.push(uploadResult.url);
            }
          }
        }
      }

      const applicationData = {
        scheme_id: serviceId,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        customer_address: formData.customer_address,
        form_data: {
          purpose: formData.purpose,
          remarks: formData.remarks,
          service_specific_data: formData.service_specific_data
        },
        documents: documentUrls,
        dynamic_field_documents: uploadedFiles,
        amount: isReapply ? 0 : (service.is_free ? 0 : service.price),
        is_reapply: isReapply,
        original_application_id: reapplyData?.originalApplicationId,
        fee_breakdown: feeBreakdown
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        showToast.success(
          isReapply 
            ? 'Reapplication submitted successfully!' 
            : 'Application submitted successfully! Payment will be debited after approval.'
        );
        setShowPaymentModal(false);
        router.push('/dashboard/applications');
      } else {
        const error = await response.json();
        showToast.error(error.message || 'Failed to submit application');
      }
    } catch (error) {
      showToast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const servicePrice = isReapply ? 0 : (service.is_free ? 0 : service.price);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/services')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Services</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isReapply ? 'Reapply for' : 'Apply for'} {service.name}
              </h1>
              <p className="text-gray-600">{service.description}</p>
            </div>
          </div>
        </div>

        {/* Reapply Notice */}
        {isReapply && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-blue-800 font-medium">
                  This is a reapplication. No charges will apply for this submission.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Info */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium">{service.category}</span>
              </div>
              <div>
                <span className="text-gray-500">Price:</span>
                <span className="ml-2 font-medium">
                  {servicePrice === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatCurrency(servicePrice)
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Processing Time:</span>
                <span className="ml-2 font-medium">{service.processing_time_days} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <ServiceApplicationProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          onSaveDraft={handleSaveDraft}
          isSaving={savingDraft}
        />

        {/* Application Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Application Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <Input
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <Textarea
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter complete address"
                    rows={3}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <Textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder="Purpose of application"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <Textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Any additional remarks"
                    rows={3}
                  />
                </div>
              </div>

              {/* Dynamic Fields */}
              {service.dynamic_fields && service.dynamic_fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Service Specific Information</h3>
                  {service.dynamic_fields.map((field: any) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && '*'}
                      </label>

                      {field.type === 'text' && (
                        <Input
                          value={formData.service_specific_data[`dynamic_${field.id}`] || ''}
                          onChange={(e) => handleServiceSpecificChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <Textarea
                          value={formData.service_specific_data[`dynamic_${field.id}`] || ''}
                          onChange={(e) => handleServiceSpecificChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={3}
                        />
                      )}

                      {field.type === 'select' && (() => {
                        // Helper function to parse and fix malformed options
                        const parseOptions = (options: any): string[] => {
                          if (!options) return [];

                          const parsedOptions: string[] = [];

                          // Handle different types of options data
                          if (Array.isArray(options)) {
                            options.forEach((option: any) => {
                              if (typeof option === 'string') {
                                const trimmedOption = option.trim();
                                if (trimmedOption.length === 0) return;

                                // Check if this looks like merged options (no spaces, long string, mixed case)
                                if (trimmedOption.length > 15 && !trimmedOption.includes(' ') && /[a-z][A-Z]/.test(trimmedOption)) {
                                  // Try to split camelCase or merged words
                                  const splitOptions = trimmedOption.match(/[A-Z][a-z]+|[a-z]+/g);
                                  if (splitOptions && splitOptions.length > 1) {

                                    parsedOptions.push(...splitOptions.map(opt =>
                                      opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()
                                    ));
                                  } else {
                                    parsedOptions.push(trimmedOption);
                                  }
                                } else {
                                  parsedOptions.push(trimmedOption);
                                }
                              } else {
                                const stringOption = String(option).trim();
                                if (stringOption.length > 0) {
                                  parsedOptions.push(stringOption);
                                }
                              }
                            });
                          } else if (typeof options === 'string') {
                            // If options is a string, split by comma
                            const stringOptions = options
                              .split(',')
                              .map((option: string) => option.trim())
                              .filter((option: string) => option.length > 0);
                            parsedOptions.push(...stringOptions);
                          }

                          // Remove duplicates and return
                          return [...new Set(parsedOptions)];
                        };

                        const processedOptions = parseOptions(field.options);

                        return (
                          <div>
                            <select
                              value={formData.service_specific_data[`dynamic_${field.id}`] || ''}
                              onChange={(e) => handleServiceSpecificChange(field.id, e.target.value)}
                              required={field.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <option value="">Select an option</option>
                              {processedOptions.length > 0 ? (
                                processedOptions.map((option: string, index: number) => (
                                  <option key={index} value={option}>{option}</option>
                                ))
                              ) : (
                                <option disabled>No options available</option>
                              )}
                            </select>
                            {processedOptions.length === 0 && (
                              <p className="text-xs text-red-500 mt-1">
                                ⚠️ This dropdown field has no options configured. Please contact support.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {(field.type === 'file' || field.type === 'image' || field.type === 'pdf') && (
                        <div>
                          <div className="mb-2 text-sm text-gray-600">
                            Upload {field.type === 'image' ? 'Image' : field.type === 'pdf' ? 'PDF Document' : 'File'} for: <strong>{field.label}</strong>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept={field.type === 'image' ? 'image/*' : field.type === 'pdf' ? '.pdf' : '*'}
                            onChange={(e) => handleFileUpload(field.id, e.target.files)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            {field.type === 'image' && 'Accepted formats: JPG, PNG, GIF'}
                            {field.type === 'pdf' && 'Accepted format: PDF only'}
                            {field.type === 'file' && 'All file formats accepted'}
                          </div>
                          {uploadedFiles[field.id] && uploadedFiles[field.id].length > 0 && (
                            <div className="mt-2 space-y-1">
                              {uploadedFiles[field.id].map((url, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm text-green-600">
                                  <FileText className="w-4 h-4" />
                                  <span>File {index + 1} uploaded successfully</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Regular Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Documents
                </label>
                <div className="mb-2 text-sm text-gray-600">
                  Upload any additional supporting documents (optional)
                </div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-1 text-xs text-gray-500">
                  All file formats accepted. You can select multiple files.
                </div>
                {documents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {documents.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/services')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting ? 'Submitting...' : (isReapply ? 'Submit Reapplication' : 'Submit Application')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Payment Breakdown Modal */}
        {showPaymentModal && feeBreakdown && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💳</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Payment Details</h3>
                      <p className="text-blue-100 text-sm">Review charges before submission</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📋</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-bold text-gray-900">{service?.name}</p>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Fee Breakdown
                </h4>
                
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-5 rounded-2xl border-2 border-blue-200 shadow-inner">
                  <div className="space-y-4">
                    {/* Base Amount */}
                    <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">💰</span>
                        <span className="text-gray-700 font-medium">Service Fee</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">₹{feeBreakdown.base_amount.toFixed(2)}</span>
                    </div>
                    
                    {/* GST */}
                    <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">📈</span>
                        <span className="text-gray-700 font-medium">GST ({feeBreakdown.gst_percentage}%)</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">₹{feeBreakdown.gst_amount.toFixed(2)}</span>
                    </div>
                    
                    {/* Platform Fee */}
                    <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-600">⚡</span>
                        <span className="text-gray-700 font-medium">Platform Fee</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">₹{feeBreakdown.platform_fee.toFixed(2)}</span>
                    </div>
                    
                    {/* Total */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl shadow-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-white text-xl">💎</span>
                          <span className="text-xl font-bold text-white">Total Amount</span>
                        </div>
                        <span className="text-3xl font-extrabold text-white">₹{feeBreakdown.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-medium mb-2 flex items-center">
                    <span className="mr-1">ℹ️</span>
                    Calculation Details:
                  </p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• Service Fee: ₹{feeBreakdown.base_amount.toFixed(2)}</p>
                    <p>• GST ({feeBreakdown.gst_percentage}%): ₹{feeBreakdown.base_amount.toFixed(2)} × {feeBreakdown.gst_percentage}% = ₹{feeBreakdown.gst_amount.toFixed(2)}</p>
                    <p>• Platform Fee: ₹{feeBreakdown.platform_fee.toFixed(2)} (Fixed)</p>
                    <p className="font-bold pt-1 border-t border-blue-300">• Total: ₹{feeBreakdown.base_amount.toFixed(2)} + ₹{feeBreakdown.gst_amount.toFixed(2)} + ₹{feeBreakdown.platform_fee.toFixed(2)} = ₹{feeBreakdown.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600 text-2xl">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-900 font-bold mb-1">
                        Payment After Approval
                      </p>
                      <p className="text-xs text-yellow-800 leading-relaxed">
                        No immediate payment required. The total amount of <strong>₹{feeBreakdown.total_amount.toFixed(2)}</strong> will be automatically debited from your wallet only when the admin approves your application. Make sure you have sufficient balance in your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 font-semibold"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitApplication}
                  disabled={submitting}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✓</span>
                      Confirm & Submit
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
