'use client';

import { useState, useEffect } from 'react';
import { Crown, Zap, Shield, TrendingDown, ArrowRight, Sparkles, CheckCircle, Clock, Star } from 'lucide-react';
import SubscriptionModal from './SubscriptionModal';
import Link from 'next/link';

const PLAN_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  MONTHLY:     { from: '#3b82f6', to: '#6366f1', accent: '#93c5fd' },
  QUARTERLY:   { from: '#8b5cf6', to: '#a855f7', accent: '#c4b5fd' },
  HALF_YEARLY: { from: '#f97316', to: '#ef4444', accent: '#fdba74' },
  YEARLY:      { from: '#eab308', to: '#f97316', accent: '#fde68a' },
};

const BENEFITS = [
  { icon: '🏷️', label: 'Discounted Prices', desc: 'Save on every service' },
  { icon: '⚡', label: 'Instant Activation', desc: 'Active immediately' },
  { icon: '💳', label: 'Wallet Payment', desc: 'No extra charges' },
  { icon: '✨', label: 'All Services', desc: 'Full access' },
];

export default function DashboardSubscriptionBanner() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans]               = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => {
    let mounted = true;
    
    Promise.all([
      fetch('/api/subscriptions/my-subscription').then(r => r.json()).catch(() => ({ success: false })),
      fetch('/api/subscriptions/plans').then(r => r.json()).catch(() => ({ success: false, plans: [] })),
      fetch('/api/wallet').then(r => r.json()).catch(() => ({ success: false, data: { balance: 0 } })),
    ]).then(([subData, plansData, walletData]) => {
      if (!mounted) return;
      if (subData.success)    setSubscription(subData.subscription);
      if (plansData.success)  setPlans(plansData.plans || []);
      if (walletData.success) setWalletBalance(
        typeof walletData.data.balance === 'string'
          ? parseFloat(walletData.data.balance)
          : walletData.data.balance
      );
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  const handleSubscribed = () => {
    setShowModal(false);
    fetch('/api/subscriptions/my-subscription').then(r => r.json()).then(d => {
      if (d.success) setSubscription(d.subscription);
    }).catch(() => {});
    fetch('/api/wallet').then(r => r.json()).then(d => {
      if (d.success) setWalletBalance(typeof d.data.balance === 'string' ? parseFloat(d.data.balance) : d.data.balance);
    }).catch(() => {});
  };

  const getDaysRemaining = (end: string) =>
    Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="rounded-3xl bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 p-6 animate-pulse">
        <div className="h-6 bg-purple-200 rounded-xl w-1/3 mb-3" />
        <div className="h-4 bg-purple-100 rounded-xl w-2/3" />
      </div>
    );
  }

  /* ─── ACTIVE SUBSCRIPTION VIEW ─────────────────────────────────────────── */
  if (subscription) {
    const days   = getDaysRemaining(subscription.end_date);
    const plan   = subscription.plan;
    const colors = PLAN_COLORS[plan?.billing_period] || PLAN_COLORS.MONTHLY;
    const isUrgent = days <= 7;
    const isWarn   = days <= 30;

    return (
      <>
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
               style={{ background: colors.accent }} />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-15"
               style={{ background: colors.accent }} />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 shadow-lg flex-shrink-0">
                  <Crown className="w-7 h-7 text-yellow-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Active Subscription</span>
                    <span className="bg-green-400 text-green-900 text-[10px] font-black px-2 py-0.5 rounded-full">✓ LIVE</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">{plan?.name}</h2>
                  <p className="text-white/70 text-sm mt-0.5">Subscriber prices active on all eligible services</p>
                </div>
              </div>

              <div className={`flex-shrink-0 rounded-2xl px-5 py-3 text-center ${
                isUrgent ? 'bg-red-500/30 border border-red-400/50' :
                isWarn   ? 'bg-orange-400/20 border border-orange-300/40' :
                           'bg-white/15 border border-white/20'
              }`}>
                <p className={`text-3xl font-black ${isUrgent ? 'text-red-200' : 'text-white'}`}>{days}</p>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">days left</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs text-white/60 mb-1.5">
                <span>Started {formatDate(subscription.start_date)}</span>
                <span>Expires {formatDate(subscription.end_date)}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isUrgent ? 'bg-red-400' : isWarn ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, (days / 365) * 100))}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  Paid ₹{parseFloat(subscription.amount_paid).toFixed(0)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white/50" />
                  {formatDate(subscription.end_date)}
                </span>
              </div>
              <div className="flex gap-2">
                {isWarn && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all border border-white/20 flex items-center gap-1.5"
                  >
                    🔄 Renew
                  </button>
                )}
                <Link href="/dashboard/services">
                  <button className="bg-white text-gray-900 text-sm font-black px-5 py-2 rounded-xl hover:bg-white/90 transition-all shadow-lg flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Browse Services
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <SubscriptionModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubscribed={handleSubscribed}
            walletBalance={walletBalance}
          />
        )}
      </>
    );
  }

  /* ─── NO SUBSCRIPTION VIEW — REDESIGNED FOR MAXIMUM VISIBILITY ─────────── */
  const cheapestPlan = plans[0];

  return (
    <>
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400/50 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700">
        {/* Bright decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl" />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-white/10 rounded-full blur-xl" />

        {/* Bright sparkles */}
        <div className="absolute top-8 right-32 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
        <div className="absolute top-16 right-20 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-75" />
        <div className="absolute bottom-12 left-24 w-2 h-2 bg-pink-300 rounded-full animate-pulse delay-150" />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-start gap-4">
              {/* Glowing crown */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-3 shadow-2xl">
                  <Crown className="w-8 h-8 text-yellow-900" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-300 text-xs font-black uppercase tracking-widest">Premium Feature</span>
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full">NEW</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
                  Unlock Subscriber Prices
                </h2>
                <p className="text-white text-base font-medium max-w-md">
                  Subscribe once, save on every service. Plans from{' '}
                  <span className="text-yellow-300 font-black text-lg">₹{cheapestPlan ? parseFloat(cheapestPlan.amount).toFixed(0) : '299'}/month</span>
                </p>
              </div>
            </div>

            {/* CTA button */}
            <button
              onClick={() => setShowModal(true)}
              className="group relative flex-shrink-0 overflow-hidden bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-yellow-900 font-black px-8 py-4 rounded-2xl shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300 flex items-center gap-3 text-base"
            >
              <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              <Crown className="w-6 h-6 relative" />
              <span className="relative">View Plans</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Benefits grid — BRIGHT WHITE TEXT */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BENEFITS.map(({ icon, label, desc }) => (
              <div
                key={label}
                className="bg-white/15 hover:bg-white/25 border-2 border-white/30 rounded-2xl p-4 transition-all group cursor-default backdrop-blur-sm"
              >
                <div className="text-4xl mb-2">{icon}</div>
                <p className="text-white font-black text-sm leading-tight mb-1">{label}</p>
                <p className="text-white font-medium text-xs">{desc}</p>
              </div>
            ))}
          </div>

          {/* Plans preview strip — BRIGHT TEXT */}
          {plans.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2.5 bg-white/20 hover:bg-white/30 border-2 border-white/30 rounded-xl px-4 py-2.5 transition-all group backdrop-blur-sm"
                >
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-white font-black text-sm">{plan.name}</span>
                  <span className="text-yellow-300 font-black text-base">₹{parseFloat(plan.amount).toFixed(0)}</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <SubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubscribed={handleSubscribed}
          walletBalance={walletBalance}
        />
      )}
    </>
  );
}
