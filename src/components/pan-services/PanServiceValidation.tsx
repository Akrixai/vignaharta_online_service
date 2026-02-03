'use client';

import { useState } from 'react';
import { usePanServiceValidation } from '@/hooks/usePanServiceValidation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Wallet, CheckCircle, RefreshCw } from 'lucide-react';

interface PanServiceValidationProps {
  walletBalance: number;
  onValidationSuccess: () => void;
  onValidationError?: (errors: string[]) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  className?: string;
  showRequirements?: boolean;
}

export default function PanServiceValidation({
  walletBalance,
  onValidationSuccess,
  onValidationError,
  buttonText = 'Start Application',
  buttonVariant = 'default',
  disabled = false,
  className = '',
  showRequirements = true
}: PanServiceValidationProps) {
  const [hasAttemptedValidation, setHasAttemptedValidation] = useState(false);
  
  const {
    validateBeforeStart,
    isValidating
  } = usePanServiceValidation(walletBalance, {
    minWalletBalance: 100
  });

  const handleValidateAndStart = async () => {
    setHasAttemptedValidation(true);

    const result = await validateBeforeStart();

    if (result.isValid) {
      onValidationSuccess();
    } else {
      onValidationError?.(result.errors);
    }
  };

  const isWalletValid = walletBalance >= 100;

  return (
    <div className={`space-y-4 ${className}`}>
      {showRequirements && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Requirements Before Starting
            </h4>
            
            <div className="space-y-2 text-sm">
              {/* Wallet Balance Requirement */}
              <div className="flex items-center gap-2">
                {isWalletValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <Wallet className="h-4 w-4 text-gray-500" />
                <span className={isWalletValid ? 'text-green-700' : 'text-red-700'}>
                  Minimum wallet balance: ₹100 
                  <span className="ml-1 font-medium">
                    (Current: ₹{walletBalance.toFixed(2)})
                  </span>
                </span>
              </div>

              {/* Show insufficient balance message */}
              {!isWalletValid && hasAttemptedValidation && (
                <div className="ml-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <strong>Insufficient Balance:</strong> You need at least ₹100 in your wallet to start a PAN application.
                      <div className="mt-2">
                        <p className="font-medium">How to add money to your wallet:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs mt-1">
                          <li>Go to Dashboard → Wallet</li>
                          <li>Click "Add Money" button</li>
                          <li>Choose your preferred payment method</li>
                          <li>Complete the payment process</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleValidateAndStart}
        disabled={disabled || isValidating}
        variant={buttonVariant}
        className="w-full"
        size="lg"
      >
        {isValidating ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Help text */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          💰 Ensure you have sufficient wallet balance before starting your PAN application.
        </p>
        <p className="mt-1">
          💡 The amount will be deducted from your wallet only after successful application submission.
        </p>
      </div>
    </div>
  );
}

// Quick validation status component for inline use
export function ValidationStatus({ 
  walletBalance, 
  className = '' 
}: { 
  walletBalance: number; 
  className?: string; 
}) {
  const isWalletValid = walletBalance >= 100;
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        {isWalletValid ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        <Wallet className="h-4 w-4 text-gray-500" />
        <span className={isWalletValid ? 'text-green-700' : 'text-red-700'}>
          Wallet: ₹{walletBalance.toFixed(2)}
          {isWalletValid ? ' ✅' : ' (Min: ₹100)'}
        </span>
      </div>
    </div>
  );
}