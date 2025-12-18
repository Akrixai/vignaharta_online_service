'use client';

import { useState, useEffect } from 'react';

interface ROfferModel {
  id: string;
  amount: number;
  description: string;
  longDescription: string;
  validity: string;
  dataBenefit: string;
  voiceBenefit: string;
  type: string;
  category: string;
  operator: string;
  mobileNumber: string;
  originalPrice?: number;
  discount?: number;
  features: string[];
}

interface ROfferDetailModalProps {
  offer: ROfferModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
  operatorName?: string;
  operatorLogo?: string;
}

export default function ROfferDetailModal({ 
  offer, 
  isOpen, 
  onClose, 
  onSelect, 
  operatorName, 
  operatorLogo 
}: ROfferDetailModalProps) {
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

  if (!isOpen || !offer) return null;

  const handleSelect = () => {
    onSelect();
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
        <div className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
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
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎁</span>
              <h2 className="text-2xl font-bold">Special R-OFFER</h2>
            </div>
            <div className="flex items-center gap-3">
              {operatorLogo && (
                <img 
                  src={operatorLogo} 
                  alt={operatorName} 
                  className="w-8 h-8 rounded-full bg-white p-1"
                />
              )}
              <p className="text-white/90 text-sm">
                {operatorName || offer.operator} • {offer.mobileNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Savings Highlight */}
          {offer.discount && offer.discount > 0 && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="text-4xl">💰</div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600 mb-1">You Save</div>
                  <div className="text-3xl font-black text-green-700">₹{offer.discount}</div>
                  {offer.originalPrice && (
                    <div className="text-sm text-gray-600">
                      Original Price: <span className="line-through">₹{offer.originalPrice}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Amount and Validity */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-100 border-2 border-orange-300 rounded-2xl p-6 text-center">
              <div className="text-sm font-semibold text-gray-600 mb-2">R-OFFER Amount</div>
              <div className="text-4xl font-black text-orange-600">₹{offer.amount}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-2xl p-6 text-center">
              <div className="text-sm font-semibold text-gray-600 mb-2">Validity</div>
              <div className="text-2xl font-bold text-green-700 flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{offer.validity}</span>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🎯</span>
              <span>Offer Benefits</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offer.dataBenefit && offer.dataBenefit !== 'Check offer details' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📶</div>
                    <div>
                      <div className="text-sm font-semibold text-blue-600">Data Benefit</div>
                      <div className="text-lg font-bold text-blue-800">{offer.dataBenefit}</div>
                    </div>
                  </div>
                </div>
              )}

              {offer.voiceBenefit && offer.voiceBenefit !== 'Check offer details' && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📞</div>
                    <div>
                      <div className="text-sm font-semibold text-purple-600">Voice Benefit</div>
                      <div className="text-lg font-bold text-purple-800">{offer.voiceBenefit}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          {offer.features && offer.features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>⭐</span>
                <span>Additional Features</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {offer.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Offer Type Badge */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-300 text-red-800 px-4 py-2 rounded-full font-semibold">
              <span>🎁</span>
              <span>{offer.type}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📝</span>
              <span>Offer Details</span>
            </h3>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5">
              <p className="text-gray-700 leading-relaxed mb-4">
                {offer.description}
              </p>
              
              {offer.longDescription && offer.longDescription !== offer.description && (
                <div className="pt-4 border-t border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">Technical Details:</h4>
                  <p className="text-orange-700 leading-relaxed text-sm">
                    {offer.longDescription}
                  </p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-orange-200">
                <div className="flex items-start gap-2 text-sm text-orange-600">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>This is a special R-OFFER exclusively for your number. Terms and conditions apply.</span>
                </div>
              </div>
            </div>
          </div>
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Select This R-OFFER
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