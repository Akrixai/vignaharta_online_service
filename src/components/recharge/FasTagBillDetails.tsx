'use client';

import React from 'react';
import BillDetailsCard from './BillDetailsCard';

interface FasTagBillData {
  status: string;
  message: string;
  customer_name: string;
  bill_number: string;
  due_amount: string;
  due_date: string;
  bill_date: string;
  bill_period: string;
  ref_id: string;
  order_id: string;
  kwikapi_response?: {
    status?: string;
    provider?: string;
    message?: string;
    due_amount?: string;
    due_date?: string;
    customer_name?: string;
    bill_number?: string;
    bill_date?: string;
    bill_period?: string;
    ref_id?: string;
    service?: string;
    Additional?: {
      'Available Recharge Limit'?: string;
      vehicleClass?: string;
      vehicleClassDesc?: string;
      status?: string;
      'Available Balance'?: string;
      tagId?: string;
    };
  };
}

interface FasTagBillDetailsProps {
  billData: FasTagBillData;
  onAmountUpdate?: (amount: string) => void;
}

export default function FasTagBillDetails({ billData, onAmountUpdate }: FasTagBillDetailsProps) {
  console.log('🔍 [FasTagBillDetails] Received billData:', billData);
  
  const kwikApiData = billData.kwikapi_response || {};
  const Additional = kwikApiData.Additional;
  
  console.log('🔍 [FasTagBillDetails] KwikAPI data:', kwikApiData);
  console.log('🔍 [FasTagBillDetails] Additional data:', Additional);
  
  // Auto-update amount when component mounts
  React.useEffect(() => {
    if (onAmountUpdate && billData.due_amount) {
      onAmountUpdate(billData.due_amount);
    }
  }, [billData.due_amount, onAmountUpdate]);

  // Safe access to Additional properties with fallbacks
  const additionalInfo = [
    ...(Additional?.tagId ? [{
      label: 'Tag ID',
      value: Additional.tagId,
    }] : []),
    ...(Additional?.vehicleClass && Additional?.vehicleClassDesc ? [{
      label: 'Vehicle Type',
      value: `Class ${Additional.vehicleClass} - ${Additional.vehicleClassDesc}`,
    }] : []),
    ...(Additional?.['Available Recharge Limit'] ? [{
      label: 'Recharge Limit',
      value: `₹${Additional['Available Recharge Limit']}`,
    }] : []),
    {
      label: 'Service',
      value: kwikApiData.service || 'FASTag',
    }
  ];

  const quickAmounts = [
    { amount: billData.due_amount || '100', label: 'Recommended' },
    { amount: '500', label: 'Popular' },
    { amount: '1000', label: 'Standard' },
    { amount: '2000', label: 'Premium' }
  ];

  return (
    <div className="space-y-4">
      <BillDetailsCard
        title="FASTag Account Details"
        icon="🛣️"
        status={Additional?.status}
        provider={kwikApiData.provider}
        customerName={billData.customer_name}
        billNumber={billData.bill_number}
        currentBalance={Additional?.['Available Balance']}
        dueDate={billData.due_date}
        billDate={billData.bill_date}
        billPeriod={billData.bill_period}
        refId={billData.ref_id}
        additionalInfo={additionalInfo}
        onAmountUpdate={onAmountUpdate}
        quickAmounts={quickAmounts}
      >
        {/* Recommended Recharge Amount */}
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Recommended Recharge</h4>
              <p className="text-sm text-gray-600">Based on your current balance</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">₹{billData.due_amount || '100'}</p>
              <p className="text-xs text-gray-500">Minimum suggested</p>
            </div>
          </div>
        </div>
      </BillDetailsCard>

      {/* Balance Status Alert */}
      {Additional?.status === 'Low Balance' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <h4 className="font-medium text-red-800">Low Balance Alert</h4>
              <p className="text-sm text-red-700 mt-1">
                Your FASTag balance is running low (₹{Additional?.['Available Balance'] || '0'}). 
                We recommend recharging with at least ₹{billData.due_amount || '100'} to avoid any inconvenience during your travels.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}