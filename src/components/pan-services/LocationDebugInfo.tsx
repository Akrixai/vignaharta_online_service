'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { testGeolocation, checkGeolocationPermissionStatus } from '@/hooks/useGeolocation';

interface LocationDebugInfoProps {
  show?: boolean;
}

export default function LocationDebugInfo({ show = false }: LocationDebugInfoProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkLocationStatus = async () => {
    setIsChecking(true);
    const info: any = {
      timestamp: new Date().toLocaleTimeString(),
      browserSupport: 'geolocation' in navigator,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      permissions: null,
      lastError: null
    };

    // Check permissions API
    try {
      const permissionState = await checkGeolocationPermissionStatus();
      info.permissions = {
        state: permissionState,
        name: 'geolocation'
      };
    } catch (error: any) {
      info.permissions = { error: error.message };
    }

    // Try to get location using improved test function
    if (navigator.geolocation) {
      const testResult = await testGeolocation();
      
      if (testResult.success && testResult.position) {
        info.location = {
          latitude: testResult.position.coords.latitude.toFixed(6),
          longitude: testResult.position.coords.longitude.toFixed(6),
          accuracy: Math.round(testResult.position.coords.accuracy),
          timestamp: new Date(testResult.position.timestamp).toLocaleTimeString()
        };
      } else if (testResult.error) {
        info.lastError = {
          code: testResult.error.code,
          message: testResult.error.message,
          name: testResult.error.name || 'GeolocationError',
          originalError: testResult.error.originalError
        };
      }
    }

    setDebugInfo(info);
    setIsChecking(false);
  };

  useEffect(() => {
    if (show) {
      checkLocationStatus();
    }
  }, [show]);

  if (!show) return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="pt-4">
        <div className="flex items-start gap-2 mb-3">
          <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800 text-sm">Location Debug Information</h4>
            <p className="text-xs text-yellow-700 mt-1">
              This information can help diagnose location access issues.
            </p>
          </div>
          <Button
            onClick={checkLocationStatus}
            disabled={isChecking}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {isChecking ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        <div className="space-y-2 text-xs font-mono bg-white p-3 rounded border">
          <div><strong>Browser Support:</strong> {debugInfo.browserSupport ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Secure Context:</strong> {debugInfo.isSecureContext ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Protocol:</strong> {debugInfo.protocol}</div>
          
          {debugInfo.permissions && (
            <div>
              <strong>Permission State:</strong> {
                debugInfo.permissions.error ? 
                  `❌ ${debugInfo.permissions.error}` : 
                  `${debugInfo.permissions.state === 'granted' ? '✅' : debugInfo.permissions.state === 'denied' ? '❌' : '⚠️'} ${debugInfo.permissions.state}`
              }
            </div>
          )}
          
          {debugInfo.location && (
            <div className="text-green-700">
              <strong>Location:</strong> ✅ {debugInfo.location.latitude}, {debugInfo.location.longitude} (±{debugInfo.location.accuracy}m)
              <br />
              <strong>Obtained:</strong> {debugInfo.location.timestamp}
            </div>
          )}
          
          {debugInfo.lastError && (
            <div className="text-red-700">
              <strong>Last Error:</strong> ❌ Code {debugInfo.lastError.code} - {debugInfo.lastError.message}
            </div>
          )}
          
          <div className="text-gray-500">
            <strong>Last Check:</strong> {debugInfo.timestamp}
          </div>
        </div>

        {debugInfo.lastError && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />
              <div>
                <strong>Troubleshooting Tips:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {debugInfo.protocol === 'http:' && (
                    <>
                      <li className="text-red-600 font-medium">⚠️ HTTP detected - Location requires HTTPS in production</li>
                      <li className="text-blue-600">
                        <strong>Quick Fix:</strong> Try{' '}
                        <button
                          onClick={() => window.open('https://localhost:3000', '_blank')}
                          className="underline hover:text-blue-800"
                        >
                          https://localhost:3000
                        </button>
                      </li>
                      <li>Or use Chrome with --unsafely-treat-insecure-origin-as-secure flag</li>
                      <li>Or configure Next.js dev server with --experimental-https</li>
                    </>
                  )}
                  {debugInfo.lastError.code === 1 && debugInfo.protocol !== 'http:' && (
                    <>
                      <li>Click the location/lock icon in the address bar</li>
                      <li>Select "Allow" for location permissions</li>
                      <li>Refresh the page after changing permissions</li>
                    </>
                  )}
                  {debugInfo.lastError.code === 2 && (
                    <>
                      <li>Check if GPS is enabled on your device</li>
                      <li>Try moving to a location with better signal</li>
                      <li>Check your internet connection</li>
                    </>
                  )}
                  {debugInfo.lastError.code === 3 && (
                    <>
                      <li>Try again - the request may have timed out</li>
                      <li>Check your internet connection speed</li>
                    </>
                  )}
                  {!debugInfo.isSecureContext && (
                    <li className="text-red-600 font-medium">🔒 Location requires HTTPS - try accessing via https://</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}