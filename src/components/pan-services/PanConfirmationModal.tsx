'use client';

interface PanConfirmationData {
  service_type: 'NEW_PAN' | 'PAN_CORRECTION' | 'INCOMPLETE_PAN';
  order_id: string;
  mobile_number: string;
  mode: 'EKYC' | 'ESIGN';
  amount: number;
  inspay_url: string;
  inspay_txid?: string;
  created_at: string;
  payment_note?: string;
}

interface PanConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: PanConfirmationData | null;
  loading?: boolean;
}

const serviceTypeNames = {
  NEW_PAN: 'New PAN Application',
  PAN_CORRECTION: 'PAN Correction',
  INCOMPLETE_PAN: 'Incomplete PAN Resume'
};

const modeNames = {
  EKYC: 'EKYC (Instant PAN without signature)',
  ESIGN: 'ESIGN (PAN with signature & photo)'
};

export default function PanConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  data, 
  loading = false 
}: PanConfirmationModalProps) {

  if (!isOpen || !data) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🆔</div>
              <div>
                <h2 className="text-xl font-bold">Confirm PAN Application</h2>
                <p className="text-blue-100 text-sm">Please review your application details before proceeding</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Application Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Application Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Type</label>
                  <p className="text-gray-900 font-medium">{serviceTypeNames[data.service_type]}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Order ID</label>
                  <p className="text-blue-600 font-mono font-bold text-lg">{data.order_id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                  <p className="text-gray-900 font-medium">{data.mobile_number}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Application Mode</label>
                  <p className="text-gray-900 font-medium">{modeNames[data.mode]}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Amount</label>
                  <p className="text-green-600 font-bold text-lg">₹{data.amount}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Application Time</label>
                  <p className="text-gray-900 font-medium">
                    {new Date(data.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {data.inspay_txid && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-500">InsPay Transaction ID</label>
                  <p className="text-purple-600 font-mono font-medium">{data.inspay_txid}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              <span className="mr-2">💳</span>
              Payment Information
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">🔒</span>
                <span className="text-green-800"><strong>No upfront payment</strong> - Balance reserved but not deducted</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-green-800"><strong>Payment on success only</strong> - ₹{data.amount} will be charged after completion</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">❌</span>
                <span className="text-green-800"><strong>No charge on failure</strong> - Reserved amount will be released</span>
              </div>
            </div>

            {data.payment_note && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm font-medium">{data.payment_note}</p>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">🚀</span>
              What Happens Next?
            </h3>
            
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">1.</span>
                <span>You'll be redirected to the official NSDL portal</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">2.</span>
                <span>Complete your PAN application with required documents</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">3.</span>
                <span>Submit your application on the NSDL portal</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">4.</span>
                <span><strong>Payment will be automatically processed only if successful</strong></span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">5.</span>
                <span>Track your application status in PAN Services History</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
              <span className="mr-2">⚠️</span>
              Important Notes
            </h3>
            
            <div className="space-y-2 text-sm text-yellow-800">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600">•</span>
                <span><strong>Keep your Order ID safe:</strong> {data.order_id}</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600">•</span>
                <span><strong>Complete within 24 hours</strong> or the application will expire</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600">•</span>
                <span><strong>Have your documents ready:</strong> Aadhaar, photos, and other required documents</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600">•</span>
                <span><strong>Don't close the browser</strong> until you complete the application</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              ← Cancel
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center font-medium"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting...
                  </>
                ) : (
                  <>
                    🚀 Proceed to NSDL Portal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}