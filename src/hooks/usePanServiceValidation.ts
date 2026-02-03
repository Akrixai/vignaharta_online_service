import { useState, useCallback } from 'react';
import { useGeolocation, testGeolocation, checkGeolocationPermissionStatus } from './useGeolocation';
import toast from 'react-hot-toast';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface UsePanServiceValidationOptions {
  minWalletBalance?: number;
  requireGeolocation?: boolean;
  bypassGeolocationInDev?: boolean;
}

interface UsePanServiceValidationReturn {
  validateBeforeStart: () => Promise<ValidationResult>;
  isValidating: boolean;
  geolocationError: string | null;
  clearGeolocationError: () => void;
  canBypassGeolocation: boolean;
}

// Check if we're in development and on HTTP
function isDevelopmentHttpEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '0.0.0.0';
  const isHttp = window.location.protocol === 'http:';
  const isDev = process.env.NODE_ENV === 'development';
  
  return isLocalhost && isHttp && isDev;
}

export function usePanServiceValidation(
  walletBalance: number,
  options: UsePanServiceValidationOptions = {}
): UsePanServiceValidationReturn {
  const {
    minWalletBalance = 100,
    requireGeolocation = true,
    bypassGeolocationInDev = true
  } = options;

  const [isValidating, setIsValidating] = useState(false);
  const {
    position,
    error: geoError,
    loading: geoLoading,
    isSupported: geoSupported,
    requestLocation,
    clearError: clearGeoError
  } = useGeolocation();

  const geolocationError = geoError?.message || null;
  const canBypassGeolocation = bypassGeolocationInDev && isDevelopmentHttpEnvironment();

  const clearGeolocationError = useCallback(() => {
    clearGeoError();
  }, [clearGeoError]);

  const validateBeforeStart = useCallback(async (): Promise<ValidationResult> => {
    setIsValidating(true);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Check wallet balance
      if (walletBalance < minWalletBalance) {
        errors.push(`Insufficient wallet balance. Minimum required: ₹${minWalletBalance}. Current balance: ₹${walletBalance.toFixed(2)}`);
      }

      // 2. Check geolocation if required
      if (requireGeolocation) {
        if (!geoSupported) {
          errors.push('Geolocation is not supported by your browser. Please use a modern browser with location services.');
        } else {
          // Check if we can bypass geolocation in development
          if (canBypassGeolocation) {
            warnings.push('⚠️ Development Mode: Geolocation validation bypassed for HTTP localhost');
            console.log('🔧 Development bypass: Skipping geolocation validation on HTTP localhost');
            toast.success('🔧 Development Mode: Geolocation bypassed', { duration: 2000 });
          } else {
            try {
              // First check permission status
              const permissionStatus = await checkGeolocationPermissionStatus();
              console.log('Permission status:', permissionStatus);

              if (permissionStatus === 'denied') {
                errors.push('Location access denied. Please enable location permissions in your browser settings and refresh the page.');
              } else {
                // Check if we already have a recent position
                let currentPosition = position;
                
                if (!currentPosition || (Date.now() - currentPosition.timestamp) > 300000) { // 5 minutes old
                  toast.loading('Getting your location...', { id: 'geolocation' });
                  
                  // Add a small delay to ensure the toast shows
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  // Use the improved test function
                  const testResult = await testGeolocation();
                  toast.dismiss('geolocation');
                  
                  if (testResult.success && testResult.position) {
                    currentPosition = {
                      latitude: testResult.position.coords.latitude,
                      longitude: testResult.position.coords.longitude,
                      accuracy: testResult.position.coords.accuracy,
                      timestamp: testResult.position.timestamp
                    };
                  } else if (testResult.error) {
                    throw testResult.error;
                  }
                }

                if (currentPosition) {
                  // Just log that location was obtained successfully (no data storage)
                  console.log('📍 Location validation passed');
                  toast.success('Location access confirmed!', { duration: 1500 });
                } else {
                  errors.push('Unable to get your current location. Please enable location services and try again.');
                }
              }
            } catch (geoErr: any) {
              toast.dismiss('geolocation');
              console.error('Geolocation error:', geoErr);
              
              // Handle different error object structures
              let errorCode = 1; // Default to permission denied
              let errorMessage = geoErr?.message || '';
              
              // Try to get error code from various sources
              if (typeof geoErr?.code === 'number') {
                errorCode = geoErr.code;
              } else if (typeof geoErr?.originalError?.code === 'number') {
                errorCode = geoErr.originalError.code;
              } else if (geoErr?.PERMISSION_DENIED === 1) {
                errorCode = 1;
              } else if (geoErr?.POSITION_UNAVAILABLE === 2) {
                errorCode = 2;
              } else if (geoErr?.TIMEOUT === 3) {
                errorCode = 3;
              } else {
                // Try to infer from message or string representation
                const errorStr = (errorMessage || geoErr?.toString() || '').toLowerCase();
                if (errorStr.includes('denied') || errorStr.includes('permission')) {
                  errorCode = 1;
                } else if (errorStr.includes('unavailable') || errorStr.includes('position')) {
                  errorCode = 2;
                } else if (errorStr.includes('timeout')) {
                  errorCode = 3;
                }
              }
              
              console.log('Determined error code:', errorCode, 'Error message:', errorMessage);
              
              // Check if this is an HTTP-related error
              const isHttpError = typeof window !== 'undefined' && 
                                window.location.protocol === 'http:' && 
                                (errorCode === 1 || errorMessage.includes('permissions policy'));
              
              if (isHttpError) {
                errors.push('🔒 Location access blocked on HTTP. Please access via HTTPS (https://localhost:3000) or use Chrome with --unsafely-treat-insecure-origin-as-secure flag.');
              } else if (errorCode === 1 || errorMessage.includes('denied') || errorMessage.includes('permission')) {
                errors.push('Location access denied. Please enable location permissions in your browser settings and refresh the page.');
              } else if (errorCode === 2 || errorMessage.includes('unavailable') || errorMessage.includes('position')) {
                errors.push('Location unavailable. Please check your GPS/network connection and try again.');
              } else if (errorCode === 3 || errorMessage.includes('timeout')) {
                errors.push('Location request timed out. Please try again.');
              } else {
                // Generic error for any other case
                errors.push('Failed to get your location. Please enable location services in your browser and try again.');
              }
            }
          }
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings
      };

      // Show validation errors as toast messages
      if (errors.length > 0) {
        errors.forEach((error, index) => {
          setTimeout(() => {
            toast.error(error, { 
              duration: 8000,
              id: `validation-error-${index}`
            });
          }, index * 100); // Stagger error messages
        });
      } else {
        if (warnings.length > 0) {
          toast.success('✅ Validation passed (with warnings)', { duration: 2000 });
        } else {
          toast.success('✅ All validations passed!', { duration: 2000 });
        }
      }

      return result;

    } catch (error) {
      console.error('Validation error:', error);
      const result: ValidationResult = {
        isValid: false,
        errors: ['An unexpected error occurred during validation. Please try again.'],
        warnings: []
      };
      
      toast.error(result.errors[0], { duration: 4000 });
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [walletBalance, minWalletBalance, requireGeolocation, geoSupported, position, requestLocation, canBypassGeolocation]);

  return {
    validateBeforeStart,
    isValidating: isValidating || geoLoading,
    geolocationError,
    clearGeolocationError,
    canBypassGeolocation
  };
}

// Utility function to format location for display
export function formatLocation(lat: number, lng: number, accuracy?: number): string {
  const latStr = lat.toFixed(6);
  const lngStr = lng.toFixed(6);
  const accStr = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
  return `${latStr}, ${lngStr}${accStr}`;
}

// Utility function to check if location is within India (rough bounds)
export function isLocationInIndia(lat: number, lng: number): boolean {
  // Rough bounding box for India
  const INDIA_BOUNDS = {
    north: 37.6,
    south: 6.4,
    east: 97.25,
    west: 68.7
  };

  return lat >= INDIA_BOUNDS.south && 
         lat <= INDIA_BOUNDS.north && 
         lng >= INDIA_BOUNDS.west && 
         lng <= INDIA_BOUNDS.east;
}