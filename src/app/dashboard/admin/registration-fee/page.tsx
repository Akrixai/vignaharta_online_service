'use client';
import DashboardLayout from '@/components/dashboard/layout';
import { useEffect, useState } from 'react';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';

export default function RegistrationFeeAdminPage() {
  const [fee, setFee] = useState<number | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [gstPercentage, setGstPercentage] = useState<number>(18);
  const [gstInclusive, setGstInclusive] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/registration-fees')
      .then(res => res.json())
      .then(data => {
        if (data.fee) {
          setFee(data.fee.amount);
          setCurrency(data.fee.currency || 'INR');
          setGstPercentage(data.fee.gst_percentage || 18);
          setGstInclusive(data.fee.gst_inclusive || false);
        }
      });
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/registration-fees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: fee, 
        currency, 
        gst_percentage: gstPercentage,
        gst_inclusive: gstInclusive 
      }),
    });
    setLoading(false);
    if (res.ok) {
      showToast.success('Registration fee and GST settings updated');
    } else {
      showToast.error('Failed to update settings');
    }
  };

  // Calculate total amount for preview
  const gstAmount = fee ? (fee * gstPercentage) / 100 : 0;
  const totalAmount = fee ? (gstInclusive ? fee : fee + gstAmount) : 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg border border-red-200 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-center text-red-800">Registration Fee & GST Management</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-red-700 font-medium">Base Fee Amount (INR)</label>
              <input 
                type="number" 
                value={fee ?? ''} 
                onChange={e => setFee(Number(e.target.value))} 
                className="w-full border px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors" 
                min={0} 
              />
            </div>

            <div>
              <label className="block mb-2 text-red-700 font-medium">GST Percentage (%)</label>
              <input 
                type="number" 
                value={gstPercentage} 
                onChange={e => setGstPercentage(Number(e.target.value))} 
                className="w-full border px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors" 
                min={0} 
                max={100}
                step={0.01}
              />
            </div>

            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="gst_inclusive"
                checked={gstInclusive} 
                onChange={e => setGstInclusive(e.target.checked)} 
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="gst_inclusive" className="text-red-700 font-medium">GST Inclusive (amount includes GST)</label>
            </div>

            {/* Preview */}
            {fee && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-800 mb-2">Fee Breakdown Preview:</h3>
                <div className="space-y-1 text-sm">
                  {gstInclusive ? (
                    <>
                      <div className="flex justify-between">
                        <span>Total Amount (GST Inclusive):</span>
                        <span className="font-semibold">₹{fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Base Amount:</span>
                        <span>₹{(fee / (1 + gstPercentage / 100)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>GST ({gstPercentage}%):</span>
                        <span>₹{(fee - (fee / (1 + gstPercentage / 100))).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Base Amount:</span>
                        <span>₹{fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST ({gstPercentage}%):</span>
                        <span>₹{gstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total Amount:</span>
                        <span>₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={handleUpdate} 
              disabled={loading || fee === null} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg"
            >
              {loading ? 'Updating...' : 'Update Fee & GST Settings'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 