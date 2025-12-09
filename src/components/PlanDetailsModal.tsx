'use client';

import { useState, useEffect } from 'react';

interface Plan {
  amount: number;
  validity: string;
  description: string;
  type: string;
  planName?: string;
  channels?: string;
  paidChannels?: string;
  hdChannels?: string;
  lastUpdate?: string;
}

interface PlanDetailsModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (plan: Plan) => void;
  serviceType: 'MOBILE' | 'DTH';
}

export default function PlanDetailsModal({ plan, isOpen, onClose, onSelect, serviceType }: PlanDetailsModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  const handleSelect = () => {
    onSelect(plan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header with Gradient */}
        <div className={`relative ${serviceType === 'MOBILE' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'} text-white p-6`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="pr-12">
            <h2 className="text-2xl font-bold mb-2">
              {serviceType === 'MOBILE' ? '📱 Mobile Recharge Plan' : '📺 DTH Recharge Plan'}
            </h2>
            {plan.planName && (
              <p className="text-white/90 text-sm">{plan.planName}</p>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Amount and Validity - Prominent Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`${serviceType === 'MOBILE' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300'} border-2 rounded-2xl p-6 text-center`}>
              <div className="text-sm font-semibold text-gray-600 mb-2">Recharge Amount</div>
              <div className={`text-4xl font-black ${serviceType === 'MOBILE' ? 'text-blue-600' : 'text-purple-600'}`}>
                ₹{plan.amount}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-2xl p-6 text-center">
              <div className="text-sm font-semibold text-gray-600 mb-2">Validity Period</div>
              <div className="text-2xl font-bold text-green-700 flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{plan.validity}</span>
              </div>
            </div>
          </div>

          {/* Plan Type Badge */}
          {plan.type && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 text-orange-800 px-4 py-2 rounded-full font-semibold">
                <span>🏷️</span>
                <span>{plan.type}</span>
              </div>
            </div>
          )}

          {/* DTH Channel Information */}
          {serviceType === 'DTH' && (plan.channels || plan.paidChannels || plan.hdChannels) && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📺</span>
                <span>Channel Information</span>
              </h3>
              
              <div className="space-y-4">
                {plan.channels && (
                  <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-200">
                    <div className="text-2xl">📡</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Total Channels</div>
                      <div className="text-lg font-bold text-gray-800">{plan.channels}</div>
                    </div>
                  </div>
                )}
                
                {plan.paidChannels && (
                  <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-200">
                    <div className="text-2xl">💳</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Paid Channels</div>
                      <div className="text-lg font-bold text-gray-800">{plan.paidChannels}</div>
                    </div>
                  </div>
                )}
                
                {plan.hdChannels && plan.hdChannels !== 'No HD Channels' && (
                  <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-blue-200">
                    <div className="text-2xl">🎬</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-600 mb-1">HD Channels</div>
                      <div className="text-lg font-bold text-blue-700">{plan.hdChannels}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📝</span>
              <span>Plan Details</span>
            </h3>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {plan.description}
              </p>
            </div>
          </div>

          {/* Last Update */}
          {plan.lastUpdate && (
            <div className="text-sm text-gray-500 text-center mb-4">
              <span>Last updated: {plan.lastUpdate}</span>
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
            >
              Close
            </button>
            <button
              onClick={handleSelect}
              className={`flex-1 px-6 py-3 ${serviceType === 'MOBILE' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'} text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              Select This Plan
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
