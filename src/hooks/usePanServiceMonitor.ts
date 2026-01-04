import { useState, useEffect, useCallback, useRef } from 'react';

interface PanService {
  id: string;
  service_type: 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN';
  mobile_number: string;
  mode: 'EKYC' | 'ESIGN';
  order_id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'PROCESSING' | 'EXPIRED';
  payment_status: 'PENDING' | 'RESERVED' | 'DEBITED' | 'CHARGED' | 'REFUNDED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  acknowledgement_number?: string;
  inspay_txid?: string;
  inspay_opid?: string;
}

interface MonitoringStats {
  total: number;
  pending: number;
  processing: number;
  success: number;
  failure: number;
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
    interval = 30000, // 30 seconds default
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
    total_spent: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousServicesRef = useRef<Map<string, PanService>>(new Map());

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/pan-services/history');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const newServices = data.data || [];
        const previousServices = previousServicesRef.current;
        
        // Check for status changes
        newServices.forEach((service: PanService) => {
          const previousService = previousServices.get(service.id);
          
          if (previousService && previousService.status !== service.status) {
            console.log(`🔄 Status change detected for ${service.order_id}: ${previousService.status} → ${service.status}`);
            
            // Call status change callback
            onStatusChange?.(service, previousService.status);
            
            // Call specific callbacks
            if (service.status === 'SUCCESS') {
              onSuccess?.(service);
            } else if (service.status === 'FAILURE') {
              onFailure?.(service);
            }
          }
        });

        // Update services and previous services map
        setServices(newServices);
        previousServicesRef.current = new Map(
          newServices.map((service: PanService) => [service.id, service])
        );

        // Calculate stats
        const newStats: MonitoringStats = {
          total: newServices.length,
          pending: newServices.filter((s: PanService) => s.status === 'PENDING').length,
          processing: newServices.filter((s: PanService) => s.status === 'PROCESSING').length,
          success: newServices.filter((s: PanService) => s.status === 'SUCCESS').length,
          failure: newServices.filter((s: PanService) => s.status === 'FAILURE').length,
          total_spent: newServices
            .filter((s: PanService) => s.status === 'SUCCESS')
            .reduce((sum: number, s: PanService) => sum + s.amount, 0)
        };
        
        setStats(newStats);
        setLastUpdate(new Date());
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching PAN services:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [onStatusChange, onSuccess, onFailure]);

  const startMonitoring = useCallback(() => {
    if (!enabled) return;
    
    console.log('🚀 Starting PAN service monitoring...');
    setIsMonitoring(true);
    
    // Initial fetch
    fetchServices();
    
    // Set up interval
    intervalRef.current = setInterval(fetchServices, interval);
  }, [enabled, fetchServices, interval]);

  const stopMonitoring = useCallback(() => {
    console.log('⏹️ Stopping PAN service monitoring...');
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshNow = useCallback(() => {
    console.log('🔄 Manual refresh triggered...');
    fetchServices();
  }, [fetchServices]);

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
    stopMonitoring
  };
}