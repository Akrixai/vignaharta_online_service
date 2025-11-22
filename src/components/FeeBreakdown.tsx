'use client';

import { useEffect, useState } from 'react';
import { calculateApplicationFees, formatCurrency, type FeeBreakdown as FeeBreakdownType } from '@/lib/fee-calculator';

interface FeeBreakdownProps {
  baseAmount: number;
  onCalculated?: (breakdown: FeeBreakdownType) => void;
  className?: string;
}

export default function FeeBreakdown({ baseAmount, onCalculated, className = '' }: FeeBreakdownProps) {
  const [breakdown, setBreakdown] = useState<FeeBreakdownType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeeBreakdown();
  }, [baseAmount]);

  const loadFeeBreakdown = async () => {
    try {
      setLoading(true);
      const calculated = await calculateApplicationFees(baseAmount);
      setBreakdown(calculated);
      
      if (onCalculated) {
        onCalculated(calculated);
      }
    } catch (error) {
      console.error('Error calculating fees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border-2 border-orange-200 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>💰</span>
        Fee Breakdown
      </h3>

      <div className="space-y-3">
        {/* Service Fee */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Service Fee</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(breakdown.base_amount)}
          </span>
        </div>

        {/* GST */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">
            GST ({breakdown.gst_percentage}%)
          </span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(breakdown.gst_amount)}
          </span>
        </div>

        {/* Platform Fee */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Platform Fee</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(breakdown.platform_fee)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-orange-300 my-2"></div>

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-orange-600">
            {formatCurrency(breakdown.total_amount)}
          </span>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-white rounded-md border border-orange-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Note:</span> All fees are inclusive of applicable taxes. 
          The platform fee helps us maintain and improve our services.
        </p>
      </div>
    </div>
  );
}

// Compact version for receipts
export function FeeBreakdownCompact({ breakdown }: { breakdown: FeeBreakdownType }) {
  return (
    <div className="text-sm space-y-1">
      <div className="flex justify-between">
        <span className="text-gray-600">Service Fee:</span>
        <span className="font-medium">{formatCurrency(breakdown.base_amount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">GST ({breakdown.gst_percentage}%):</span>
        <span className="font-medium">{formatCurrency(breakdown.gst_amount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Platform Fee:</span>
        <span className="font-medium">{formatCurrency(breakdown.platform_fee)}</span>
      </div>
      <div className="border-t pt-1 mt-1 flex justify-between font-bold">
        <span>Total:</span>
        <span className="text-orange-600">{formatCurrency(breakdown.total_amount)}</span>
      </div>
    </div>
  );
}
