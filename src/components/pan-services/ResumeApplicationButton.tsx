'use client';

import { useState } from 'react';
import { usePanServiceValidation } from '@/hooks/usePanServiceValidation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet } from 'lucide-react';

interface ResumeApplicationButtonProps {
  walletBalance: number;
  onValidationSuccess: () => void;
  onValidationError?: (errors: string[]) => void;
  disabled?: boolean;
  isResuming?: boolean;
  className?: string;
}

export default function ResumeApplicationButton({
  walletBalance,
  onValidationSuccess,
  onValidationError,
  disabled = false,
  isResuming = false,
  className = ''
}: ResumeApplicationButtonProps) {
  const {
    validateBeforeStart,
    isValidating
  } = usePanServiceValidation(walletBalance, {
    minWalletBalance: 100
  });

  const handleValidateAndResume = async () => {
    const result = await validateBeforeStart();

    if (result.isValid) {
      onValidationSuccess();
    } else {
      onValidationError?.(result.errors);
    }
  };

  const isButtonDisabled = disabled || isValidating || isResuming;

  return (
    <Button
      onClick={handleValidateAndResume}
      disabled={isButtonDisabled}
      variant="default"
      size="sm"
      className={`bg-yellow-600 hover:bg-yellow-700 text-white ${className}`}
    >
      {isValidating ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Validating...
        </>
      ) : isResuming ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Resuming...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Resume Now
        </>
      )}
    </Button>
  );
}