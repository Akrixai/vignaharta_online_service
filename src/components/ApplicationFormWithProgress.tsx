'use client';

import { useState, useEffect } from 'react';
import ApplicationProgressBar from './ApplicationProgressBar';
import { useApplicationDraft } from '@/hooks/useApplicationDraft';

interface ApplicationFormProps {
  schemeId: string;
  schemeName: string;
  onSubmit: (data: any) => Promise<void>;
}

const FORM_STEPS = [
  'Personal Info',
  'Documents',
  'Address',
  'Review',
  'Submit'
];

export default function ApplicationFormWithProgress({
  schemeId,
  schemeName,
  onSubmit
}: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const {
    draftData,
    updateDraft,
    saveDraft,
    clearDraft,
    isSaving,
    lastSaved,
    hasUnsavedChanges
  } = useApplicationDraft({
    schemeId,
    autoSaveInterval: 30000,
    enableLocalStorage: true
  });

  // Load draft data on mount
  useEffect(() => {
    if (Object.keys(draftData).length > 0) {
      setFormData(draftData);
      setCurrentStep(draftData.currentStep || 1);
    }
  }, [draftData]);

  const handleFieldChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateDraft(newData);
  };

  const handleNext = async () => {
    const progress = (currentStep / FORM_STEPS.length) * 100;
    await saveDraft(progress);
    setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await onSubmit(formData);
      clearDraft();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{schemeName}</h1>
        <p className="text-gray-600">Complete the form to submit your application</p>
      </div>

      {/* Progress Bar */}
      <ApplicationProgressBar
        currentStep={currentStep}
        totalSteps={FORM_STEPS.length}
        steps={FORM_STEPS}
        onStepClick={handleStepClick}
      />

      {/* Auto-save Indicator */}
      {lastSaved && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-4 py-2 rounded-full">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="text-green-600">✓</span>
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName || ''}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone *</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Upload Documents</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-600 mb-4">Drag and drop files here or click to browse</p>
              <input
                type="file"
                multiple
                onChange={(e) => handleFieldChange('documents', e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-red-700"
              >
                Choose Files
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Address */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Address Details</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
              <input
                type="text"
                required
                value={formData.address1 || ''}
                onChange={(e) => handleFieldChange('address1', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pincode *</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  value={formData.pincode || ''}
                  onChange={(e) => handleFieldChange('pincode', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Review Your Information</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{formData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone:</span>
                <span>{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">City:</span>
                <span>{formData.city}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Submit */}
        {currentStep === 5 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-4">Ready to Submit</h2>
            <p className="text-gray-600 mb-6">
              Please review all information before submitting your application
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        {currentStep < FORM_STEPS.length ? (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="mt-4 text-center text-sm text-yellow-600">
          ⚠️ You have unsaved changes. They will be auto-saved shortly.
        </div>
      )}
    </div>
  );
}
