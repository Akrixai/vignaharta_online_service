import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface PanService {
  id: string;
  order_id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'PROCESSING' | 'EXPIRED';
  payment_status: 'PENDING' | 'RESERVED' | 'DEBITED' | 'CHARGED' | 'REFUNDED' | 'CANCELLED';
  acknowledgement_number?: string;
  callback_data?: any;
  webhook_received_at?: string;
  updated_at: string;
  service_type: string;
  amount: number;
}

interface MonitoringStats {
  total: number;
  pending: number;
  processing: number;
  success: number;
  failure: number;
  active_monitoring: number;
  total_spent: number;
}

interface UsePanServiceMonitorOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  onStatusChange?: (service: PanService, oldStatus: string) => void;
  onSuccess?: (service: PanService) => void;
  onFailure?: (service: PanService) => void;
}

export function usePanServiceMonitor(options: UsePanServiceMonitorOptions = {}) {
  const {
    enabled = true,
    interval = 15000, // 15 seconds
    onStatusChange,
    onSuccess,
    onFailure
  } = options;

  const [services, setServices] = useState<PanService[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    total: 0,
    pending: 0,
    processing: 0,
    success: 0,
    failure: 0,
    active_monitoring: 0,
    total_spent: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousServicesRef = useRef<Map<string, PanService>>(new Map());

  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);
      
      const url = new URL('/api/pan-services/monitor', window.location.origin);
      if (lastUpdate) {
        url.searchParams.set('last_update', lastUpdate);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const newServices = data.data.active_services || [];
        const newStats = data.data.stats || stats;
        
        // Check for status changes
        if (onStatusChange || onSuccess || onFailure) {
          newServices.forEach((service: PanService) => {
            const previousService = previousServicesRef.current.get(service.order_id);
            
            if (previousService && previousService.status !== service.status) {
              // Status changed
              onStatusChange?.(service, previousService.status);
              
              if (service.status === 'SUCCESS') {
                onSuccess?.(service);
                toast.success(`PAN application ${service.order_id} completed successfully!`, {
                  duration: 5000,
                  icon: '✅'
                });
              } else if (service.status === 'FAILURE') {
                onFailure?.(service);
                toast.error(`PAN application ${service.order_id} failed.`, {
                  duration: 5000,
                  icon: '❌'
                });
              } else if (service.status === 'PROCESSING' && previousService.status === 'PENDING') {
                toast(`PAN application ${service.order_id} is now being processed.`, {
                  duration: 3000,
                  icon: '⏳'
                });
              }
            }
            
            // Update acknowledgement number notification
            if (service.acknowledgement_number && 
                service.acknowledgement_number !== 'Order is under process' &&
                (!previousService || previousService.acknowledgement_number !== service.acknowledgement_number)) {
              toast.success(`Tracking number received: ${service.acknowledgement_number}`, {
                duration: 4000,
                icon: '🎯'
              });
            }
          });
        }

        // Update previous services map
        const newServicesMap = new Map();
        newServices.forEach((service: PanService) => {
          newServicesMap.set(service.order_id, service);
        });
        previousServicesRef.current = newServicesMap;

        setServices(newServices);
        setStats(newStats);
        setLastUpdate(data.data.last_check);
        setIsMonitoring(newServices.length > 0);
      } else {
        throw new Error(data.message || 'Failed to fetch monitoring data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Monitoring error:', err);
      
      // Don't show toast for every error to avoid spam
      if (!error) {
        toast.error('Failed to check for updates', { duration: 2000 });
      }
    }
  }, [lastUpdate, onStatusChange, onSuccess, onFailure, error, stats]);

  const startMonitoring = useCallback(() => {
    if (!enabled) return;

    // Initial fetch
    fetchMonitoringData();

    // Set up interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(fetchMonitoringData, interval);
  }, [enabled, fetchMonitoringData, interval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const refreshNow = useCallback(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  const monitorSpecificOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/pan-services/monitor?order_id=${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error monitoring specific order:', err);
      throw err;
    }
  }, []);

  // Start/stop monitoring based on enabled flag
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [enabled, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    services,
    stats,
    isMonitoring,
    error,
    lastUpdate,
    refreshNow,
    startMonitoring,
    stopMonitoring,
    monitorSpecificOrder
  };
}