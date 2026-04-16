'use client';

import { useState, useEffect } from 'react';
import { Crown, Calendar, Clock, CheckCircle, XCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';
import SubscriptionModal from './SubscriptionModal';
import Link from 'next/link';

interface SubscriptionStatusCardProps {
  walletBalance?: number;
  onSubscriptionChange?: () => void;
  compact?: boolean;
}

export default function SubscriptionStatusCard({
  walletBalance = 0,
  onSubscriptionChange,
  compact = false,
}: SubscriptionStatusCardProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(walletBalance);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/subscriptions/my-subscription');
      const data = await res.json();
      if (data.success) setSubscription(data.subscription);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (data.success) {
        setCurrentBalance(typeof data.data.balance === 'string' ? parseFloat(data.data.balance) : data.data.balance);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSubscription();
    fetchBalance();
  }, []);

  const handleSubscribed = () => {
    setShowModal(false);
    fetchSubscription();
    fetchBalance();
    onSubscriptionChange?.();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getDaysRemaining = (endDate: string) => {
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ─── COMPACT MODE (for dashboard sidebar / top strip) ───────────────────────
  if (compact) {
    if (loading) {
      return <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />;
    }

    if (subscription) {
      const days = getDaysRemaining(subscription.end_date);
      return (
        <>
          <Link href="/dashboard/subscription">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-3 text-white cursor-pointer hover:from-purple-700 hover:to-indigo-800 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-400 rounded-lg p-1">
                    <Crown className="w-3.5 h-3.5 text-yellow-900" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white leading-tight">{subscription.plan?.name}</p>
                    <p className="text-[10px] text-purple-200 leading-tight">
                      {days <= 7 ? (
                        <span className="text-red-300 font-bold">⚠ {days}d left</span>
                      ) : (
                        `${days} days left`
                      )}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-300 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
          {showModal && (
            <SubscriptionModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              onSubscribed={handleSubscribed}
              walletBalance={currentBalance}
            />
          )}
        </>
      );
    }

    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-300/50 rounded-xl p-3 text-left hover:from-purple-500/30 hover:to-indigo-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 rounded-lg p-1">
                <Crown className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-black text-purple-800 leading-tight">Get Subscription</p>
                <p className="text-[10px] text-purple-500 leading-tight">Save on services</p>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </button>
        {showModal && (
          <SubscriptionModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubscribed={handleSubscribed}
            walletBalance={currentBalance}
          />
        )}
      </>
    );
  }

  // ─── FULL CARD MODE (for profile / subscription page) ───────────────────────
  if (loading) {
    return (
      <div className="rounded-3xl overflow-hidden border border-gray-200 animate-pulse">
        <div className="h-28 bg-gray-200" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (subscription) {
    const days = getDaysRemaining(subscription.end_date);
    const isExpiringSoon = days <= 30;
    const isUrgent = days <= 7;

    return (
      <>
        <div className="rounded-3xl overflow-hidden shadow-lg border border-purple-200">
          {/* Active header */}
          <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-6 text-white relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-white/10 rounded-full" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-yellow-400 rounded-xl p-1.5">
                    <Crown className="w-5 h-5 text-yellow-900" />
                  </div>
                  <span className="text-sm font-black text-yellow-300 uppercase tracking-wider">Active Subscription</span>
                </div>
                <h3 className="text-2xl font-black text-white">{subscription.plan?.name}</h3>
                <p className="text-purple-200 text-sm mt-0.5">{subscription.plan?.description}</p>
              </div>
              <span className="bg-green-400 text-green-900 text-xs font-black px-3 py-1 rounded-full">
                ✓ ACTIVE
              </span>
            </div>

            {/* Days remaining bar */}
            <div className="relative mt-4">
              <div className="flex justify-between text-xs text-purple-200 mb-1">
                <span>Started {formatDate(subscription.start_date)}</span>
                <span className={isUrgent ? 'text-red-300 font-bold' : ''}>
                  {isUrgent ? `⚠ ${days} days left!` : `${days} days remaining`}
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isUrgent ? 'bg-red-400' : isExpiringSoon ? 'bg-yellow-400' : 'bg-green-400'}`}
                  style={{
                    width: `${Math.min(100, Math.max(5, (days / 365) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-50 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-500 font-medium">Expires</span>
                </div>
                <p className="font-black text-gray-800 text-sm">{formatDate(subscription.end_date)}</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500 font-medium">Amount Paid</span>
                </div>
                <p className="font-black text-gray-800 text-sm">₹{parseFloat(subscription.amount_paid).toFixed(2)}</p>
              </div>
            </div>

            {isExpiringSoon && (
              <div className={`rounded-2xl p-4 mb-4 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                <p className={`text-sm font-semibold mb-2 ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
                  {isUrgent ? '🚨 Expiring very soon!' : '⚠️ Expiring soon!'} Renew to keep your discounts.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isUrgent
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  🔄 Renew Subscription
                </button>
              </div>
            )}

            <Link href="/dashboard/services">
              <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-yellow-300" /> Browse Services at Subscriber Prices
              </button>
            </Link>
          </div>
        </div>

        {showModal && (
          <SubscriptionModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubscribed={handleSubscribed}
            walletBalance={currentBalance}
          />
        )}
      </>
    );
  }

  // No subscription
  return (
    <>
      <div className="rounded-3xl overflow-hidden shadow-md border border-gray-200">
        {/* No subscription header */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gray-200 rounded-xl p-2">
              <XCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="font-black text-gray-700 text-lg">No Active Subscription</h3>
              <p className="text-gray-400 text-sm">Subscribe to unlock discounted prices</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5">
          {/* Benefits preview */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: '🏷️', title: 'Discounted Prices', desc: 'Pay less on every service' },
              { icon: '⚡', title: 'Instant Activation', desc: 'Active immediately' },
              { icon: '💳', title: 'Wallet Payment', desc: 'No extra charges' },
              { icon: '🔄', title: 'Easy Renewal', desc: 'Extend anytime' },
            ].map((b) => (
              <div key={b.title} className="bg-purple-50 rounded-2xl p-3">
                <div className="text-xl mb-1">{b.icon}</div>
                <p className="text-xs font-bold text-purple-800">{b.title}</p>
                <p className="text-[10px] text-purple-500">{b.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-4 rounded-2xl font-black text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <Crown className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
            View Subscription Plans
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {showModal && (
        <SubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubscribed={handleSubscribed}
          walletBalance={currentBalance}
        />
      )}
    </>
  );
}
