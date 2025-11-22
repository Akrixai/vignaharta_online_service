'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

interface CashbackApplication {
  id: string;
  scheme_id: string;
  customer_name: string;
  amount: number;
  cashback_percentage: number;
  cashback_amount: number;
  cashback_claimed: boolean;
  cashback_claimed_at: string | null;
  scratch_card_revealed: boolean;
  status: string;
  created_at: string;
  schemes: {
    name: string;
    cashback_enabled: boolean;
  };
}

export default function CustomerCashbackPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<CashbackApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [scratching, setScratching] = useState<string | null>(null);
  const [totalCashback, setTotalCashback] = useState(0);
  const [claimedCashback, setClaimedCashback] = useState(0);
  const [pendingCashback, setPendingCashback] = useState(0);

  useEffect(() => {
    fetchCashbackApplications();
  }, []);

  const fetchCashbackApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/cashback');
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.applications);
        setTotalCashback(data.stats.totalCashback);
        setClaimedCashback(data.stats.claimedCashback);
        setPendingCashback(data.stats.pendingCashback);
      } else {
        toast.error(data.error || 'Failed to fetch cashback data');
      }
    } catch (error) {
      console.error('Error fetching cashback:', error);
      toast.error('Failed to fetch cashback data');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealScratchCard = async (applicationId: string) => {
    try {
      setScratching(applicationId);
      const response = await fetch('/api/customer/cashback/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`🎉 You won ${data.cashbackPercentage}% cashback!`);
        fetchCashbackApplications();
      } else {
        toast.error(data.error || 'Failed to reveal scratch card');
      }
    } catch (error) {
      console.error('Error revealing scratch card:', error);
      toast.error('Failed to reveal scratch card');
    } finally {
      setScratching(null);
    }
  };

  const handleClaimCashback = async (applicationId: string) => {
    try {
      setClaiming(applicationId);
      const response = await fetch('/api/customer/cashback/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Cashback of ${formatCurrency(data.cashbackAmount)} claimed successfully!`);
        fetchCashbackApplications();
      } else {
        toast.error(data.error || 'Failed to claim cashback');
      }
    } catch (error) {
      console.error('Error claiming cashback:', error);
      toast.error('Failed to claim cashback');
    } finally {
      setClaiming(null);
    }
  };

  if (!session) return null;

  return (
    <DashboardLayout>
      <style jsx global>{`
        @keyframes scratch-reveal {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(1.2) rotate(5deg); }
          75% { transform: scale(1.1) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .scratch-card {
          position: relative;
          overflow: hidden;
        }
        .scratch-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .scratch-overlay:hover {
          transform: scale(1.05);
        }
        .scratch-overlay.scratching {
          animation: scratch-reveal 0.5s ease-out;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
          <h1 className="text-4xl font-bold mb-2">🎁 Cashback Earnings</h1>
          <p className="text-green-100 text-lg">Earn cashback on every service application!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardTitle className="text-sm font-medium text-green-700">💰 Total Cashback</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(totalCashback)}</div>
              <p className="text-sm text-gray-600">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardTitle className="text-sm font-medium text-blue-700">✅ Claimed</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(claimedCashback)}</div>
              <p className="text-sm text-gray-600">Added to wallet</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3 bg-gradient-to-br from-orange-50 to-amber-50">
              <CardTitle className="text-sm font-medium text-orange-700">⏳ Pending</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-orange-600">{formatCurrency(pendingCashback)}</div>
              <p className="text-sm text-gray-600">Ready to claim</p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">🎯 How Cashback Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">📝</div>
                <h3 className="font-bold text-gray-900 mb-1">1. Apply Service</h3>
                <p className="text-sm text-gray-600">Submit application for cashback-enabled service</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="font-bold text-gray-900 mb-1">2. Get Approved</h3>
                <p className="text-sm text-gray-600">Wait for application approval</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🎁</div>
                <h3 className="font-bold text-gray-900 mb-1">3. Scratch Card</h3>
                <p className="text-sm text-gray-600">Reveal your cashback percentage (1-3%)</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="font-bold text-gray-900 mb-1">4. Claim Reward</h3>
                <p className="text-sm text-gray-600">Add cashback to your wallet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cashback Applications */}
        <Card className="border-2 border-gray-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle>🎁 Your Cashback Applications</CardTitle>
            <CardDescription>Applications with cashback rewards</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading cashback data...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎁</div>
                <p className="text-xl text-gray-600 font-medium">No cashback applications yet</p>
                <p className="text-sm text-gray-500 mt-2">Apply for services to start earning cashback!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((app) => (
                  <Card 
                    key={app.id} 
                    className={`border-2 ${
                      app.cashback_claimed ? 'border-green-300 bg-green-50' :
                      app.scratch_card_revealed ? 'border-blue-300 bg-blue-50' :
                      'border-purple-300 bg-purple-50'
                    } shadow-lg hover:shadow-xl transition-all`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-900">{app.schemes.name}</CardTitle>
                      <CardDescription>
                        Applied: {new Date(app.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Amount */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Service Amount:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(app.amount)}</span>
                        </div>

                        {/* Scratch Card or Cashback Display */}
                        {!app.scratch_card_revealed && app.status === 'APPROVED' ? (
                          <div className="scratch-card relative h-32 rounded-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                              <div className="text-center text-white">
                                <div className="text-4xl mb-2">🎁</div>
                                <div className="text-lg font-bold">Your Cashback</div>
                                <div className="text-2xl font-bold">{app.cashback_percentage}%</div>
                                <div className="text-sm">{formatCurrency(app.cashback_amount)}</div>
                              </div>
                            </div>
                            <div 
                              className={`scratch-overlay ${scratching === app.id ? 'scratching' : ''}`}
                              onClick={() => handleRevealScratchCard(app.id)}
                            >
                              <div className="text-center text-white">
                                <div className="text-3xl mb-2">🎫</div>
                                <div className="text-lg font-bold">Scratch to Reveal!</div>
                                <div className="text-sm mt-1">Click to scratch</div>
                              </div>
                            </div>
                          </div>
                        ) : app.scratch_card_revealed ? (
                          <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 text-center border-2 border-green-300">
                            <div className="text-3xl mb-2">🎉</div>
                            <div className="text-sm text-gray-600">Cashback Earned</div>
                            <div className="text-2xl font-bold text-green-600">{app.cashback_percentage}%</div>
                            <div className="text-xl font-bold text-green-700 mt-1">
                              {formatCurrency(app.cashback_amount)}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 rounded-lg p-4 text-center">
                            <div className="text-2xl mb-2">⏳</div>
                            <div className="text-sm text-gray-600">Waiting for approval</div>
                          </div>
                        )}

                        {/* Claim Button */}
                        {app.scratch_card_revealed && !app.cashback_claimed && (
                          <Button
                            onClick={() => handleClaimCashback(app.id)}
                            disabled={claiming === app.id}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            {claiming === app.id ? 'Claiming...' : `💰 Claim ${formatCurrency(app.cashback_amount)}`}
                          </Button>
                        )}

                        {/* Claimed Status */}
                        {app.cashback_claimed && (
                          <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 text-center">
                            <div className="text-green-700 font-bold">✅ Claimed</div>
                            <div className="text-xs text-green-600 mt-1">
                              {new Date(app.cashback_claimed_at!).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
