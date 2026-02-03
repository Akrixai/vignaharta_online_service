'use client';

import { useState } from 'react';
import { usePanServiceValidation } from '@/hooks/usePanServiceValidation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, MapPin, Wallet, CheckCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import LocationPermissionHelper from './LocationPermissionHelper';
import LocationDebugInfo from './LocationDebugInfo';

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
  const [showLocationHelper, setShowLocationHelper] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const {
    validateBeforeStart,
    isValidating,
    geolocationError,
    clearGeolocationError,
    canBypassGeolocation
  } = usePanServiceValidation(walletBalance, {
    minWalletBalance: 100,
    requireGeolocation: true,
    bypassGeolocationInDev: true
  });

  const handleValidateAndStart = async () => {
    setHasAttemptedValidation(true);
    clearGeolocationError();

    const result = await validateBeforeStart();

    if (result.isValid) {
      onValidationSuccess();
    } else {
      onValidationError?.(result.errors);
      // Show location helper if there's a geolocation error
      if (result.errors.some(error => error.toLowerCase().includes('location'))) {
        setShowLocationHelper(true);
      }
    }
  };

  const isWalletValid = walletBalance >= 100;
  const hasGeolocationError = !!geolocationError;
  const isHttpLocalhost = typeof window !== 'undefined' && 
                         window.location.protocol === 'http:' && 
                         (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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

              {/* Geolocation Requirement */}
              <div className="flex items-center gap-2">
                {canBypassGeolocation ? (
                  <Settings className="h-4 w-4 text-orange-500" />
                ) : !hasGeolocationError && !hasAttemptedValidation ? (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                ) : hasGeolocationError ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className={
                  canBypassGeolocation ? 'text-orange-700' :
                  hasGeolocationError ? 'text-red-700' : 
                  !hasAttemptedValidation ? 'text-yellow-700' : 'text-green-700'
                }>
                  Location services must be enabled
                  {canBypassGeolocation && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                      DEV BYPASS AVAILABLE
                    </span>
                  )}
                </span>
              </div>

              {/* Development Bypass Notice */}
              {canBypassGeolocation && (
                <div className="ml-6 p-3 bg-orange-50 border border-orange-200 rounded text-orange-700 text-xs">
                  <div className="flex items-start gap-2">
                    <Settings className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <strong>🔧 Development Mode:</strong> Geolocation validation can be bypassed on HTTP localhost for testing purposes.
                      <div className="mt-1 text-orange-600">
                        <strong>Note:</strong> In production, HTTPS is required for location access.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show geolocation error if any */}
              {hasGeolocationError && !canBypassGeolocation && (
                <div className="ml-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <strong>Location Error:</strong> {geolocationError}
                      <div className="mt-2 space-y-1">
                        <p className="font-medium">How to enable location:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          <li>Click the location icon (🔒) in your browser's address bar</li>
                          <li>Select "Allow" for location permissions</li>
                          <li>Refresh the page and try again</li>
                        </ul>
                        <button
                          onClick={() => setShowDebugInfo(!showDebugInfo)}
                          className="text-xs text-blue-600 underline mt-2"
                        >
                          {showDebugInfo ? 'Hide' : 'Show'} Debug Info
                        </button>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2 text-red-600 underline text-xs"
                        onClick={clearGeolocationError}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <LocationDebugInfo show={showDebugInfo} />

      {/* Enhanced HTTP Warning with Solutions */}
      {isHttpLocalhost && hasGeolocationError && !canBypassGeolocation && (
        <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800 text-sm mb-2 flex items-center gap-2">
                🔒 HTTPS Required for Location Access
                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">SECURITY RESTRICTION</span>
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                Your browser blocks location access on HTTP sites for security. Choose one of these solutions:
              </p>
              
              <div className="grid gap-3">
                {/* Option 1: HTTPS */}
                <div className="bg-white p-3 rounded border border-orange-200 hover:border-orange-300 transition-colors">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <strong className="text-green-800">✅ Recommended: Use HTTPS</strong>
                      <p className="text-sm text-gray-700 mt-1">
                        Access your app via: 
                        <button
                          onClick={() => window.open('https://localhost:3000', '_blank')}
                          className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                        >
                          https://localhost:3000
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        You may see a security warning - click "Advanced" → "Proceed to localhost"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Chrome Flag */}
                <div className="bg-white p-3 rounded border border-orange-200">
                  <div className="flex items-start gap-2">
                    <Settings className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <strong className="text-blue-800">🔧 Alternative: Chrome Flag</strong>
                      <p className="text-sm text-gray-700 mt-1">
                        Start Chrome with this flag:
                      </p>
                      <code className="block bg-gray-100 p-2 rounded text-xs mt-1 break-all">
                        --unsafely-treat-insecure-origin-as-secure=http://localhost:3000
                      </code>
                      <p className="text-xs text-gray-500 mt-1">
                        Close all Chrome windows first, then restart with this flag
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 3: Development Server HTTPS */}
                <div className="bg-white p-3 rounded border border-orange-200">
                  <div className="flex items-start gap-2">
                    <Settings className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <strong className="text-purple-800">⚙️ Setup HTTPS Dev Server</strong>
                      <p className="text-sm text-gray-700 mt-1">
                        Configure your Next.js dev server to use HTTPS
                      </p>
                      <code className="block bg-gray-100 p-2 rounded text-xs mt-1">
                        npm run dev -- --experimental-https
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Permission Helper */}
      {showLocationHelper && (
        <div className="mb-4">
          <LocationPermissionHelper
            onPermissionGranted={() => {
              setShowLocationHelper(false);
              clearGeolocationError();
            }}
            onPermissionDenied={() => {
              // Keep helper visible to show instructions
            }}
          />
        </div>
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
            <MapPin className="mr-2 h-4 w-4" />
            {buttonText}
            {canBypassGeolocation && (
              <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">
                DEV
              </span>
            )}
          </>
        )}
      </Button>

      {/* Help text */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          🔒 Your location is used for security and compliance purposes only.
        </p>
        {canBypassGeolocation ? (
          <p className="mt-1 text-orange-600">
            🔧 Development mode: Location validation can be bypassed for testing.
          </p>
        ) : (
          <p className="mt-1">
            💡 If location access fails, please enable location services in your browser settings.
          </p>
        )}
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
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        {isWalletValid ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        <span className={isWalletValid ? 'text-green-700' : 'text-red-700'}>
          Wallet: ₹{walletBalance.toFixed(2)}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <MapPin className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600">Location Required</span>
      </div>
    </div>
  );
}