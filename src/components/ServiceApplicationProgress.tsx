'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface ProgressProps {
  currentStep: number;
  totalSteps: number;
  onSaveDraft: () => Promise<void>;
  isSaving: boolean;
}

export default function ServiceApplicationProgress({
  currentStep,
  totalSteps,
  onSaveDraft,
  isSaving
}: ProgressProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  const steps = [
    { number: 1, label: 'Customer Info' },
    { number: 2, label: 'Service Details' },
    { number: 3, label: 'Documents' },
    { number: 4, label: 'Review' },
    { number: 5, label: 'Submit' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-200">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Application Progress</span>
          <span className="text-sm font-bold text-purple-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step.number <= currentStep
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.number}
            </div>
            <span
              className={`text-xs mt-2 text-center ${
                step.number <= currentStep ? 'text-purple-600 font-medium' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-full mt-5 -mx-2 ${
                  step.number < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                }`}
                style={{ position: 'absolute', top: '20px', left: '50%', width: '100%', zIndex: -1 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Save Draft Button */}
      <div className="flex justify-center mt-6">
        <Button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          variant="outline"
          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500 mt-2">
        Your progress is automatically saved. You can continue later from the Draft Applications page.
      </p>
    </div>
  );
}
