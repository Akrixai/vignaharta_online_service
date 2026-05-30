'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { FileText, X } from 'lucide-react';
import { useRecaptchaEnterprise } from '@/hooks/useRecaptchaEnterprise';

interface ServiceApplicationFormProps {
  service: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  draftData?: any;
  draftId?: string;
}

export default function ServiceApplicationForm({ service, isOpen, onClose, onSuccess, draftData, draftId }: ServiceApplicationFormProps) {
  const { data: session } = useSession();
  const { executeRecaptcha, isReady } = useRecaptchaEnterprise();
  const [loading, setLoading] = useState(false);
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
  const [savingDraft, setSavingDraft] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // 3 steps: Form Details, Document Upload, and Payment Summary
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState<{
    base_amount: number;
    gst_percentage: number;
    gst_amount: number;
    platform_fee: number;
    total_amount: number;
  } | null>(null);

  // Calculate form completion for step navigation
  const calculateFormCompletion = () => {
    let filledFields = 0;
    let totalFields = 4; // Required basic fields: name, phone, address, purpose

    if (formData.customer_name.trim()) filledFields++;
    if (formData.customer_phone.trim()) filledFields++;
    if (formData.customer_address.trim()) filledFields++;
    if (formData.purpose.trim()) filledFields++;

    // Add dynamic fields
    if (service?.dynamic_fields) {
      const requiredDynamicFields = service.dynamic_fields.filter((field: any) => field.required);
      totalFields += requiredDynamicFields.length;

      requiredDynamicFields.forEach((field: any) => {
        const value = formData.service_specific_data[`dynamic_${field.id}`];
        if (value && value.toString().trim()) {
          filledFields++;
        }
      });
    }

    const progress = Math.round((filledFields / totalFields) * 100);
    const isFormComplete = filledFields === totalFields;

    return { progress, isFormComplete, filledFields, totalFields };
  };

  // Check if we can proceed to step 2 (Document Upload)
  const canProceedToStep2 = () => {
    return true;
  };

  // Check if we can proceed to step 3 (Payment Summary)
  const canProceedToStep3 = () => {
    return true;
  };

  // Save draft function
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const { progress } = calculateFormCompletion();

      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheme_id: service.id,
          draft_data: {
            formData,
            uploadedFiles,
            documents: documents.map(d => d.name),
            // Persist effective_price so subscription pricing survives draft resume
            effective_price: service.effective_price !== undefined ? service.effective_price : service.price
          },
          progress_percentage: progress,
          current_step: currentStep,
          total_steps: totalSteps
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Draft saved successfully! You can continue later from Draft Applications');
        // If we're updating an existing draft, keep the modal open
        // If it's a new draft, user can continue editing
      } else {
        toast.error('Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Special handling for phone number
    if (name === 'customer_phone') {
      // Remove all non-digits
      let cleanPhone = value.replace(/\D/g, '');

      // Remove leading zeros
      cleanPhone = cleanPhone.replace(/^0+/, '');

      // Limit to 10 digits
      if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(0, 10);
      }

      setFormData(prev => ({
        ...prev,
        [name]: cleanPhone
      }));
      return;
    }

    if (name.startsWith('dynamic_')) {
      setFormData(prev => ({
        ...prev,
        service_specific_data: {
          ...prev.service_specific_data,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDynamicFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string, fieldType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        // Upload the file to get actual URL
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
            setUploadedFiles(prev => ({
              ...prev,
              [fieldId]: [uploadResult.url]
            }));

            toast.success(`${file.name} uploaded successfully!`);
          } else {
            toast.error(`Failed to upload ${file.name}`);
          }
        } else {
          const errorData = await uploadResponse.json();
          toast.error(`Upload failed: ${errorData.error}`);
        }
      } catch (error) {
        toast.error('Failed to upload file');
      }
    }
  };

  // Calculate fee breakdown
  const calculateFeeBreakdown = () => {
    if (!service || service.is_free) {
      return null;
    }

    // Use subscription price if available (passed via service.effective_price)
    const baseAmount = service.effective_price !== undefined ? service.effective_price : service.price;
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

    // Validate phone number
    if (!formData.customer_phone || formData.customer_phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits long (without leading zeros)');
      return;
    }

    // Validate required fields
    if (!formData.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (!formData.customer_address.trim()) {
      toast.error('Customer address is required');
      return;
    }

    // CRITICAL: Check wallet balance for paid services BEFORE submission
    const breakdown = calculateFeeBreakdown();
    if (breakdown && breakdown.total_amount > 0) {
      setFeeBreakdown(breakdown);

      // Check wallet balance
      const balanceCheckPassed = await checkWalletBalance(breakdown.total_amount);
      if (!balanceCheckPassed) {
        return; // Don't proceed if balance check failed
      }
    }

    // Submit application
    await submitApplication();
  };

  const checkWalletBalance = async (requiredAmount: number): Promise<boolean> => {
    try {
      // Fetch current wallet balance
      const response = await fetch('/api/wallet/balance');
      const data = await response.json();

      if (!data.success) {
        toast.error('Failed to check wallet balance');
        return false;
      }

      const currentBalance = data.balance || 0;

      if (currentBalance < requiredAmount) {
        // Show insufficient balance dialog
        const shouldAddMoney = await showInsufficientBalanceDialog(requiredAmount, currentBalance);
        return shouldAddMoney;
      }

      // Show balance confirmation dialog
      return await showBalanceConfirmationDialog(requiredAmount, currentBalance);

    } catch (error) {
      console.error('Error checking wallet balance:', error);
      toast.error('Failed to check wallet balance');
      return false;
    }
  };

  const showInsufficientBalanceDialog = (requiredAmount: number, currentBalance: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const shortfall = requiredAmount - currentBalance;

      // Create and show modal
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100000]';
      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          <div class="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span class="text-2xl">❌</span>
              </div>
              <div>
                <h3 class="text-xl font-bold">Insufficient Balance</h3>
                <p class="text-red-100 text-sm">You don't have enough wallet balance</p>
              </div>
            </div>
          </div>
          
          <div class="p-6">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-700">Required Amount:</span>
                  <span class="font-bold text-red-600">₹${requiredAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">Current Balance:</span>
                  <span class="font-bold">₹${currentBalance.toFixed(2)}</span>
                </div>
                <div class="border-t pt-2 flex justify-between">
                  <span class="text-gray-700 font-medium">Shortfall:</span>
                  <span class="font-bold text-red-600">₹${shortfall.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <div class="flex items-start space-x-2">
                <span class="text-orange-500 text-lg">💡</span>
                <p class="text-sm text-orange-800">
                  Please add money to your wallet before submitting this application.
                </p>
              </div>
            </div>
            
            <div class="flex space-x-3">
              <button id="cancel-btn" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button id="add-money-btn" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                Add Money
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const cancelBtn = modal.querySelector('#cancel-btn');
      const addMoneyBtn = modal.querySelector('#add-money-btn');

      const cleanup = () => {
        document.body.removeChild(modal);
      };

      cancelBtn?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      addMoneyBtn?.addEventListener('click', () => {
        cleanup();
        // Navigate to wallet page
        window.location.href = '/dashboard/wallet';
        resolve(false);
      });
    });
  };

  const showBalanceConfirmationDialog = (requiredAmount: number, currentBalance: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const remainingBalance = currentBalance - requiredAmount;

      // Create and show modal
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100000]';
      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          <div class="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span class="text-2xl">💳</span>
              </div>
              <div>
                <h3 class="text-xl font-bold">Payment Confirmation</h3>
                <p class="text-green-100 text-sm">Confirm wallet payment</p>
              </div>
            </div>
          </div>
          
          <div class="p-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-700">Payment Amount:</span>
                  <span class="font-bold text-blue-600">₹${requiredAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">Current Balance:</span>
                  <span class="font-bold">₹${currentBalance.toFixed(2)}</span>
                </div>
                <div class="border-t pt-2 flex justify-between">
                  <span class="text-gray-700 font-medium">After Payment:</span>
                  <span class="font-bold text-green-600">₹${remainingBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div class="flex items-start space-x-2">
                <span className="text-yellow-500 text-lg">⚠️</span>
                <p className="text-sm text-yellow-800">
                  The amount will be immediately deducted from your wallet upon submission. Full refund if rejected.
                </p>
              </div>
            </div>
            
            <div class="flex space-x-3">
              <button id="cancel-btn" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button id="confirm-btn" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const cancelBtn = modal.querySelector('#cancel-btn');
      const confirmBtn = modal.querySelector('#confirm-btn');

      const cleanup = () => {
        document.body.removeChild(modal);
      };

      cancelBtn?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      confirmBtn?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });
    });
  };

  const submitApplication = async () => {
    setLoading(true);

    // Execute reCAPTCHA Enterprise
    let recaptchaToken = '';
    if (isReady) {
      try {
        recaptchaToken = await executeRecaptcha('APPLY_SERVICE');
      } catch (error) {
        console.warn('reCAPTCHA execution failed, proceeding without token:', error);
      }
    } else {
      console.warn('reCAPTCHA not ready, proceeding without token');
    }

    // Verify reCAPTCHA token with backend if we have one
    if (recaptchaToken) {
      try {
        const verifyResponse = await fetch('/api/verify-recaptcha', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: recaptchaToken,
            action: 'APPLY_SERVICE'
          }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
          toast.error('Security verification failed. Please try again.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Failed to verify reCAPTCHA, proceeding anyway:', error);
      }
    }

    try {
      // First upload documents if any
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
          } else {
            const errorData = await uploadResponse.json();
            toast.error(`Failed to upload ${file.name}: ${errorData.error}`);
            return; // Stop submission if upload fails
          }
        }
      }

      // Dynamic field documents are handled separately in dynamic_field_documents

      const applicationData = {
        scheme_id: service.id,
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
        amount: service.is_free ? 0 : (service.effective_price !== undefined ? service.effective_price : service.price),
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
        const successMessage = service.is_free
          ? 'Application submitted successfully!'
          : 'Application submitted successfully! Payment has been deducted from your wallet.';
        toast.success(successMessage);
        setShowPaymentModal(false);

        // If this was from a draft, delete the draft
        if (draftId) {
          try {
            await fetch(`/api/drafts?id=${draftId}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.error('Failed to delete draft:', error);
          }
        }

        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit application');
      }
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderServiceSpecificFields = () => {
    if (!service || !service.dynamic_fields || service.dynamic_fields.length === 0) return [];

    return service.dynamic_fields.map((field: any) => {
      const fieldName = `dynamic_${field.id}`;
      const fieldValue = formData.service_specific_data[fieldName] || '';

      switch (field.type) {
        case 'text':
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                required={field.required}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'textarea':
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                required={field.required}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'number':
        case 'email':
        case 'tel':
        case 'date':
          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={field.type}
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                required={field.required}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'select':
          // Add console logging for debugging dropdown issues

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
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                name={fieldName}
                value={fieldValue}
                onChange={handleInputChange}
                required={field.required}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {processedOptions.length > 0 ? (
                  processedOptions.map((option: string, index: number) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))
                ) : (
                  <option disabled>No options available</option>
                )}
              </select>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
              {processedOptions.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ This dropdown field has no options configured. Please contact support.
                </p>
              )}
            </div>
          );

        case 'file':
        case 'image':
        case 'pdf':
          const getAcceptTypes = () => {
            if (field.accept) return field.accept;
            switch (field.type) {
              case 'image': return '.jpg,.jpeg,.png,.gif';
              case 'pdf': return '.pdf';
              default: return '*/*';
            }
          };

          return (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                <span className="text-xs text-gray-500 ml-2">
                  ({field.type === 'image' ? 'Image' : field.type === 'pdf' ? 'PDF' : 'File'})
                </span>
              </label>
              <input
                type="file"
                name={fieldName}
                onChange={(e) => handleDynamicFileChange(e, field.id, field.type)}
                required={field.required}
                accept={getAcceptTypes()}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {uploadedFiles[field.id] && uploadedFiles[field.id].length > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <span>✅ File uploaded successfully!</span>
                    <a
                      href={uploadedFiles[field.id][0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View File
                    </a>
                  </div>
                </div>
              )}
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Accepted formats: {getAcceptTypes().replace(/\./g, '').toUpperCase()}
              </p>
            </div>
          );

        default:
          return null;
      }
    });
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load draft data when provided
  useEffect(() => {
    if (draftData && isOpen) {
      if (draftData.formData) {
        setFormData(draftData.formData);
      }
      if (draftData.uploadedFiles) {
        setUploadedFiles(draftData.uploadedFiles);
      }
      toast.success('Draft loaded! Continue where you left off');
    }
  }, [draftData, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      // Only reset if not loading from draft
      if (!draftData) {
        setFormData({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          customer_address: '',
          purpose: '',
          remarks: '',
          service_specific_data: {}
        });
        setDocuments([]);
        setUploadedFiles({});
      }
    }
  }, [isOpen, draftData]);

  if (!service) return null;
  if (!isOpen) return null;
  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="w-full h-full bg-white shadow-2xl overflow-hidden flex flex-col" style={{ zIndex: 100000, position: 'relative' }}>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 text-white p-6 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center border border-white border-opacity-30 shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                  {service.name}
                </h1>
                <p className="text-yellow-100 text-sm mt-1 font-medium">
                  {service.description || 'Apply for new service, update existing details, or submit required documents'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50" style={{ minHeight: 0 }}>
          <div className="p-6">

            {/* Application Form Title */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  {service.name} Application
                </h2>
                <p className="text-gray-600 mt-1">
                  Fill in all the required details and upload necessary documents
                </p>
              </div>
            </div>

            {/* Progress Bar - Sticky */}
            <div className="bg-white shadow-lg p-4 mb-6 border-b-2 border-purple-200 sticky top-0 z-50">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Application Progress</span>
                  <span className="text-sm font-bold text-purple-600">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 1
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    1
                  </div>
                  <span className="text-xs font-medium text-gray-600 mt-1">Service Details</span>
                </div>

                <div className="flex-1 h-1 bg-gray-200 mx-2">
                  <div
                    className={`h-full transition-all duration-500 ${currentStep >= 2
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gray-200'
                      }`}
                  ></div>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 2
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    2
                  </div>
                  <span className="text-xs font-medium text-gray-600 mt-1">Documents</span>
                </div>

                <div className="flex-1 h-1 bg-gray-200 mx-2">
                  <div
                    className={`h-full transition-all duration-500 ${currentStep >= 3
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gray-200'
                      }`}
                  ></div>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 3
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    3
                  </div>
                  <span className="text-xs font-medium text-gray-600 mt-1">Payment Summary</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 ? (
              // Step 1: Service Form Details
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

                {/* Service Type Selection */}
                <div className="bg-white rounded-lg shadow-md border border-red-200 hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6 border-l-4 border-red-500">
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      Service Type *
                    </label>
                    <select className="w-full p-3 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-yellow-50 text-red-700 font-medium">
                      <option value={service.name}>{service.name}</option>
                    </select>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-white rounded-lg shadow-md border border-yellow-300 hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6 border-b border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                      <span className="text-yellow-600">👤</span>
                      Personal Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="customer_name"
                          value={formData.customer_name}
                          onChange={handleInputChange}
                          placeholder="Enter full name as per documents"
                          required
                          className="w-full p-3 border border-red-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50 text-red-800 placeholder-red-400"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="customer_phone"
                          value={formData.customer_phone}
                          onChange={handleInputChange}
                          placeholder="Enter 10-digit mobile number (without 0)"
                          required
                          maxLength={10}
                          className={`w-full p-3 border rounded-md focus:ring-2 bg-yellow-50 text-red-800 placeholder-red-400 ${formData.customer_phone && formData.customer_phone.length !== 10
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-red-300 focus:ring-yellow-500 focus:border-yellow-500'
                            }`}
                        />
                        {formData.customer_phone && formData.customer_phone.length !== 10 && (
                          <p className="text-red-600 text-xs mt-1">
                            Phone number must be exactly 10 digits (currently {formData.customer_phone.length} digits)
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="customer_email"
                          value={formData.customer_email}
                          onChange={handleInputChange}
                          placeholder="Enter email address"
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <input
                          type="text"
                          name="customer_address"
                          value={formData.customer_address}
                          onChange={handleInputChange}
                          placeholder="Enter complete address"
                          required
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Additional Information
                    </h3>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Purpose */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purpose of Application
                      </label>
                      <textarea
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Explain why you need this service"
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      />
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Remarks
                      </label>
                      <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        placeholder="Any additional information or special requests"
                        rows={2}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Service-specific fields */}
                {service.dynamic_fields && service.dynamic_fields.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-red-600">⚙️</span>
                        Service-Specific Information
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderServiceSpecificFields()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1 Navigation Buttons */}
                <div className="flex gap-4 pt-6 border-t border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50 font-medium transition-all duration-200 hover:shadow-md"
                    disabled={loading || savingDraft}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || loading}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-lg"
                  >
                    {savingDraft ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving Draft...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        💾 Save Draft
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 transform"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Next: Upload Documents →
                    </span>
                  </button>
                </div>
              </form>
            ) : currentStep === 2 ? (
              // Step 2: Document Upload
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Upload Documents
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Please upload all required documents for your application
                    </p>
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Documents</h3>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors relative">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG, DOC, DOCX (Max 5MB each)
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                    </div>

                    {/* Required Documents Checklist */}
                    {service?.required_documents && service.required_documents.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Required Documents Checklist:</h4>
                        <div className="space-y-2">
                          {service.required_documents.map((doc: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center">
                                {documents.length > index && (
                                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm text-gray-600">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Files List */}
                    {documents.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files:</h4>
                        <div className="space-y-2">
                          {documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDocument(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-all duration-200 hover:shadow-md"
                  >
                    ← Back to Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 transform"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Next: Payment Summary →
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              // Step 3: Payment Summary
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Payment Summary
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Review your application details and payment information
                    </p>
                  </div>
                </div>

                {/* Application Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-blue-600">📋</span>
                      Application Summary
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Service Type</label>
                        <p className="text-lg font-semibold text-gray-900">{service.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Applicant Name</label>
                        <p className="text-lg font-semibold text-gray-900">{formData.customer_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="text-lg font-semibold text-gray-900">{formData.customer_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-lg font-semibold text-gray-900">{formData.customer_email || 'Not provided'}</p>
                      </div>
                    </div>
                    {formData.purpose && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Purpose</label>
                        <p className="text-gray-900">{formData.purpose}</p>
                      </div>
                    )}
                    {documents.length > 0 && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Documents Uploaded</label>
                        <div className="mt-2 space-y-1">
                          {documents.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-green-600">📄</span>
                              {file.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-red-600">💳</span>
                      Payment Summary
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Service Fee:</span>
                        <span className={`text-xl font-bold ${service.is_free ? 'text-green-600' : 'text-red-600'}`}>
                          {service.is_free ? 'FREE' : formatCurrency(service.price)}
                        </span>
                      </div>
                      {!service.is_free && (
                        <p className="text-xs text-gray-500 mt-2">
                          Amount will be deducted from your wallet upon submission. Full refund if rejected.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Summary Section */}
                {!service.is_free && service.price > 0 ? (() => {
                  const breakdown = calculateFeeBreakdown();
                  if (!breakdown) return (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <span className="text-red-600">💳</span>
                          Payment Summary
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Service Fee:</span>
                            <span className="text-xl font-bold text-red-600">
                              {formatCurrency(service.price)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Amount will be deducted from your wallet upon submission
                          </p>
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-blue-300 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">💳</span>
                          Payment Summary
                        </h3>
                        <p className="text-blue-100 text-sm mt-1">Review the charges for this service</p>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Fee Breakdown */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600 text-lg">💰</span>
                              <span className="text-gray-700 font-medium">Service Fee</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">₹{breakdown.base_amount.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 text-lg">📈</span>
                              <span className="text-gray-700 font-medium">GST ({breakdown.gst_percentage}%)</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">₹{breakdown.gst_amount.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-purple-600 text-lg">⚡</span>
                              <span className="text-gray-700 font-medium">Platform Fee</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">₹{breakdown.platform_fee.toFixed(2)}</span>
                          </div>

                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl shadow-md">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <span className="text-white text-xl">💎</span>
                                <span className="text-lg font-bold text-white">Total Amount</span>
                              </div>
                              <span className="text-2xl font-extrabold text-white">₹{breakdown.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Calculation Details */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800 font-medium mb-2 flex items-center">
                            <span className="mr-1">ℹ️</span>
                            Calculation:
                          </p>
                          <div className="text-xs text-blue-700 space-y-1">
                            <p>• Service Fee: ₹{breakdown.base_amount.toFixed(2)}</p>
                            <p>• GST ({breakdown.gst_percentage}%): ₹{breakdown.base_amount.toFixed(2)} × {breakdown.gst_percentage}% = ₹{breakdown.gst_amount.toFixed(2)}</p>
                            <p>• Platform Fee: ₹{breakdown.platform_fee.toFixed(2)} (Fixed)</p>
                            <p className="font-bold pt-1 border-t border-blue-300">
                              • Total: ₹{breakdown.base_amount.toFixed(2)} + ₹{breakdown.gst_amount.toFixed(2)} + ₹{breakdown.platform_fee.toFixed(2)} = ₹{breakdown.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Important Notice */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                          <div className="flex items-start space-x-3">
                            <span className="text-yellow-600 text-xl flex-shrink-0">⚠️</span>
                            <div>
                              <p className="text-sm text-yellow-900 font-bold mb-1">
                                Payment on Submission
                              </p>
                              <p className="text-xs text-yellow-800 leading-relaxed">
                                Amount will be deducted from your wallet when you submit the application. If your application is rejected, the full amount will be refunded automatically.
                              </p>
                              <p className="text-xs text-yellow-800 leading-relaxed">
                                The total amount of <strong>₹{breakdown.total_amount.toFixed(2)}</strong> will be immediately debited from your wallet upon submission. If your application is rejected, the full amount will be automatically refunded to your wallet.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-green-600">🎉</span>
                        Free Service
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Service Fee:</span>
                          <span className="text-xl font-bold text-green-600">FREE</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          No payment required for this service
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* reCAPTCHA Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔒</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        Security Verification
                      </h4>
                      <p className="text-xs text-blue-700">
                        This form is protected by reCAPTCHA Enterprise to prevent spam and abuse.
                        Your submission will be automatically verified when you click Submit.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Protected by reCAPTCHA. Google{' '}
                        <a
                          href="https://policies.google.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Privacy Policy
                        </a>
                        {' '}and{' '}
                        <a
                          href="https://policies.google.com/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Terms of Service
                        </a>
                        {' '}apply.
                      </p>
                    </div>
                    {isReady && (
                      <span className="text-green-500 text-sm">✓</span>
                    )}
                  </div>
                </div>

                {/* Step 3 Navigation Buttons */}
                <div className="flex gap-4 pt-6 border-t border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-all duration-200 hover:shadow-md"
                    disabled={loading}
                  >
                    ← Back to Documents
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50 font-medium transition-all duration-200 hover:shadow-md"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-2 px-6 py-3 bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 text-white rounded-md hover:from-red-700 hover:via-red-600 hover:to-yellow-600 font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:scale-105 transform"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render in portal to ensure it's above everything
  const portalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
  return portalRoot ? createPortal(modalContent, portalRoot) : modalContent;
}