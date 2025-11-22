'use client';

import { useState, useEffect } from 'react';

interface ReferralCode {
  id: string;
  referral_code: string;
  total_referrals: number;
  successful_referrals: number;
  total_rewards_earned: number;
  is_active: boolean;
}

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [formData, setFormData] = useState({
    referred_name: '',
    referred_email: '',
    referred_phone: ''
  });

  useEffect(() => {
    fetchReferralCode();
  }, []);

  const fetchReferralCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/generate-code', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReferralCode(data.referralCode);
    } catch (error) {
      console.error('Error fetching referral code:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/generate-code', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReferralCode(data.referralCode);
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/referrals/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          referral_code: referralCode?.referral_code,
          ...formData
        })
      });

      if (response.ok) {
        alert('Referral submitted successfully!');
        setFormData({ referred_name: '', referred_email: '', referred_phone: '' });
        setShowReferralForm(false);
        fetchReferralCode();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit referral');
      }
    } catch (error) {
      console.error('Error submitting referral:', error);
      alert('Failed to submit referral');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Referral Program</h1>

      {!referralCode ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold mb-4">Start Earning Rewards!</h2>
          <p className="text-gray-600 mb-6">
            Generate your unique referral code and start inviting retailers
          </p>
          <button
            onClick={generateCode}
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700"
          >
            Generate My Referral Code
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-bold">{referralCode.total_referrals}</div>
              <div className="text-sm opacity-90">Total Referrals</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold">{referralCode.successful_referrals}</div>
              <div className="text-sm opacity-90">Successful</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-3xl font-bold">₹{referralCode.total_rewards_earned}</div>
              <div className="text-sm opacity-90">Total Rewards</div>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Your Referral Code</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 bg-gray-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{referralCode.referral_code}</div>
              </div>
              <button
                onClick={copyReferralLink}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Share this link:</strong><br />
                {window.location.origin}/register?ref={referralCode.referral_code}
              </p>
            </div>
          </div>

          {/* Refer Someone */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={() => setShowReferralForm(!showReferralForm)}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-lg font-bold hover:from-red-700 hover:to-orange-700"
            >
              {showReferralForm ? 'Hide Form' : '+ Refer Someone'}
            </button>

            {showReferralForm && (
              <form onSubmit={handleSubmitReferral} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.referred_name}
                    onChange={(e) => setFormData({ ...formData, referred_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.referred_email}
                    onChange={(e) => setFormData({ ...formData, referred_email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    value={formData.referred_phone}
                    onChange={(e) => setFormData({ ...formData, referred_phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700"
                >
                  Submit Referral
                </button>
              </form>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl mb-3">📤</div>
                <h3 className="font-bold mb-2">1. Share</h3>
                <p className="text-sm text-gray-600">Share your referral link with potential retailers</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-3">✍️</div>
                <h3 className="font-bold mb-2">2. They Register</h3>
                <p className="text-sm text-gray-600">They sign up using your referral code</p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="font-bold mb-2">3. Earn Rewards</h3>
                <p className="text-sm text-gray-600">Both of you receive rewards in your wallet</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
