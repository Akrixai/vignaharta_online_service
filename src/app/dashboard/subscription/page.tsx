'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { UserRole } from '@/types';
import SubscriptionStatusCard from '@/components/SubscriptionStatusCard';
import { Crown, Wallet, ArrowRight, CreditCard, History, CheckCircle, Clock, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { env } from '@/lib/env';

declare global { interface Window { Cashfree: any; } }

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: '1 Month', QUARTERLY: '3 Months', HALF_YEARLY: '6 Months', YEARLY: '12 Months',
};
const PERIOD_ICONS: Record<string, string> = {
  MONTHLY: '📅', QUARTERLY: '🗓️', HALF_YEARLY: '📆', YEARLY: '🏆',
};
const PERIOD_GRADIENTS: Record<string, string> = {
  MONTHLY: 'from-blue-500 to-blue-600',
  QUARTERLY: 'from-purple-500 to-purple-600',
  HALF_YEARLY: 'from-orange-500 to-orange-600',
  YEARLY: 'from-yellow-500 to-amber-600',
};

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [walletBalance, setWalletBalance] = useState(0);
  const [plans, setPlans] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      const [walletRes, plansRes, historyRes] = await Promise.all([
        fetch('/api/wallet').then(r => r.json()).catch(() => ({})),
        fetch('/api/subscriptions/plans').then(r => r.json()).catch(() => ({ plans: [] })),
        fetch('/api/subscriptions/history').then(r => r.json()).catch(() => ({ subscriptions: [] })),
      ]);
      if (walletRes.success) setWalletBalance(typeof walletRes.data.balance === 'string' ? parseFloat(walletRes.data.balance) : walletRes.data.balance);
      if (plansRes.success) setPlans(plansRes.plans || []);
      if (historyRes.success) setHistory(historyRes.subscriptions || []);
    } catch {}
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (session) fetchAll();
  }, [session, fetchAll, refreshKey]);

  // Show success toast if redirected from payment
  useEffect(() => {
    if (searchParams.get('subscription') === 'activated' || searchParams.get('from') === 'payment') {
      toast.success('🎉 Subscription activated successfully!');
    }
  }, [searchParams]);

  if (!session || (session.user.role !== UserRole.RETAILER && session.user.role !== UserRole.CUSTOMER)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        </div>
      </DashboardLayout>
    );
  }

  const loadCashfreeSDK = (): Promise<any> =>
    new Promise((resolve, reject) => {
      if (window.Cashfree) { resolve(window.Cashfree); return; }
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.async = true;
      s.onload = () => window.Cashfree ? resolve(window.Cashfree) : reject(new Error('SDK load failed'));
      s.onerror = () => reject(new Error('SDK load failed'));
      document.head.appendChild(s);
    });

  const handlePayWithGateway = async (plan: any) => {
    setPayingPlanId(plan.id);
    try {
      // Create order
      const res = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to create order');
        return;
      }

      const { payment_session_id, order_id, total_amount } = data.data;

      // Load Cashfree SDK
      const Cashfree = await loadCashfreeSDK();
      const mode = env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox';
      const cashfree = Cashfree({ mode });

      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: '_modal',
      }).then((result: any) => {
        if (result.error) {
          toast.error(result.error.message || 'Payment failed');
          window.location.href = `/payment/failed?order_id=${order_id}&amount=${total_amount}`;
        } else if (result.paymentDetails || result.redirect) {
          window.location.href = `/payment/success?order_id=${order_id}&amount=${total_amount}&type=subscription`;
        } else {
          window.location.href = `/payment/success?order_id=${order_id}&amount=${total_amount}&type=subscription`;
        }
      }).catch(() => {
        window.location.href = `/payment/failed?order_id=${order_id}&amount=${total_amount}`;
      });
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setPayingPlanId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusBadge = (status: string, endDate: string) => {
    const expired = new Date(endDate) < new Date();
    if (status === 'ACTIVE' && !expired) return { label: 'Active', cls: 'bg-green-100 text-green-700' };
    if (status === 'CANCELLED') return { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' };
    return { label: 'Expired', cls: 'bg-red-100 text-red-600' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400 rounded-2xl p-3 shadow-xl">
                <Crown className="w-8 h-8 text-yellow-900" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">My Subscription</h1>
                <p className="text-purple-200 mt-0.5">Manage plans & payment history</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5 border border-white/20">
              <Wallet className="w-4 h-4 text-green-300" />
              <span className="font-black text-white">₹{walletBalance.toFixed(2)}</span>
              <span className="text-white/60 text-xs">wallet</span>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        <SubscriptionStatusCard
          key={refreshKey}
          walletBalance={walletBalance}
          onSubscriptionChange={() => setRefreshKey(k => k + 1)}
        />

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'plans' ? 'bg-white shadow-md text-purple-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Buy Plan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'history' ? 'bg-white shadow-md text-purple-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" /> History
            {history.length > 0 && (
              <span className="bg-purple-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{history.length}</span>
            )}
          </button>
        </div>

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">Payment via Gateway includes 2% GST</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  The total charged includes 2% GST. Your subscription is activated instantly after successful payment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const baseAmount = parseFloat(plan.amount);
                const gst = Math.round(baseAmount * 2) / 100;
                const total = parseFloat((baseAmount + gst).toFixed(2));
                const gradient = PERIOD_GRADIENTS[plan.billing_period] || 'from-gray-500 to-gray-600';
                const isPaying = payingPlanId === plan.id;

                return (
                  <div key={plan.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                    {/* Plan header */}
                    <div className={`bg-gradient-to-r ${gradient} p-5 text-white`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl mb-1">{PERIOD_ICONS[plan.billing_period]}</div>
                          <h3 className="text-xl font-black">{plan.name}</h3>
                          <p className="text-white/80 text-sm">{PERIOD_LABELS[plan.billing_period]}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black">₹{baseAmount.toFixed(0)}</div>
                          <div className="text-white/70 text-xs">base price</div>
                        </div>
                      </div>
                    </div>

                    {/* Plan body */}
                    <div className="p-5">
                      {plan.description && (
                        <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                      )}

                      {/* Price breakdown */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Base amount</span>
                          <span className="font-semibold">₹{baseAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>GST (2%)</span>
                          <span>₹{gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black text-gray-900 border-t pt-1.5">
                          <span>Total payable</span>
                          <span>₹{total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Pay button */}
                      <button
                        onClick={() => handlePayWithGateway(plan)}
                        disabled={isPaying}
                        className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60`}
                      >
                        {isPaying ? (
                          <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Processing...</>
                        ) : (
                          <><Zap className="w-4 h-4 text-yellow-300" /> Pay ₹{total.toFixed(2)} via Gateway</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> How It Works
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: '1️⃣', title: 'Choose a Plan', desc: 'Select the plan that suits your needs' },
                  { icon: '2️⃣', title: 'Pay via Gateway', desc: 'Secure payment via Cashfree (UPI, Cards, Net Banking)' },
                  { icon: '3️⃣', title: 'Instant Activation', desc: 'Subscription activates immediately after payment' },
                  { icon: '4️⃣', title: 'Save on Services', desc: 'Subscriber prices applied automatically on eligible services' },
                ].map(s => (
                  <div key={s.title} className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{s.icon}</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                      <p className="text-gray-500 text-xs">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
                <p className="text-gray-500">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-700">No subscription history</h3>
                <p className="text-gray-400 mt-2 mb-6">Purchase your first subscription to get started</p>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  View Plans
                </button>
              </div>
            ) : (
              history.map((sub) => {
                const badge = getStatusBadge(sub.status, sub.end_date);
                const gradient = PERIOD_GRADIENTS[sub.plan?.billing_period] || 'from-gray-400 to-gray-500';
                return (
                  <div key={sub.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className={`bg-gradient-to-r ${gradient} h-1.5`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{PERIOD_ICONS[sub.plan?.billing_period] || '📋'}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-black text-gray-900">{sub.plan?.name || 'Subscription'}</h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-gray-500 text-xs">{PERIOD_LABELS[sub.plan?.billing_period] || ''}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-gray-900">₹{parseFloat(sub.amount_paid).toFixed(2)}</p>
                          <p className="text-gray-400 text-xs">paid</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span>Started: {formatDate(sub.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          <span>Expires: {formatDate(sub.end_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Browse Services CTA */}
        <Link href="/dashboard/services">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-5 text-white flex items-center justify-between hover:opacity-90 transition-all cursor-pointer shadow-lg">
            <div>
              <p className="font-black text-lg">Browse Services</p>
              <p className="text-purple-200 text-sm">See subscriber prices on eligible services</p>
            </div>
            <ArrowRight className="w-6 h-6 text-white/70" />
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}
