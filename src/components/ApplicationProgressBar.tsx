'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  onStepClick?: (step: number) => void;
}

export default function ApplicationProgressBar({ 
  currentStep, 
  totalSteps, 
  steps,
  onStepClick 
}: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress((currentStep / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  return (
    <div className="w-full mb-8">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="absolute -top-1 transition-all duration-500" style={{ left: `${progress}%` }}>
          <div className="relative -ml-3">
            <div className="w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-start">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div
              key={index}
              className={`flex flex-col items-center flex-1 ${
                onStepClick && !isUpcoming ? 'cursor-pointer' : ''
              }`}
              onClick={() => onStepClick && !isUpcoming && onStepClick(stepNumber)}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2
                  transition-all duration-300
                  ${isCompleted ? 'bg-green-500 text-white scale-110' : ''}
                  ${isCurrent ? 'bg-red-600 text-white scale-125 shadow-lg' : ''}
                  ${isUpcoming ? 'bg-gray-200 text-gray-400' : ''}
                `}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <div
                className={`
                  text-xs text-center font-medium
                  ${isCurrent ? 'text-red-600 font-bold' : ''}
                  ${isCompleted ? 'text-green-600' : ''}
                  ${isUpcoming ? 'text-gray-400' : ''}
                `}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Text */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps} • {Math.round(progress)}% Complete
        </div>
        {currentStep < totalSteps && (
          <div className="text-xs text-gray-500 mt-1">
            {totalSteps - currentStep} step{totalSteps - currentStep !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>
    </div>
  );
}
