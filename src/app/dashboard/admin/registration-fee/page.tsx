'use client';
import DashboardLayout from '@/components/dashboard/layout';
import { useEffect, useState } from 'react';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';

export default function RegistrationFeeAdminPage() {
  const [fee, setFee] = useState<number | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/registration-fees')
      .then(res => res.json())
      .then(data => {
        if (data.fee) {
          setFee(data.fee.amount);
          setCurrency(data.fee.currency || 'INR');
        }
      });
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/registration-fees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: fee, currency }),
    });
    setLoading(false);
    if (res.ok) {
      showToast.success('Registration fee updated');
    } else {
      showToast.error('Failed to update fee');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-red-200 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-center text-red-800">Registration Fee Management</h2>
          <div className="mb-6">
            <label className="block mb-2 text-red-700 font-medium">Fee Amount (INR)</label>
            <input type="number" value={fee ?? ''} onChange={e => setFee(Number(e.target.value))} className="w-full border px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-colors" min={0} />
          </div>
          <Button onClick={handleUpdate} disabled={loading || fee === null} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg">
            {loading ? 'Updating...' : 'Update Fee'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
} 