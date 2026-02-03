import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface UsePanServiceValidationOptions {
  minWalletBalance?: number;
}

interface UsePanServiceValidationReturn {
  validateBeforeStart: () => Promise<ValidationResult>;
  isValidating: boolean;
}

export function usePanServiceValidation(
  walletBalance: number,
  options: UsePanServiceValidationOptions = {}
): UsePanServiceValidationReturn {
  const {
    minWalletBalance = 100
  } = options;

  const [isValidating, setIsValidating] = useState(false);

  const validateBeforeStart = useCallback(async (): Promise<ValidationResult> => {
    setIsValidating(true);
    const errors: string[] = [];

    try {
      // Check wallet balance
      if (walletBalance < minWalletBalance) {
        errors.push(`Insufficient wallet balance. Minimum required: ₹${minWalletBalance}. Current balance: ₹${walletBalance.toFixed(2)}`);
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors
      };

      // Show validation messages
      if (errors.length > 0) {
        errors.forEach((error, index) => {
          setTimeout(() => {
            toast.error(error, { 
              duration: 6000,
              id: `validation-error-${index}`
            });
          }, index * 100);
        });
      } else {
        toast.success('✅ Wallet validation passed!', { duration: 2000 });
      }

      return result;

    } catch (error) {
      console.error('Validation error:', error);
      const result: ValidationResult = {
        isValid: false,
        errors: ['An unexpected error occurred during validation. Please try again.']
      };
      
      toast.error(result.errors[0], { duration: 4000 });
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [walletBalance, minWalletBalance]);

  return {
    validateBeforeStart,
    isValidating
  };
}

// Utility function to format currency for display
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}