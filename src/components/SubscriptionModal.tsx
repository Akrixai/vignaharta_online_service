'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X, Crown, Check, ArrowRight, Shield, Lock, Zap, CreditCard, Star } from 'lucide-react';
import { env } from '@/lib/env';

declare global { interface Window { Cashfree: any; } }

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed: () => void;
  onContinueWithoutSubscription?: () => void;
  walletBalance?: number; // kept for API compat but no longer shown
}

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: '1 Month',
  QUARTERLY: '3 Months',
  HALF_YEARLY: '6 Months',
  YEARLY: '12 Months',
};

const PERIOD_ICONS: Record<string, string> = {
  MONTHLY: '📅',
  QUARTERLY: '🗓️',
  HALF_YEARLY: '📆',
  YEARLY: '🏆',
};

const PERIOD_GRADIENTS: Record<string, string> = {
  MONTHLY: 'from-blue-500 to-blue-600',
  QUARTERLY: 'from-purple-500 to-purple-600',
  HALF_YEARLY: 'from-orange-500 to-orange-600',
  YEARLY: 'from-yellow-500 to-amber-600',
};

const PERIOD_BADGE: Record<string, string | null> = {
  MONTHLY: null,
  QUARTERLY: '⭐ Popular',
  HALF_YEARLY: '💎 Best Value',
  YEARLY: '🏆 Best Deal',
};

const TRUST_BADGES = [
  { icon: Shield, label: '100% Secure', sub: 'SSL Encrypted' },
  { icon: Lock,   label: 'Safe Payment', sub: 'Cashfree PG' },
  { icon: Zap,    label: 'Instant Active', sub: 'After Payment' },
];

export default function SubscriptionModal({
  isOpen,
  onClose,
  onSubscribed,
  onContinueWithoutSubscription,
}: SubscriptionModalProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchPlans();
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions/plans');
      const data = await res.json();
      if (data.success) setPlans(data.plans || []);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const loadCashfreeSDK = (): Promise<any> =>
    new Promise((resolve, reject) => {
      if (window.Cashfree) { resolve(window.Cashfree); return; }
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.async = true;
      s.onload = () => window.Cashfree ? resolve(window.Cashfree) : reject(new Error('SDK load failed'));
      s.onerror = () => reject(new Error('Failed to load payment SDK'));
      document.head.appendChild(s);
    });

  const handlePayNow = async (plan: any) => {
    setPayingPlanId(plan.id);
    try {
      // Create Cashfree order for subscription
      const res = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to initiate payment');
        return;
      }

      const { payment_session_id, order_id, total_amount } = data.data;

      // Load Cashfree SDK and open modal
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
        } else {
          // Success or redirect — go to success page
          window.location.href = `/payment/success?order_id=${order_id}&amount=${total_amount}&type=subscription`;
        }
      }).catch(() => {
        window.location.href = `/payment/failed?order_id=${order_id}&amount=${total_amount}`;
      });
    } catch (err: any) {
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setPayingPlanId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-6 rounded-t-3xl text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-400 rounded-2xl p-2.5 shadow-lg">
                <Crown className="w-6 h-6 text-yellow-900" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Subscribe & Save</h2>
                <p className="text-purple-200 text-sm">Get discounted prices on all services</p>
              </div>
            </div>

            {/* Benefits strip */}
            <div className="flex flex-wrap gap-2">
              {['Discounted service prices', 'Instant activation', 'All services access'].map((b) => (
                <span key={b} className="flex items-center gap-1 text-xs font-semibold text-white bg-white/15 border border-white/20 px-3 py-1.5 rounded-full">
                  <Check className="w-3 h-3 text-green-300" /> {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* ── Trust Badges ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center bg-green-50 border border-green-200 rounded-2xl p-3">
                <div className="bg-green-100 rounded-xl p-2 mb-1.5">
                  <Icon className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-green-800 font-black text-xs leading-tight">{label}</p>
                <p className="text-green-600 text-[10px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Payment method badge ──────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 mb-5">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600 text-sm font-semibold">Pay securely via</span>
            <div className="flex items-center gap-1.5">
              <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">Cashfree</span>
              <span className="text-gray-400 text-xs">UPI · Cards · Net Banking</span>
            </div>
            <Lock className="w-4 h-4 text-green-500" />
          </div>

          {/* ── Plans ────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading plans...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {plans.map((plan) => {
                const baseAmount = parseFloat(plan.amount);
                const gst = Math.round(baseAmount * 2) / 100;
                const total = parseFloat((baseAmount + gst).toFixed(2));
                const gradient = PERIOD_GRADIENTS[plan.billing_period] || 'from-gray-500 to-gray-600';
                const badge = PERIOD_BADGE[plan.billing_period];
                const isPaying = payingPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className="relative rounded-2xl overflow-hidden border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-200"
                  >
                    {badge && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm">
                        {badge}
                      </div>
                    )}

                    {/* Plan header */}
                    <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
                      <div className="text-2xl mb-1">{PERIOD_ICONS[plan.billing_period]}</div>
                      <h4 className="font-black text-lg leading-tight">{plan.name}</h4>
                      <p className="text-white/80 text-xs">{PERIOD_LABELS[plan.billing_period]}</p>
                    </div>

                    {/* Plan body */}
                    <div className="p-4 bg-white">
                      {/* Price breakdown */}
                      <div className="space-y-1 mb-3 text-sm">
                        <div className="flex justify-between text-gray-500">
                          <span>Base price</span>
                          <span className="font-semibold text-gray-700">₹{baseAmount.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400 text-xs">
                          <span>GST (2%)</span>
                          <span>₹{gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black text-gray-900 border-t pt-1.5">
                          <span>Total payable</span>
                          <span className="text-purple-700">₹{total.toFixed(2)}</span>
                        </div>
                      </div>

                      {plan.description && (
                        <p className="text-gray-400 text-xs mb-3 line-clamp-1">{plan.description}</p>
                      )}

                      {/* Pay button */}
                      <button
                        onClick={() => handlePayNow(plan)}
                        disabled={!!payingPlanId}
                        className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-black py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 text-sm`}
                      >
                        {isPaying ? (
                          <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Processing...</>
                        ) : (
                          <><Zap className="w-4 h-4 text-yellow-300" /> Pay ₹{total.toFixed(2)}</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Security footer ───────────────────────────────────────────── */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-gray-500 text-xs font-medium">
              🔒 256-bit SSL Encrypted · Powered by Cashfree Payments · PCI DSS Compliant
            </span>
          </div>

          {/* ── Continue without subscription ────────────────────────────── */}
          {onContinueWithoutSubscription && (
            <div className="border-t border-gray-100 pt-4 text-center">
              <p className="text-gray-400 text-xs mb-2">Not interested right now?</p>
              <button
                onClick={onContinueWithoutSubscription}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium underline underline-offset-2 transition-colors flex items-center gap-1 mx-auto"
              >
                Continue at regular price <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
