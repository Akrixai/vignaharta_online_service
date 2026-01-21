import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';

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
  webhook_received_at?: string;
  callback_processed_at?: string;
  payment_charged_at?: string;
  refund_processed_at?: string;
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
  interval?: number;
  onStatusChange?: (service: PanService, oldStatus: string) => void;
  onSuccess?: (service: PanService) => void;
  onFailure?: (service: PanService) => void;
  onPaymentStatusChange?: (service: PanService, oldPaymentStatus: string) => void;
  onCallbackReceived?: (service: PanService) => void;
}

export function usePanServiceMonitor(options: UsePanServiceMonitorOptions = {}) {
  const {
    enabled = true,
    interval = 30000,
    onStatusChange,
    onSuccess,
    onFailure,
    onPaymentStatusChange,
    onCallbackReceived
  } = options;

  const { data: session } = useSession();
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
  const channelRef = useRef<any>(null);

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
          
          if (previousService) {
            // Check for status changes
            if (previousService.status !== service.status) {
              console.log(`🔄 Status change detected for ${service.order_id}: ${previousService.status} → ${service.status}`);
              
              onStatusChange?.(service, previousService.status);
              
              if (service.status === 'SUCCESS') {
                onSuccess?.(service);
              } else if (service.status === 'FAILURE') {
                onFailure?.(service);
              }
            }
            
            // Check for payment status changes
            if (previousService.payment_status !== service.payment_status) {
              console.log(`💳 Payment status change for ${service.order_id}: ${previousService.payment_status} → ${service.payment_status}`);
              onPaymentStatusChange?.(service, previousService.payment_status);
            }
            
            // Check for new callbacks
            if (previousService.callback_processed_at !== service.callback_processed_at && service.callback_processed_at) {
              console.log(`📞 New callback received for ${service.order_id}`);
              onCallbackReceived?.(service);
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
  }, [onStatusChange, onSuccess, onFailure, onPaymentStatusChange, onCallbackReceived]);

  // Set up monitoring
  useEffect(() => {
    if (!enabled || !session?.user?.id) return;

    console.log('🔄 Setting up PAN services monitoring...');
    setIsMonitoring(true);

    // Initial fetch
    fetchServices();

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Set up real-time subscription
    const channel = supabase
      .channel(`pan-services-${session.user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pan_services',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('📡 Real-time PAN service update received:', payload);
          
          // Fetch fresh data immediately
          setTimeout(() => {
            fetchServices();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    channelRef.current = channel;

    // Fallback polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchServices();
    }, interval);

    intervalRef.current = pollInterval;

    return () => {
      console.log('🛑 Cleaning up PAN services monitoring...');
      setIsMonitoring(false);
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, session?.user?.id, interval, fetchServices]);

  const refreshNow = useCallback(() => {
    console.log('� Manual refresh requested');
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    stats,
    isMonitoring,
    error,
    lastUpdate,
    refreshNow
  };
}