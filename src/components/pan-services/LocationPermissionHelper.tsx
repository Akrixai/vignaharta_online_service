'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface LocationPermissionHelperProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export default function LocationPermissionHelper({
  onPermissionGranted,
  onPermissionDenied
}: LocationPermissionHelperProps) {
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isChecking, setIsChecking] = useState(false);

  const checkPermission = async () => {
    if (!navigator.permissions) {
      setPermissionState('unknown');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionState(permission.state);
      
      if (permission.state === 'granted') {
        onPermissionGranted?.();
      } else if (permission.state === 'denied') {
        onPermissionDenied?.();
      }

      // Listen for permission changes
      permission.onchange = () => {
        setPermissionState(permission.state);
        if (permission.state === 'granted') {
          onPermissionGranted?.();
        } else if (permission.state === 'denied') {
          onPermissionDenied?.();
        }
      };
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
      setPermissionState('unknown');
    }
  };

  const requestPermission = async () => {
    setIsChecking(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false
        });
      });
      
      console.log('Location obtained:', position.coords);
      setPermissionState('granted');
      onPermissionGranted?.();
    } catch (error: any) {
      console.error('Location request failed:', error);
      setPermissionState('denied');
      onPermissionDenied?.();
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  const getStatusIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'prompt':
        return <MapPin className="h-5 w-5 text-yellow-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (permissionState) {
      case 'granted':
        return 'Location access granted ✅';
      case 'denied':
        return 'Location access denied ❌';
      case 'prompt':
        return 'Location permission required';
      default:
        return 'Checking location permissions...';
    }
  };

  const getInstructions = () => {
    switch (permissionState) {
      case 'granted':
        return 'Great! Your location services are working properly.';
      case 'denied':
        return (
          <div className="space-y-2">
            <p>Location access was denied. To enable it:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click the location/lock icon in your browser's address bar</li>
              <li>Select "Allow" for location permissions</li>
              <li>Refresh the page and try again</li>
            </ol>
            <p className="text-xs text-gray-600 mt-2">
              Or go to your browser settings → Privacy & Security → Site Settings → Location
            </p>
          </div>
        );
      case 'prompt':
        return 'Click the button below to enable location access for this application.';
      default:
        return 'Checking your browser\'s location permission status...';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-2">{getStatusText()}</h4>
            <div className="text-sm text-gray-600 mb-3">
              {getInstructions()}
            </div>
            
            {(permissionState === 'prompt' || permissionState === 'denied') && (
              <Button
                onClick={requestPermission}
                disabled={isChecking}
                size="sm"
                className="w-full"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Requesting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Enable Location Access
                  </>
                )}
              </Button>
            )}

            {permissionState === 'granted' && (
              <Button
                onClick={checkPermission}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recheck Permission
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}