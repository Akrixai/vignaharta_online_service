'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BillDetailsCardProps {
  title: string;
  icon?: string;
  status?: string;
  provider?: string;
  customerName?: string;
  billNumber?: string;
  dueAmount?: string;
  currentBalance?: string;
  dueDate?: string;
  billDate?: string;
  billPeriod?: string;
  refId?: string;
  additionalInfo?: Array<{
    label: string;
    value: string;
    highlight?: boolean;
  }>;
  statusColor?: string;
  onAmountUpdate?: (amount: string) => void;
  quickAmounts?: Array<{
    amount: string;
    label: string;
  }>;
  children?: React.ReactNode;
}

export default function BillDetailsCard({
  title,
  icon = '📄',
  status,
  provider,
  customerName,
  billNumber,
  dueAmount,
  currentBalance,
  dueDate,
  billDate,
  billPeriod,
  refId,
  additionalInfo = [],
  statusColor,
  onAmountUpdate,
  quickAmounts,
  children
}: BillDetailsCardProps) {
  
  const getStatusColor = (status?: string) => {
    if (statusColor) return statusColor;
    
    switch (status?.toLowerCase()) {
      case 'low balance':
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
      case 'current':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === '1900-01-01' || dateStr === 'NA' || dateStr === 'N/A') return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount?: string) => {
    if (!amount || amount === 'N/A' || amount === '0') return 'N/A';
    return `₹${amount}`;
  };

  return (
    <div className="space-y-4">
      {/* Main Bill Information Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              {icon} {title}
            </CardTitle>
            {status && (
              <Badge className={`${getStatusColor(status)} border`}>
                {status}
              </Badge>
            )}
          </div>
          {provider && (
            <p className="text-sm text-green-600 font-medium">{provider}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {customerName && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer Name</label>
                  <p className="text-sm font-semibold text-gray-900">{customerName}</p>
                </div>
              )}
              
              {billNumber && billNumber !== 'NA' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bill Number</label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {billNumber}
                  </p>
                </div>
              )}

              {billPeriod && billPeriod !== 'NA' && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bill Period</label>
                  <p className="text-sm text-gray-900">{billPeriod}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {(currentBalance || dueAmount) && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {currentBalance ? 'Current Balance' : 'Due Amount'}
                  </label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(currentBalance || dueAmount)}
                  </p>
                </div>
              )}

              {dueDate && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</label>
                  <p className="text-sm text-gray-900">{formatDate(dueDate)}</p>
                </div>
              )}

              {refId && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reference ID</label>
                  <p className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {refId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {additionalInfo.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-green-200">
              {additionalInfo.map((info, index) => (
                <div key={index} className={info.highlight ? "md:col-span-2" : ""}>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {info.label}
                  </label>
                  <p className={`text-sm ${info.highlight ? 'font-semibold text-lg' : 'font-medium'} text-gray-900`}>
                    {info.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Custom content */}
          {children}

          {/* Bill dates */}
          {(billDate || dueDate) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-green-200">
              {billDate && (
                <div className="text-center">
                  <p className="text-xs text-gray-500">Bill Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(billDate)}</p>
                </div>
              )}
              {dueDate && (
                <div className="text-center">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(dueDate)}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Recharge Suggestions */}
      {quickAmounts && quickAmounts.length > 0 && onAmountUpdate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">💡 Quick Recharge Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickAmounts.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onAmountUpdate(option.amount)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
                >
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600">₹{option.amount}</p>
                  <p className="text-xs text-gray-500 group-hover:text-blue-500">{option.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}