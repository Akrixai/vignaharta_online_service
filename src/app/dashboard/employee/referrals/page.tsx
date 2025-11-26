'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface Referral {
  id: string;
  referral_code: string;
  referrer_reward_amount: number;
  referred_reward_amount: number;
  referrer_reward_paid: boolean;
  referred_reward_paid: boolean;
  created_at: string;
  referred: {
    id: string;
    name: string;
    email: string;
    designation: string;
  };
}

export default function EmployeeReferralsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    totalPaid: 0,
    pendingPayout: 0
  });

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees/referrals');
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.data.referrals || []);
        setStats(data.data.stats || {
          totalReferrals: 0,
          totalEarned: 0,
          totalPaid: 0,
          pendingPayout: 0
        });
      } else {
        toast.error(data.error || 'Failed to fetch referrals');
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to fetch referrals');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (session?.user && (session.user as any).referral_code) {
      navigator.clipboard.writeText((session.user as any).referral_code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  if (!session) return null;

  const userReferralCode = (session.user as any).referral_code;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Referrals</h1>
          <p className="text-gray-600 mt-1">Track your employee referrals and rewards</p>
        </div>

        {/* Referral Code Card */}
        {userReferralCode && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">🎁 Your Referral Code</CardTitle>
              <CardDescription>Share this code when creating new employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-green-300">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Your Unique Code</p>
                  <p className="text-3xl font-bold text-green-600 tracking-wider">{userReferralCode}</p>
                </div>
                <Button
                  onClick={copyReferralCode}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📋 Copy Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-600">{stats.totalReferrals}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalEarned.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Paid Out</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">₹{stats.totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">₹{stats.pendingPayout.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>Employees you have referred</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading referrals...</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No referrals yet</p>
                <p className="text-sm">Share your referral code when creating new employees to start earning rewards!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Reward</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Their Reward</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{referral.referred.name}</div>
                          <div className="text-xs text-gray-500">{referral.referred.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {referral.referred.designation.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          ₹{referral.referrer_reward_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          ₹{referral.referred_reward_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {referral.referrer_reward_paid ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">ℹ️ How Referrals Work</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Share your unique referral code with colleagues</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>When creating a new employee, enter your referral code in the form</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Both you and the new employee receive rewards in your wallets automatically</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Track all your referrals and earnings on this page</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
