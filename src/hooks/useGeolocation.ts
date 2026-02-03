import { useState, useEffect, useCallback } from 'react';

interface CustomGeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationReturn {
  position: CustomGeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  isSupported: boolean;
  requestLocation: () => Promise<CustomGeolocationPosition>;
  clearError: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000 // 5 minutes
  } = options;

  const [position, setPosition] = useState<CustomGeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestLocation = useCallback((): Promise<CustomGeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        const error = {
          code: 0,
          message: 'Geolocation is not supported by this browser'
        };
        setError(error);
        reject(error);
        return;
      }

      setLoading(true);
      setError(null);

      const successCallback = (pos: GeolocationPosition) => {
        const position: CustomGeolocationPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        };
        
        setPosition(position);
        setLoading(false);
        resolve(position);
      };

      const errorCallback = (err: GeolocationPositionError) => {
        console.error('Geolocation API error:', err);
        console.log('Error object keys:', Object.keys(err));
        console.log('Error object values:', Object.values(err));
        console.log('Error prototype:', Object.getPrototypeOf(err));
        
        let message = 'Unknown geolocation error';
        let code = err.code || 0;
        
        // Handle different error scenarios
        if (code === 1 || code === GeolocationPositionError.PERMISSION_DENIED) {
          message = 'Location access denied by user. Please enable location permissions and try again.';
        } else if (code === 2 || code === GeolocationPositionError.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable. Please check your GPS/network connection.';
        } else if (code === 3 || code === GeolocationPositionError.TIMEOUT) {
          message = 'Location request timed out. Please try again.';
        } else if (err.message) {
          message = err.message;
          // Try to infer code from message
          if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('permission')) {
            code = 1;
          } else if (message.toLowerCase().includes('unavailable') || message.toLowerCase().includes('position')) {
            code = 2;
          } else if (message.toLowerCase().includes('timeout')) {
            code = 3;
          }
        } else {
          // Fallback for browsers that don't provide standard error codes
          message = 'Failed to get location. Please enable location services and try again.';
          code = 1; // Assume permission denied as most common case
        }

        const error = {
          code,
          message,
          originalError: err
        };
        
        console.log('Processed geolocation error:', error);
        setError(error);
        setLoading(false);
        reject(error);
      };

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }, [isSupported, enableHighAccuracy, timeout, maximumAge]);

  // Auto-request location on mount if supported
  useEffect(() => {
    if (isSupported && !position && !error) {
      requestLocation().catch(() => {
        // Error is already handled in the callback
      });
    }
  }, [isSupported, position, error, requestLocation]);

  return {
    position,
    error,
    loading,
    isSupported,
    requestLocation,
    clearError
  };
}

// Utility function to check geolocation permission without triggering a request
export async function checkGeolocationPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  if (!navigator.permissions) {
    return 'unknown';
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.error('Error checking geolocation permission:', error);
    return 'unknown';
  }
}

// Utility function to test geolocation with better error handling
export async function testGeolocation(): Promise<{ success: boolean; error?: any; position?: GeolocationPosition }> {
  if (!navigator.geolocation) {
    return { success: false, error: { code: 0, message: 'Geolocation not supported' } };
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: { code: 3, message: 'Request timed out' } });
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        resolve({ success: true, position });
      },
      (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error });
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000
      }
    );
  });
}